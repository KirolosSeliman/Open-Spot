import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { assertAdminCanAccessOrganization, getAdminVisibleOrganizationIds } from "@/lib/admin/access";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { maskPhoneNumber } from "@/lib/admin/metrics";
import { adminSearchMatches } from "@/lib/admin/search";
import { estimateSmsCostCents, formatEstimatedSmsCost } from "@/lib/admin/sms-cost";
import {
  hasMissingStatusCallback,
  isFailedSmsStatus
} from "@/lib/sms/status-helpers";
import { buildSmsBodyPreview } from "@/lib/sms/webhook-events";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const pageSize = 50;

export type SmsDiagnosticsFilters = {
  direction: "all" | "outbound" | "inbound";
  status: string;
  provider: string;
  organizationId: string;
  q: string;
  page: number;
  onlyFailed: boolean;
  missingCallback: boolean;
  context: string;
  range: ReturnType<typeof parseAdminDateRange>;
};

export type AdminSmsDiagnosticRow = {
  id: string;
  createdAt: string;
  organizationId: string;
  organizationName: string;
  direction: string;
  context: "opening" | "appointment" | "consent" | "unlinked";
  customerName: string | null;
  phoneMasked: string;
  provider: string;
  providerMessageId: string | null;
  status: string;
  delivery: string;
  error: string | null;
  estimatedCost: string;
  bodyPreview: string;
  missingCallback: boolean;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeDirection(value: string | undefined) {
  return value === "outbound" || value === "inbound" ? value : "all";
}

function getSmsContext(row: {
  opening_id: string | null;
  appointment_id: string | null;
  message_type?: string | null;
}) {
  if (row.message_type === "consent_request" || row.message_type === "consent_reply") {
    return "consent" as const;
  }

  if (row.opening_id) {
    return "opening" as const;
  }

  if (row.appointment_id) {
    return "appointment" as const;
  }

  return "unlinked" as const;
}

export function normalizeSmsDiagnosticsFilters(
  searchParams: Record<string, string | string[] | undefined>
): SmsDiagnosticsFilters {
  return {
    direction: normalizeDirection(one(searchParams.direction)),
    status: one(searchParams.status) ?? "all",
    provider: one(searchParams.provider) ?? "all",
    organizationId: one(searchParams.organizationId) ?? "all",
    q: String(one(searchParams.q) ?? "").trim().slice(0, 80),
    page: Math.max(1, Number(one(searchParams.page) ?? 1) || 1),
    onlyFailed: one(searchParams.onlyFailed) === "true",
    missingCallback: one(searchParams.missingCallback) === "true",
    context: one(searchParams.context) ?? "all",
    range: parseAdminDateRange({
      range: one(searchParams.range),
      from: one(searchParams.from),
      to: one(searchParams.to)
    })
  };
}

export async function loadAdminSmsDiagnostics({
  admin,
  searchParams = {},
  organizationId,
  auditAction = "admin.sms.viewed"
}: {
  admin: AuthorizedPlatformAdmin;
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId?: string;
  auditAction?: string;
}) {
  const filters = normalizeSmsDiagnosticsFilters({
    ...searchParams,
    ...(organizationId ? { organizationId } : {})
  });
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const accessibleOrganizationIds = organizationId
    ? [organizationId]
    : await getAdminVisibleOrganizationIds(admin);

  if (organizationId) {
    await assertAdminCanAccessOrganization({ admin, organizationId });
  }

  const visibleOrganizationIds =
    !organizationId && filters.organizationId !== "all"
      ? accessibleOrganizationIds.filter((id) => id === filters.organizationId)
      : accessibleOrganizationIds;

  if (visibleOrganizationIds.length === 0) {
    return { filters, rows: [], hasNextPage: false };
  }

  let query = supabase
    .from("sms_messages")
    .select(
      "id, organization_id, customer_id, opening_id, appointment_id, message_type, direction, provider, provider_message_id, from_number, to_number, body, status, error_code, error_message, status_callback_received_at, delivered_at, failed_at, created_at"
    )
    .in("organization_id", visibleOrganizationIds)
    .gte("created_at", filters.range.fromIso)
    .lte("created_at", filters.range.toIso)
    .order("created_at", { ascending: false })
    .range((filters.page - 1) * pageSize, filters.page * pageSize);

  if (filters.direction !== "all") {
    query = query.eq("direction", filters.direction);
  }

  if (filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.provider !== "all") {
    query = query.eq("provider", filters.provider);
  }

  const { data: rawRows, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  let rows = rawRows ?? [];

  if (filters.onlyFailed) {
    rows = rows.filter((row) => isFailedSmsStatus(row.status));
  }

  if (filters.missingCallback) {
    rows = rows.filter((row) =>
      hasMissingStatusCallback({
        provider: row.provider,
        direction: row.direction,
        status: row.status,
        statusCallbackReceivedAt: row.status_callback_received_at,
        createdAt: row.created_at
      })
    );
  }

  if (filters.context !== "all") {
    rows = rows.filter((row) => {
      const context = getSmsContext(row);
      return context === filters.context;
    });
  }

  const organizationIds = [...new Set(rows.map((row) => row.organization_id))];
  const customerIds = [
    ...new Set(rows.map((row) => row.customer_id).filter((id): id is string => Boolean(id)))
  ];
  const [organizationsResult, customersResult] = await Promise.all([
    organizationIds.length
      ? supabase.from("organizations").select("id, name").in("id", organizationIds)
      : Promise.resolve({ data: [], error: null }),
    customerIds.length
      ? supabase.from("customers").select("id, full_name").in("id", customerIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (organizationsResult.error) {
    throw new Error(organizationsResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  const organizationById = new Map(
    (organizationsResult.data ?? []).map((row) => [row.id, row.name])
  );
  const customerById = new Map(
    (customersResult.data ?? []).map((row) => [row.id, row.full_name])
  );
  const mappedRows: AdminSmsDiagnosticRow[] = rows
    .map((row) => {
      const phone = row.direction === "outbound" ? row.to_number : row.from_number;
      const missingCallback = hasMissingStatusCallback({
        provider: row.provider,
        direction: row.direction,
        status: row.status,
        statusCallbackReceivedAt: row.status_callback_received_at,
        createdAt: row.created_at
      });

      return {
        id: row.id,
        createdAt: row.created_at,
        organizationId: row.organization_id,
        organizationName: organizationById.get(row.organization_id) ?? "Unknown",
        direction: row.direction,
        context: getSmsContext(row),
        customerName: row.customer_id ? customerById.get(row.customer_id) ?? null : null,
        phoneMasked: maskPhoneNumber(phone),
        provider: row.provider,
        providerMessageId: row.provider_message_id,
        status: row.status,
        delivery: row.delivered_at
          ? "delivered"
          : row.failed_at
            ? "failed"
            : missingCallback
              ? "missing callback"
              : "pending",
        error: row.error_code ?? row.error_message,
        estimatedCost:
          row.direction === "outbound"
            ? formatEstimatedSmsCost(estimateSmsCostCents({ outboundSmsCount: 1 }))
            : "—",
        bodyPreview: buildSmsBodyPreview(row.body),
        missingCallback
      };
    })
    .filter((row) => {
      const source = rows.find((candidate) => candidate.id === row.id);

      return adminSearchMatches(
        [
          row.organizationName,
          row.customerName,
          row.providerMessageId,
          row.phoneMasked,
          source?.from_number,
          source?.to_number,
          row.error,
          row.status,
          row.provider,
          source?.message_type,
          row.bodyPreview
        ],
        filters.q
      );
    });

  await recordPlatformAdminAuditLog({
    admin,
    organizationId: organizationId ?? null,
    action: auditAction,
    entityType: organizationId ? "organizations" : "sms_messages",
    entityId: organizationId ?? null,
    metadata: {
      filters: {
        direction: filters.direction,
        status: filters.status,
        provider: filters.provider,
        range: filters.range.rangeKey
      }
    }
  });

  return {
    filters,
    rows: mappedRows.slice(0, pageSize),
    hasNextPage: (rawRows ?? []).length > pageSize
  };
}
