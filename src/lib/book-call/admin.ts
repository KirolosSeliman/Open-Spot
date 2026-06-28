import type { Database } from "@/types/database";

export type BookCallRequestRow =
  Database["public"]["Tables"]["book_call_requests"]["Row"];

export type BookCallRequestDateRange = "7" | "30" | "90" | "all";

export type BookCallRequestFilters = {
  q?: string;
  status?: string;
  range?: string;
};

function parseDateRange(range: string | undefined): BookCallRequestDateRange {
  if (range === "7" || range === "30" || range === "90" || range === "all") {
    return range;
  }

  return "30";
}

function matchesDateRange(
  request: BookCallRequestRow,
  range: BookCallRequestDateRange
) {
  if (range === "all") {
    return true;
  }

  const createdAt = new Date(request.created_at).getTime();

  if (Number.isNaN(createdAt)) {
    return false;
  }

  const days = Number(range);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return createdAt >= cutoff;
}

export type BookCallRequestStats = {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
};

function normalizeSearch(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesSearch(request: BookCallRequestRow, q: string) {
  if (!q) {
    return true;
  }

  return [
    request.full_name,
    request.business_name,
    request.email,
    request.phone,
    request.business_type,
    request.current_booking_system,
    request.cancellation_volume,
    request.preferred_time_message
  ].some((value) => normalizeSearch(value).includes(q));
}

export function filterBookCallRequests(
  requests: BookCallRequestRow[],
  filters: BookCallRequestFilters
) {
  const q = normalizeSearch(filters.q);
  const status = filters.status && filters.status !== "all" ? filters.status : null;
  const range = parseDateRange(filters.range);

  return requests.filter(
    (request) =>
      (!status || request.status === status) &&
      matchesSearch(request, q) &&
      matchesDateRange(request, range)
  );
}

export function calculateBookCallRequestStats(
  requests: BookCallRequestRow[]
): BookCallRequestStats {
  return {
    total: requests.length,
    new: requests.filter((request) => request.status === "new").length,
    contacted: requests.filter((request) => request.status === "contacted").length,
    qualified: requests.filter((request) => request.status === "qualified").length
  };
}
