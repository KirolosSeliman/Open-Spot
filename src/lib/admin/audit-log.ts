import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import {
  formatAuditActionLabel,
  getAuditCategory,
  getAuditImportance,
  isAuditViewAction,
  isSmsOrComplianceCategory,
  type AuditCategory,
  type AuditCategoryFilter,
  type AuditImportance,
  type AuditImportanceFilter
} from "@/lib/admin/audit-formatting";
import { parseAdminDateRange, type AdminDateRangeKey } from "@/lib/admin/date-range";
import { adminSearchMatches } from "@/lib/admin/search";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

const pageSize = 25;
const fetchLimit = 500;

export type PlatformAdminAuditLogRow = {
  id: string;
  platform_admin_id: string | null;
  admin_email: string | null;
  organization_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
};

export type EnrichedPlatformAdminAuditLogRow = PlatformAdminAuditLogRow & {
  label: string;
  category: AuditCategory;
  importance: AuditImportance;
};

export type AuditLogFilters = {
  q: string;
  category: AuditCategoryFilter;
  importance: AuditImportanceFilter;
  showViewed: boolean;
  range: AdminDateRangeKey;
  from?: string;
  to?: string;
  page: number;
};

export type AuditLogStats = {
  displayedCount: number;
  criticalCount: number;
  smsComplianceCount: number;
  hiddenViewCount: number;
  viewHidden: boolean;
  totalFiltered: number;
};

export type AuditLogPageResult = {
  page: number;
  rows: EnrichedPlatformAdminAuditLogRow[];
  stats: AuditLogStats;
  filters: AuditLogFilters;
  hasNextPage: boolean;
  rangeLabel: string;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseAuditLogFilters(
  searchParams: Record<string, string | string[] | undefined>
): AuditLogFilters {
  const category = one(searchParams.category);
  const importance = one(searchParams.importance);
  const showViewedRaw = one(searchParams.showViewed);
  const range = one(searchParams.range);

  const validCategories: AuditCategoryFilter[] = [
    "all",
    "sms",
    "company",
    "billing",
    "compliance",
    "client",
    "system",
    "security",
    "view"
  ];

  const validImportance: AuditImportanceFilter[] = [
    "all",
    "critical",
    "normal",
    "view"
  ];

  return {
    q: String(one(searchParams.q) ?? "").trim(),
    category: validCategories.includes(category as AuditCategoryFilter)
      ? (category as AuditCategoryFilter)
      : "all",
    importance: validImportance.includes(importance as AuditImportanceFilter)
      ? (importance as AuditImportanceFilter)
      : "all",
    showViewed: showViewedRaw === "true" || showViewedRaw === "show",
    range:
      range === "7d" || range === "90d" || range === "custom" ? range : "30d",
    from: one(searchParams.from),
    to: one(searchParams.to),
    page: Math.max(1, Number(one(searchParams.page) ?? 1) || 1)
  };
}

function enrichAuditLogRow(row: PlatformAdminAuditLogRow): EnrichedPlatformAdminAuditLogRow {
  return {
    ...row,
    label: formatAuditActionLabel(row.action),
    category: getAuditCategory(row.action),
    importance: getAuditImportance(row.action)
  };
}

function matchesCategoryFilter(
  row: EnrichedPlatformAdminAuditLogRow,
  category: AuditCategoryFilter
) {
  if (category === "all") {
    return true;
  }

  if (category === "view") {
    return row.importance === "view";
  }

  return row.category === category;
}

function escapeIlikePattern(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

export function buildAuditLogQueryString(
  filters: AuditLogFilters,
  page = filters.page
) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.category !== "all") {
    params.set("category", filters.category);
  }

  if (filters.importance !== "all") {
    params.set("importance", filters.importance);
  }

  if (filters.showViewed) {
    params.set("showViewed", "true");
  }

  if (filters.range !== "30d") {
    params.set("range", filters.range);
  }

  if (filters.range === "custom" && filters.from) {
    params.set("from", filters.from);
  }

  if (filters.range === "custom" && filters.to) {
    params.set("to", filters.to);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

export async function loadPlatformAdminAuditLog({
  admin,
  searchParams = {}
}: {
  admin: AuthorizedPlatformAdmin;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<AuditLogPageResult> {
  const filters = parseAuditLogFilters(searchParams);
  const range = parseAdminDateRange({
    range: filters.range,
    from: filters.from,
    to: filters.to
  });
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  let query = supabase
    .from("platform_admin_audit_logs")
    .select(
      "id, platform_admin_id, admin_email, organization_id, action, entity_type, entity_id, metadata, created_at"
    )
    .gte("created_at", range.fromIso)
    .lte("created_at", range.toIso)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (filters.q) {
    const pattern = `%${escapeIlikePattern(filters.q)}%`;
    query = query.or(
      [
        `action.ilike.${pattern}`,
        `admin_email.ilike.${pattern}`,
        `organization_id.ilike.${pattern}`,
        `entity_id.ilike.${pattern}`,
        `entity_type.ilike.${pattern}`
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const enrichedRows = (data ?? []).map(enrichAuditLogRow);
  const allRowsWithoutViewFilter = enrichedRows.filter((row) => {
    if (!matchesCategoryFilter(row, filters.category)) {
      return false;
    }

    if (filters.importance !== "all" && row.importance !== filters.importance) {
      return false;
    }

    if (
      filters.q &&
      !adminSearchMatches(
        [
          row.action,
          row.label,
          row.admin_email,
          row.organization_id,
          row.entity_type,
          row.entity_id,
          JSON.stringify(row.metadata)
        ],
        filters.q
      )
    ) {
      return false;
    }

    return true;
  });

  const hiddenViewCount = allRowsWithoutViewFilter.filter((row) =>
    isAuditViewAction(row.action)
  ).length;

  const filteredRows = allRowsWithoutViewFilter.filter((row) => {
    if (!filters.showViewed && isAuditViewAction(row.action)) {
      return false;
    }

    return true;
  });

  const criticalCount = filteredRows.filter(
    (row) => row.importance === "critical"
  ).length;
  const smsComplianceCount = filteredRows.filter((row) =>
    isSmsOrComplianceCategory(row.category)
  ).length;

  const offset = (filters.page - 1) * pageSize;
  const rows = filteredRows.slice(offset, offset + pageSize);
  const hasNextPage = filteredRows.length > offset + pageSize;

  await recordPlatformAdminAuditLog({
    admin,
    action: "admin.audit.viewed",
    entityType: "platform_admin_audit_logs",
    metadata: {
      page: filters.page,
      filters: {
        q: filters.q || null,
        category: filters.category,
        importance: filters.importance,
        showViewed: filters.showViewed,
        range: filters.range
      }
    }
  });

  return {
    page: filters.page,
    rows,
    stats: {
      displayedCount: rows.length,
      criticalCount,
      smsComplianceCount,
      hiddenViewCount: filters.showViewed ? 0 : hiddenViewCount,
      viewHidden: !filters.showViewed,
      totalFiltered: filteredRows.length
    },
    filters,
    hasNextPage,
    rangeLabel: range.label
  };
}
