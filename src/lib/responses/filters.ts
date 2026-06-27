import {
  filterOpeningResponseGroups,
  normalizeOpeningResponsesFilters,
  type OpeningResponseGroup
} from "@/lib/dashboard/operations-data";

import type {
  ExtendedOpeningFilters,
  OpeningStatusFilter,
  ResponsesSearchParams
} from "./types";

export type { ExtendedOpeningFilters, OpeningStatusFilter, ResponsesSearchParams };

const openingStatusFilters = new Set<OpeningStatusFilter>([
  "all",
  "filled",
  "awaiting"
]);

const pageSizes = new Set([10, 20, 50]);

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parsePositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeResponsesTab(tab: string | undefined): "openings" | "appointments" {
  return tab === "appointments" ? "appointments" : "openings";
}

export function normalizeExtendedOpeningFilters(
  params: ResponsesSearchParams
): ExtendedOpeningFilters {
  const base = normalizeOpeningResponsesFilters(params);
  const rawStatus = getSingleSearchParam(params.status) as OpeningStatusFilter;

  return {
    ...base,
    status: openingStatusFilters.has(rawStatus) ? rawStatus : "all",
    page: parsePositiveInt(getSingleSearchParam(params.page), 1),
    pageSize: pageSizes.has(
      parsePositiveInt(getSingleSearchParam(params.pageSize), 10)
    )
      ? parsePositiveInt(getSingleSearchParam(params.pageSize), 10)
      : 10
  };
}

function matchesOpeningStatusFilter(
  group: OpeningResponseGroup,
  status: OpeningStatusFilter
) {
  if (status === "all") {
    return true;
  }

  if (status === "filled") {
    return group.openingStatus === "filled";
  }

  return ["awaiting_validation", "broadcasting", "draft"].includes(
    group.openingStatus
  );
}

export function filterOpeningGroupsExtended(
  groups: OpeningResponseGroup[],
  filters: ExtendedOpeningFilters,
  now = new Date()
): OpeningResponseGroup[] {
  return filterOpeningResponseGroups(groups, filters, now).filter((group) =>
    matchesOpeningStatusFilter(group, filters.status)
  );
}

export function paginateOpeningGroups(
  groups: OpeningResponseGroup[],
  page: number,
  pageSize: number
) {
  const total = groups.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: groups.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages
  };
}

export function buildResponsesHref(
  filters: ExtendedOpeningFilters,
  tab: "openings" | "appointments" = "openings",
  calendar?: { interval: string; date: string }
) {
  const params = new URLSearchParams({ tab });

  if (tab === "openings") {
    if (filters.range !== "all") {
      params.set("range", filters.range);
    }

    if (filters.serviceId !== "all") {
      params.set("serviceId", filters.serviceId);
    }

    if (filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters.q) {
      params.set("q", filters.q);
    }

    if (filters.page > 1) {
      params.set("page", String(filters.page));
    }

    if (filters.pageSize !== 10) {
      params.set("pageSize", String(filters.pageSize));
    }
  } else if (calendar) {
    params.set("calInterval", calendar.interval);
    params.set("calDate", calendar.date);
  }

  return `/dashboard/responses?${params.toString()}`;
}

export function buildOpeningFiltersResetHref() {
  return "/dashboard/responses?tab=openings";
}
