import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { assertAdminCanAccessOrganization, getAdminVisibleOrganizationIds } from "@/lib/admin/access";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { maskPhoneNumber } from "@/lib/admin/metrics";
import { adminSearchMatches } from "@/lib/admin/search";
import { classifyInboundSmsBody } from "@/lib/sms/inbound";
import { getInboundReplyClassificationLabel } from "@/lib/sms/status-helpers";
import { buildSmsBodyPreview } from "@/lib/sms/webhook-events";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const pageSize = 50;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export type ReplyDiagnosticsFilters = {
  classification: string;
  linkStatus: string;
  context: string;
  provider: string;
  organizationId: string;
  q: string;
  page: number;
  range: ReturnType<typeof parseAdminDateRange>;
};

export type AdminReplyDiagnosticRow = {
  id: string;
  source: "sms_message" | "webhook_event";
  receivedAt: string;
  organizationId: string | null;
  organizationName: string;
  customerName: string | null;
  phoneMasked: string;
  bodyPreview: string;
  classification: string;
  classificationLabel: string;
  context: "opening" | "appointment" | "unknown";
  provider: string;
  providerMessageId: string | null;
  linkStatus: "linked" | "unlinked";
  note: string | null;
};

export function normalizeReplyDiagnosticsFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReplyDiagnosticsFilters {
  return {
    classification: one(searchParams.classification) ?? "all",
    linkStatus: one(searchParams.linkStatus) ?? "all",
    context: one(searchParams.context) ?? "all",
    provider: one(searchParams.provider) ?? "all",
    organizationId: one(searchParams.organizationId) ?? "all",
    q: String(one(searchParams.q) ?? "").trim().slice(0, 80),
    page: Math.max(1, Number(one(searchParams.page) ?? 1) || 1),
    range: parseAdminDateRange({
      range: one(searchParams.range),
      from: one(searchParams.from),
      to: one(searchParams.to)
    })
  };
}

