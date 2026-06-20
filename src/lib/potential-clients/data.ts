import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

export type PotentialClientRow =
  Database["public"]["Tables"]["potential_clients"]["Row"];

export type PotentialClientFilters = {
  q?: string;
  status?: string;
};

export type PotentialClientStats = {
  new: number;
  contacted: number;
  callBooked: number;
  won: number;
};

function normalizeSearch(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesSearch(lead: PotentialClientRow, q: string) {
  if (!q) {
    return true;
  }

  return [
    lead.full_name,
    lead.business_name,
    lead.business_type,
    lead.email,
    lead.phone,
    lead.message
  ].some((value) => normalizeSearch(value).includes(q));
}

export function filterPotentialClients(
  leads: PotentialClientRow[],
  filters: PotentialClientFilters
) {
  const q = normalizeSearch(filters.q);
  const status = filters.status && filters.status !== "all" ? filters.status : null;

  return leads.filter(
    (lead) => (!status || lead.status === status) && matchesSearch(lead, q)
  );
}

export function calculatePotentialClientStats(
  leads: PotentialClientRow[]
): PotentialClientStats {
  return {
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    callBooked: leads.filter((lead) => lead.status === "call_booked").length,
    won: leads.filter((lead) => lead.status === "won").length
  };
}

export async function loadPotentialClients(filters: PotentialClientFilters = {}) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return {
      leads: [] as PotentialClientRow[],
      filteredLeads: [] as PotentialClientRow[],
      stats: calculatePotentialClientStats([]),
      error: "Potential client data is unavailable until Supabase service access is configured."
    };
  }

  const { data, error } = await supabase
    .from("potential_clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      leads: [] as PotentialClientRow[],
      filteredLeads: [] as PotentialClientRow[],
      stats: calculatePotentialClientStats([]),
      error: error.message
    };
  }

  const leads = data ?? [];

  return {
    leads,
    filteredLeads: filterPotentialClients(leads, filters),
    stats: calculatePotentialClientStats(leads),
    error: null
  };
}
