import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateAutomationOutcomeMetrics } from "@/lib/reports/metrics";

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
  openingAlertsSentCount: number;
  openingResponsesCount: number;
  openingResponseRate: number;
  automation: ReturnType<typeof calculateAutomationOutcomeMetrics>;
  actionItems: DashboardActionItems;
  setup: {
    hasServices: boolean;
    hasCustomers: boolean;
    hasWaitlistEntries: boolean;
    hasOpenings: boolean;
  };
};

type DashboardOverviewCounts = Omit<DashboardOverview, "setup">;

type DashboardActionItems = {
  appointmentsNeedingFollowUp: number;
  failedReminderSends: number;
  cancellationsAwaitingAction: number;
  waitlistRespondentsAwaitingValidation: number;
};

export type AnalyticsPeriod = "current_month" | "current_year" | "last_30_days";

export type AnalyticsPeriodWindow = {
  period: AnalyticsPeriod;
  start: string;
  end: string;
};

type CountResult = {
  count: number | null;
  error: {
    message: string;
  } | null;
};

type RecoveredBookingRow = {
  recovered_value_cents: number | null;
};

type AppointmentMetricRow = {
  id: string;
  starts_at: string;
  status: string;
  reminder_status: string;
  confirmation_status: string;
};

type AppointmentEventMetricRow = {
  appointment_id: string;
  event_type: string;
};

type RecoveryOpeningMetricRow = {
  id: string;
  source_appointment_id: string | null;
  status: string;
};

type RecoveryAlertMetricRow = {
  id: string;
  opening_id: string | null;
};

type RecoveryReplyMetricRow = {
  id: string;
  opening_id: string;
  status: string;
};