export async function loadAdminReplyDiagnostics({
  admin,
  searchParams = {},
  organizationId,
  auditAction = "admin.replies.viewed"
}: {
  admin: AuthorizedPlatformAdmin;
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId?: string;
  auditAction?: string;
}) {
  const filters = normalizeReplyDiagnosticsFilters({
    ...searchParams,
    ...(organizationId ? { organizationId } : {})
  });
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  if (organizationId) {
    await assertAdminCanAccessOrganization({ admin, organizationId });
  }

  const accessibleOrganizationIds = organizationId
    ? [organizationId]
    : await getAdminVisibleOrganizationIds(admin);
  const visibleOrganizationIds =
    !organizationId && filters.organizationId !== "all"
      ? accessibleOrganizationIds.filter((id) => id === filters.organizationId)
      : accessibleOrganizationIds;

  if (visibleOrganizationIds.length === 0) {
    return { filters, rows: [], hasNextPage: false };
  }

  const [messagesResult, eventsResult] = await Promise.all([
    filters.linkStatus === "unlinked"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("sms_messages")
          .select(
            "id, organization_id, customer_id, opening_id, appointment_id, provider, provider_message_id, from_number, body, status, created_at"
          )
          .eq("direction", "inbound")
          .in("organization_id", visibleOrganizationIds)
          .gte("created_at", filters.range.fromIso)
          .lte("created_at", filters.range.toIso)
          .order("created_at", { ascending: false })
          .limit(150),
    filters.linkStatus === "linked"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("platform_sms_webhook_events")
          .select(
            "id, organization_id, customer_id, opening_id, appointment_id, provider, provider_message_id, from_number, body_preview, classification, processing_status, created_at"
          )
          .in("event_type", ["inbound", "simulator_inbound"])
          .in("processing_status", ["received_unlinked", "persistence_failed", "error"])
          .gte("created_at", filters.range.fromIso)
          .lte("created_at", filters.range.toIso)
          .order("created_at", { ascending: false })
          .limit(150)
  ]);

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  if (eventsResult.error) {
    throw new Error(eventsResult.error.message);
  }

  const messageRows = messagesResult.data ?? [];
  const eventRows = eventsResult.data ?? [];
  const organizationIds = [
    ...new Set([
      ...messageRows.map((row) => row.organization_id),
      ...eventRows.map((row) => row.organization_id).filter((id): id is string => Boolean(id))
    ])
  ];
  const customerIds = [
    ...new Set([
      ...messageRows.map((row) => row.customer_id).filter((id): id is string => Boolean(id)),
      ...eventRows.map((row) => row.customer_id).filter((id): id is string => Boolean(id))
    ])
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

  const organizationById = new Map((organizationsResult.data ?? []).map((row) => [row.id, row.name]));
  const customerById = new Map((customersResult.data ?? []).map((row) => [row.id, row.full_name]));
  const rows: AdminReplyDiagnosticRow[] = [
    ...messageRows.map((row) => {
      const context = row.appointment_id
        ? "appointment"
        : row.opening_id
          ? "waitlist"
          : "unknown";
      const classification = classifyInboundSmsBody(row.body, context);

      return {
        id: row.id,
        source: "sms_message" as const,
        receivedAt: row.created_at,
        organizationId: row.organization_id,
        organizationName: organizationById.get(row.organization_id) ?? "Unknown",
        customerName: row.customer_id ? customerById.get(row.customer_id) ?? null : null,
        phoneMasked: maskPhoneNumber(row.from_number),
        bodyPreview: buildSmsBodyPreview(row.body),
        classification,
        classificationLabel: getInboundReplyClassificationLabel(classification),
        context: row.opening_id ? "opening" as const : row.appointment_id ? "appointment" as const : "unknown" as const,
        provider: row.provider,
        providerMessageId: row.provider_message_id,
        linkStatus: row.opening_id || row.appointment_id ? "linked" as const : "unlinked" as const,
        note: row.opening_id || row.appointment_id ? null : "Inbound reply is not linked to an opening or appointment."
      };
    }),
    ...eventRows.map((row) => {
      const classification = row.classification ?? "unknown";

      return {
        id: row.id,
        source: "webhook_event" as const,
        receivedAt: row.created_at,
        organizationId: row.organization_id,
        organizationName: row.organization_id ? organizationById.get(row.organization_id) ?? "Unknown" : "Unknown",
        customerName: row.customer_id ? customerById.get(row.customer_id) ?? null : null,
        phoneMasked: maskPhoneNumber(row.from_number),
        bodyPreview: row.body_preview ?? "",
        classification,
        classificationLabel: getInboundReplyClassificationLabel(classification),
        context: row.opening_id ? "opening" as const : row.appointment_id ? "appointment" as const : "unknown" as const,
        provider: row.provider,
        providerMessageId: row.provider_message_id,
        linkStatus: "unlinked" as const,
        note: "Unlinked reply - no prior outbound context matched this sender."
      };
    })
  ]
    .filter((row) => filters.provider === "all" || row.provider === filters.provider)
    .filter((row) => filters.context === "all" || row.context === filters.context)
    .filter((row) => filters.classification === "all" || row.classification === filters.classification)
    .filter((row) => filters.linkStatus === "all" || row.linkStatus === filters.linkStatus)
    .filter((row) =>
      adminSearchMatches(
        [
          row.organizationName,
          row.customerName,
          row.phoneMasked,
          row.bodyPreview,
          row.classification,
          row.classificationLabel,
          row.provider,
          row.providerMessageId,
          row.note
        ],
        filters.q
      )
    )
    .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt));

  await recordPlatformAdminAuditLog({
    admin,
    organizationId: organizationId ?? null,
    action: auditAction,
    entityType: organizationId ? "organizations" : "sms_messages",
    entityId: organizationId ?? null,
    metadata: {
      filters: {
        classification: filters.classification,
        linkStatus: filters.linkStatus,
        context: filters.context,
        range: filters.range.rangeKey
      }
    }
  });

  const start = (filters.page - 1) * pageSize;

  return {
    filters,
    rows: rows.slice(start, start + pageSize),
    hasNextPage: rows.length > start + pageSize
  };
}
