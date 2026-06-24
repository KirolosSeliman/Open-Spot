import "server-only";

import {
  calculateBookCallRequestStats,
  filterBookCallRequests,
  type BookCallRequestFilters,
  type BookCallRequestRow
} from "@/lib/book-call/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type {
  BookCallRequestFilters,
  BookCallRequestRow,
  BookCallRequestStats
} from "@/lib/book-call/admin";

export { calculateBookCallRequestStats, filterBookCallRequests };

export async function loadBookCallRequests(
  filters: BookCallRequestFilters = {}
) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return {
      requests: [] as BookCallRequestRow[],
      filteredRequests: [] as BookCallRequestRow[],
      stats: calculateBookCallRequestStats([]),
      error:
        "Book call requests are unavailable until Supabase service access is configured."
    };
  }

  const { data, error } = await supabase
    .from("book_call_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      requests: [] as BookCallRequestRow[],
      filteredRequests: [] as BookCallRequestRow[],
      stats: calculateBookCallRequestStats([]),
      error: error.message
    };
  }

  const requests = data ?? [];

  return {
    requests,
    filteredRequests: filterBookCallRequests(requests, filters),
    stats: calculateBookCallRequestStats(requests),
    error: null
  };
}