type RecoveredBookingMetricRow = {
  id: string;
  opening_id: string;
  status: string;
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

export function normalizeAnalyticsPeriod(
  value: string | null | undefined
): AnalyticsPeriod {
  if (value === "current_year" || value === "last_30_days") {
    return value;
  }

  return "current_month";
}

export function getAnalyticsPeriodWindow(
  period: AnalyticsPeriod,
  now = new Date()
): AnalyticsPeriodWindow {
  const end = new Date(now);
  let start: Date;

  if (period === "current_year") {
    start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  } else if (period === "last_30_days") {
    start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);
  } else {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  return {
    period,
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export function calculateResponseRate({
  responses,
  sent
}: {
  responses: number;
  sent: number;
}) {
  if (sent <= 0) {
    return 0;
  }

  return Math.round((responses / sent) * 100);
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

export function calculateDashboardActionItems({
  automation,
  pendingRepliesCount,
  recoveryOpenings
}: {
  automation: ReturnType<typeof calculateAutomationOutcomeMetrics>;
  pendingRepliesCount: number;
  recoveryOpenings: RecoveryOpeningMetricRow[];
}): DashboardActionItems {
  const unresolvedRecoveryOpeningIds = new Set(
    recoveryOpenings
      .filter((opening) => !["filled", "expired", "cancelled"].includes(opening.status))
      .map((opening) => opening.id)
  );

  return {
    appointmentsNeedingFollowUp: automation.appointmentsNoResponse,
    failedReminderSends: automation.remindersFailed,
    cancellationsAwaitingAction: unresolvedRecoveryOpeningIds.size,
    waitlistRespondentsAwaitingValidation: pendingRepliesCount
  };
}

export async function loadDashboardOverview({
  organizationId,
  organizationName,
  periodWindow
}: {
  organizationId: string;
  organizationName: string;
  periodWindow?: AnalyticsPeriodWindow | null;
}): Promise<DashboardOverview> {
  assertDashboardOrganizationId(organizationId);

  const supabase = await createSupabaseServerClient();
  let recoveredBookingsCountQuery = supabase
    .from("booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["confirmed", "completed"]);
  let smsSentCountQuery = supabase
    .from("sms_messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("direction", "outbound");
  let recoveredRevenueQuery = supabase
    .from("booking_requests")
    .select("recovered_value_cents")
    .eq("organization_id", organizationId)
    .in("status", ["confirmed", "completed"]);
  let openingAlertsSentQuery = supabase
    .from("sms_messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("direction", "outbound")
    .eq("message_type", "opening_alert");
  let openingResponsesQuery = supabase
    .from("opening_offers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["responded", "selected"]);

  if (periodWindow) {
    recoveredBookingsCountQuery = recoveredBookingsCountQuery
      .gte("created_at", periodWindow.start)
      .lt("created_at", periodWindow.end);
    smsSentCountQuery = smsSentCountQuery
      .gte("created_at", periodWindow.start)
      .lt("created_at", periodWindow.end);
    recoveredRevenueQuery = recoveredRevenueQuery
      .gte("created_at", periodWindow.start)
      .lt("created_at", periodWindow.end);
    openingAlertsSentQuery = openingAlertsSentQuery
      .gte("created_at", periodWindow.start)
      .lt("created_at", periodWindow.end);
    openingResponsesQuery = openingResponsesQuery
      .gte("responded_at", periodWindow.start)
      .lt("responded_at", periodWindow.end);
  }

  const [
    customersResult,
    waitlistEntriesResult,
    servicesResult,
    openingsResult,
    pendingRepliesResult,
    recoveredBookingsResult,
    smsSentResult,
    recoveredRevenueResult,
    openingAlertsSentResult,
    openingResponsesResult,
    appointmentsResult,
    appointmentEventsResult,
    recoveryOpeningsResult
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
    recoveredBookingsCountQuery,
    smsSentCountQuery,
    recoveredRevenueQuery,
    openingAlertsSentQuery,
    openingResponsesQuery,
    supabase
      .from("appointments")
      .select("id, starts_at, status, reminder_status, confirmation_status")
      .eq("organization_id", organizationId),
    supabase
      .from("appointment_events")
      .select("appointment_id, event_type")
      .eq("organization_id", organizationId)
      .eq("event_type", "appointment.sms_cancelled"),
    supabase
      .from("openings")
      .select("id, source_appointment_id, status")
      .eq("organization_id", organizationId)
      .eq("source", "appointment_cancellation")
  ]);

  if (appointmentsResult.error) {
    throw new Error(
      `Appointments query failed: ${appointmentsResult.error.message}`
    );
  }

  if (appointmentEventsResult.error) {
    throw new Error(
      `Appointment events query failed: ${appointmentEventsResult.error.message}`
    );
  }

  if (recoveryOpeningsResult.error) {
    throw new Error(
      `Recovery openings query failed: ${recoveryOpeningsResult.error.message}`
    );
  }

  const recoveryOpeningIds = (recoveryOpeningsResult.data ?? []).map(
    (opening) => opening.id
  );
  const [
    recoveryAlertsResult,
    recoveryRepliesResult,
    recoveryBookingsResult
  ] =
    recoveryOpeningIds.length > 0
      ? await Promise.all([
          supabase
            .from("sms_messages")
            .select("id, opening_id")
            .eq("organization_id", organizationId)
            .eq("direction", "outbound")
            .eq("message_type", "opening_alert")
            .in("opening_id", recoveryOpeningIds),
          supabase
            .from("opening_offers")
            .select("id, opening_id, status")
            .eq("organization_id", organizationId)
            .in("opening_id", recoveryOpeningIds),
          supabase
            .from("booking_requests")
            .select("id, opening_id, status, recovered_value_cents")
            .eq("organization_id", organizationId)
            .in("opening_id", recoveryOpeningIds)
        ])
      : [
          { data: [] as RecoveryAlertMetricRow[], error: null },
          { data: [] as RecoveryReplyMetricRow[], error: null },
          { data: [] as RecoveredBookingMetricRow[], error: null }
        ];

  if (recoveryAlertsResult.error) {
    throw new Error(
      `Recovery alerts query failed: ${recoveryAlertsResult.error.message}`
    );
  }

  if (recoveryRepliesResult.error) {
    throw new Error(
      `Recovery replies query failed: ${recoveryRepliesResult.error.message}`
    );
  }

  if (recoveryBookingsResult.error) {
    throw new Error(
      `Recovery bookings query failed: ${recoveryBookingsResult.error.message}`
    );
  }

  if (recoveredRevenueResult.error) {
    throw new Error(
      `Recovered revenue query failed: ${recoveredRevenueResult.error.message}`
    );
  }

  if (openingAlertsSentResult.error) {
    throw new Error(
      `Opening alerts sent query failed: ${openingAlertsSentResult.error.message}`
    );
  }

  if (openingResponsesResult.error) {
    throw new Error(
      `Opening responses query failed: ${openingResponsesResult.error.message}`
    );
  }

  const appointments = ((appointmentsResult.data ?? []) as AppointmentMetricRow[]).map(
    (appointment) => ({
      id: appointment.id,
      startsAt: appointment.starts_at,
      status: appointment.status,
      reminderStatus: appointment.reminder_status,
      confirmationStatus: appointment.confirmation_status
    })
  );
  const appointmentEvents = (
    (appointmentEventsResult.data ?? []) as AppointmentEventMetricRow[]
  ).map((event) => ({
    appointmentId: event.appointment_id,
    eventType: event.event_type
  }));
  const recoveryOpenings =
    (recoveryOpeningsResult.data ?? []) as RecoveryOpeningMetricRow[];
  const recoveryAlerts = (
    (recoveryAlertsResult.data ?? []) as RecoveryAlertMetricRow[]
  ).map((alert) => ({
    id: alert.id,
    openingId: alert.opening_id
  }));
  const recoveryReplies = (
    (recoveryRepliesResult.data ?? []) as RecoveryReplyMetricRow[]
  ).map((reply) => ({
    id: reply.id,
    openingId: reply.opening_id,
    status: reply.status
  }));
  const recoveredBookings = (
    (recoveryBookingsResult.data ?? []) as RecoveredBookingMetricRow[]
  ).map((booking) => ({
    id: booking.id,
    openingId: booking.opening_id,
    status: booking.status,
    recoveredValueCents: booking.recovered_value_cents
  }));
  const automation = calculateAutomationOutcomeMetrics({
    now: new Date(),
    appointments,
    appointmentEvents,
    recoveryOpenings: recoveryOpenings.map((opening) => ({
      id: opening.id,
      sourceAppointmentId: opening.source_appointment_id
    })),
    recoveryAlerts,
    recoveryReplies,
    recoveredBookings
  });
  const pendingRepliesCount = readCount("Pending replies", pendingRepliesResult);
  const openingAlertsSentCount = readCount(
    "Opening alerts sent",
    openingAlertsSentResult
  );
  const openingResponsesCount = readCount(
    "Opening responses",
    openingResponsesResult
  );

  return buildDashboardOverview({
    organizationName,
    customersCount: readCount("Customers", customersResult),
    waitlistEntriesCount: readCount("Waitlist entries", waitlistEntriesResult),
    servicesCount: readCount("Services", servicesResult),
    openingsCount: readCount("Openings", openingsResult),
    pendingRepliesCount,
    recoveredBookingsCount: readCount(
      "Recovered bookings",
      recoveredBookingsResult
    ),
    recoveredRevenueCents: calculateRecoveredRevenueCents(
      recoveredRevenueResult.data ?? []
    ),
    smsSentCount: readCount("SMS sent", smsSentResult),
    openingAlertsSentCount,
    openingResponsesCount,
    openingResponseRate: calculateResponseRate({
      responses: openingResponsesCount,
      sent: openingAlertsSentCount
    }),
    automation,
    actionItems: calculateDashboardActionItems({
      automation,
      pendingRepliesCount,
      recoveryOpenings
    })
  });
}
