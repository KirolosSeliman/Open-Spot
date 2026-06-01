import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardOverview = {
  organizationName: string;
  customersCount: number;
  waitlistEntriesCount: number;
  servicesCount: number;
  openingsCount: number;
  pendingRepliesCount: number;
  recoveredBookingsCount: number;
  recoveredRevenueCents: number;
  smsSentCount: number;
  setup: {
    hasServices: boolean;
    hasCustomers: boolean;
    hasWaitlistEntries: boolean;
    hasOpenings: boolean;
  };
};

type DashboardOverviewCounts = Omit<DashboardOverview, "setup">;

type CountResult = {
  count: number | null;
  error: {
    message: string;
  } | null;
};

type RecoveredBookingRow = {
  recovered_value_cents: number | null;
};

export function assertDashboardOrganizationId(organizationId: string) {
  if (!organizationId.trim()) {
    throw new Error("Organization id is required for dashboard data.");
  }

  return organizationId;
}

export function calculateRecoveredRevenueCents(rows: RecoveredBookingRow[]) {
  return rows.reduce(
    (total, row) => total + (row.recovered_value_cents ?? 0),
    0
  );
}

export function buildDashboardOverview(
  counts: DashboardOverviewCounts
): DashboardOverview {
  return {
    ...counts,
    setup: {
      hasServices: counts.servicesCount > 0,
      hasCustomers: counts.customersCount > 0,
      hasWaitlistEntries: counts.waitlistEntriesCount > 0,
      hasOpenings: counts.openingsCount > 0
    }
  };
}

function readCount(label: string, result: CountResult) {
  if (result.error) {
    throw new Error(`${label} count failed: ${result.error.message}`);
  }

  return result.count ?? 0;
}

export async function loadDashboardOverview({
  organizationId,
  organizationName
}: {
  organizationId: string;
  organizationName: string;
}): Promise<DashboardOverview> {
  assertDashboardOrganizationId(organizationId);

  const supabase = await createSupabaseServerClient();

  const [
    customersResult,
    waitlistEntriesResult,
    servicesResult,
    openingsResult,
    pendingRepliesResult,
    recoveredBookingsResult,
    smsSentResult,
    recoveredRevenueResult
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("waitlist_entries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("openings")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("opening_offers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "responded"),
    supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["confirmed", "completed"]),
    supabase
      .from("sms_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("direction", "outbound"),
    supabase
      .from("booking_requests")
      .select("recovered_value_cents")
      .eq("organization_id", organizationId)
      .in("status", ["confirmed", "completed"])
  ]);

  if (recoveredRevenueResult.error) {
    throw new Error(
      `Recovered revenue query failed: ${recoveredRevenueResult.error.message}`
    );
  }

  return buildDashboardOverview({
    organizationName,
    customersCount: readCount("Customers", customersResult),
    waitlistEntriesCount: readCount("Waitlist entries", waitlistEntriesResult),
    servicesCount: readCount("Services", servicesResult),
    openingsCount: readCount("Openings", openingsResult),
    pendingRepliesCount: readCount("Pending replies", pendingRepliesResult),
    recoveredBookingsCount: readCount(
      "Recovered bookings",
      recoveredBookingsResult
    ),
    recoveredRevenueCents: calculateRecoveredRevenueCents(
      recoveredRevenueResult.data ?? []
    ),
    smsSentCount: readCount("SMS sent", smsSentResult)
  });
}
