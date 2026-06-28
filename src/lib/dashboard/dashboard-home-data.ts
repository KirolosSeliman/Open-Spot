import { resolveOpeningDisplayValueCents } from "@/lib/dashboard/operations-data";
import {
  assertDashboardOrganizationId,
  buildDashboardOverview,
  calculateDashboardActionItems,
  calculateResponseRate,
  type DashboardOverview
} from "@/lib/dashboard/real-data";
import {
  buildCumulativeSeries,
  buildDailyCounts,
  calculatePeriodChange,
  countInWindow,
  formatDashboardRangeLabel,
  formatPreviousRangeLabel,
  formatDayAxisLabels,
  getDashboardDateRange,
  normalizeDashboardRange,
  type DashboardRange,
  type PeriodChange
} from "@/lib/dashboard/date-range";
import { calculateAutomationOutcomeMetrics } from "@/lib/reports/metrics";
import { classifyInboundSmsBody } from "@/lib/sms/inbound";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/types";

export type MetricTrend = {
  value: number;
  series: number[];
  change: PeriodChange;
  comparisonLabel: string;
};

export type DashboardRecentResponse = {
  id: string;
  customerName: string;
  customerInitials: string;
  avatarColor: string;
  serviceName: string;
  responseLabel: string;
  responseTone: "green" | "red" | "neutral";
  relativeTime: string;
  statusLabel: string;
  statusTone: "green" | "orange" | "red" | "neutral";
};

export type DashboardRecentCancellation = {
  id: string;
  title: string;
  serviceName: string;
  dateTimeLabel: string;
  estimatedValueLabel: string;
  statusLabel: string;
  statusTone: "green" | "orange" | "blue" | "neutral";
};

export type DashboardActivityEntry = {
  id: string;
  relativeTime: string;
  message: string;
  iconTone: "blue" | "green" | "orange" | "purple" | "neutral";
};

export type DashboardSetupStep = {
  href: string;
  title: string;
  description: string;
  completed: boolean;
  iconTone: "blue" | "purple" | "orange" | "green" | "blue";
};

export type DashboardHomeData = DashboardOverview & {
  range: DashboardRange;
  rangeLabel: string;
  dateAxisLabels: string[];
  metrics: {
    customers: MetricTrend;
    services: MetricTrend;
    waitlist: MetricTrend;
    openCancellations: MetricTrend;
    smsSent: MetricTrend;
    recoveredAppointments: MetricTrend;
    pendingResponses: MetricTrend;
    recoveredRevenue: MetricTrend;
  };
  activityChart: {
    recoveredAppointments: number[];
    openCancellations: number[];
  };
  keyPoints: {
    revenueText: string;
    smsText: string;
    responsesText: string;
  };
  recentResponses: DashboardRecentResponse[];
  recentCancellations: DashboardRecentCancellation[];
  activityLog: DashboardActivityEntry[];
  setupSteps: DashboardSetupStep[];
  setupCompletedCount: number;
  remindersMetrics: {
    next7Days: MetricTrend;
    confirmed: MetricTrend;
    awaiting: MetricTrend;
    failed: MetricTrend;
  };
  recoveryMetrics: {
    smsCancellations: MetricTrend;
    openingsCreated: MetricTrend;
    recoveryReplies: MetricTrend;
    recoveredAfterSms: MetricTrend;
  };
};

type TimestampRow = { created_at: string };

function readCount(label: string, result: { count: number | null; error: { message: string } | null }) {
  if (result.error) {
    throw new Error(`${label} count failed: ${result.error.message}`);
  }

  return result.count ?? 0;
}

function buildMetricTrend({
  value,
  series,
  currentWindowCount,
  previousWindowCount,
  comparisonLabel,
  locale
}: {
  value: number;
  series: number[];
  currentWindowCount: number;
  previousWindowCount: number;
  comparisonLabel: string;
  locale: Locale;
}): MetricTrend {
  return {
    value,
    series,
    change: calculatePeriodChange(
      currentWindowCount,
      previousWindowCount,
      locale === "en" ? "en" : "fr"
    ),
    comparisonLabel
  };
}

function buildMoneyMetricTrend({
  valueCents,
  series,
  currentWindowCents,
  previousWindowCents,
  comparisonLabel,
  locale
}: {
  valueCents: number;
  series: number[];
  currentWindowCents: number;
  previousWindowCents: number;
  comparisonLabel: string;
  locale: Locale;
}): MetricTrend {
  return {
    value: valueCents,
    series,
    change: calculatePeriodChange(
      currentWindowCents,
      previousWindowCents,
      locale === "en" ? "en" : "fr"
    ),
    comparisonLabel
  };
}

function mapOpeningStatusForDashboard(
  status: string,
  locale: Locale
): { label: string; tone: DashboardRecentCancellation["statusTone"] } {
  const labels = locale === "en"
    ? {
        open: "Open",
        recovered: "Recovered",
        closed: "Closed",
        sent: "Sent"
      }
    : {
        open: "Ouverte",
        recovered: "Récupérée",
        closed: "Fermée",
        sent: "Envoyée"
      };

  switch (status) {
    case "filled":
      return { label: labels.recovered, tone: "green" };
    case "broadcasting":
      return { label: labels.sent, tone: "blue" };
    case "expired":
    case "cancelled":
      return { label: labels.closed, tone: "neutral" };
    default:
      return { label: labels.open, tone: "orange" };
  }
}

function mapResponseAnswer(
  classification: string,
  offerStatus: string,
  responseRank: number | null,
  locale: Locale
): { label: string; tone: DashboardRecentResponse["responseTone"] } {
  const isPositive =
    classification === "waitlist_positive" ||
    responseRank !== null ||
    offerStatus === "responded" ||
    offerStatus === "selected";

  if (offerStatus === "rejected" || classification === "appointment_cancel") {
    return { label: locale === "en" ? "NO" : "NON", tone: "red" };
  }

  if (isPositive) {
    return { label: locale === "en" ? "YES" : "OUI", tone: "green" };
  }

  return { label: locale === "en" ? "—" : "—", tone: "neutral" };
}

function mapResponseStatus(
  offerStatus: string,
  locale: Locale
): { label: string; tone: DashboardRecentResponse["statusTone"] } {
  if (offerStatus === "selected") {
    return {
      label: locale === "en" ? "Confirmed" : "Confirmé",
      tone: "green"
    };
  }

  if (offerStatus === "rejected") {
    return {
      label: locale === "en" ? "Declined" : "Refusé",
      tone: "red"
    };
  }

  if (offerStatus === "responded") {
    return {
      label: locale === "en" ? "To validate" : "À valider",
      tone: "orange"
    };
  }

  return {
    label: locale === "en" ? "Pending" : "En attente",
    tone: "neutral"
  };
}

function buildKeyPointTexts({
  revenueChange,
  smsChange,
  pendingRepliesCount,
  locale
}: {
  revenueChange: PeriodChange;
  smsChange: PeriodChange;
  pendingRepliesCount: number;
  locale: Locale;
}) {
  const revenueText =
    locale === "en"
      ? revenueChange.direction === "up"
        ? `Estimated recovered revenue increased by ${revenueChange.display.replace("+", "")} compared to the previous period.`
        : revenueChange.direction === "down"
          ? `Estimated recovered revenue decreased by ${Math.abs(revenueChange.percent).toLocaleString("en-CA", { maximumFractionDigits: 1 })}% compared to the previous period.`
          : "Estimated recovered revenue is stable compared to the previous period."
      : revenueChange.direction === "up"
        ? `Les revenus estimés ont augmenté de ${revenueChange.display.replace("+", "")} par rapport à la période précédente.`
        : revenueChange.direction === "down"
          ? `Les revenus estimés ont diminué de ${Math.abs(revenueChange.percent).toLocaleString("fr-CA", { maximumFractionDigits: 1 })} % par rapport à la période précédente.`
          : "Les revenus estimés sont stables par rapport à la période précédente.";

  const smsText =
    locale === "en"
      ? smsChange.direction === "up"
        ? `SMS sending is progressing strongly (${smsChange.display}).`
        : smsChange.direction === "down"
          ? `SMS sending is down (${smsChange.display}).`
          : "SMS sending is stable."
      : smsChange.direction === "up"
        ? `L'envoi de SMS progresse fortement (${smsChange.display}).`
        : smsChange.direction === "down"
          ? `L'envoi de SMS est en baisse (${smsChange.display}).`
          : "L'envoi de SMS est stable.";

  const responsesText =
    locale === "en"
      ? `${pendingRepliesCount} response${pendingRepliesCount === 1 ? "" : "s"} await a manual decision.`
      : `${pendingRepliesCount} réponse${pendingRepliesCount > 1 ? "s" : ""} ${pendingRepliesCount > 1 ? "sont" : "est"} en attente de décision manuelle.`;

  return { revenueText, smsText, responsesText };
}

function formatAuditLogMessage(
  action: string,
  metadata: Record<string, unknown> | null,
  locale: Locale
): { message: string; iconTone: DashboardActivityEntry["iconTone"] } {
  const meta = metadata ?? {};
  const customerName =
    typeof meta.customer_name === "string"
      ? meta.customer_name
      : typeof meta.full_name === "string"
        ? meta.full_name
        : null;
  const serviceName =
    typeof meta.service_name === "string" ? meta.service_name : null;
  const openingTitle =
    typeof meta.opening_title === "string" ? meta.opening_title : null;

  if (action.includes("sms") && customerName) {
    return {
      message:
        locale === "en"
          ? `SMS sent to ${customerName}${openingTitle ? ` for ${openingTitle}` : ""}.`
          : `SMS envoyé à ${customerName}${openingTitle ? ` pour sa réponse à l'annulation ${openingTitle}` : ""}.`,
      iconTone: "purple"
    };
  }

  if (action.includes("customer") && action.includes("create")) {
    return {
      message:
        locale === "en"
          ? `New customer added: ${customerName ?? "Unknown"}.`
          : `Nouveau client ajouté : ${customerName ?? "Client inconnu"}.`,
      iconTone: "blue"
    };
  }

  if (action.includes("service")) {
    return {
      message:
        locale === "en"
          ? `Service updated: ${serviceName ?? "Unknown service"}.`
          : `Service mis à jour : ${serviceName ?? "Service inconnu"}.`,
      iconTone: "orange"
    };
  }

  if (action.includes("opening") || action.includes("cancellation")) {
    return {
      message:
        locale === "en"
          ? `New cancellation created: ${openingTitle ?? "Untitled"}.`
          : `Nouvelle annulation créée : ${openingTitle ?? "Sans titre"}.`,
      iconTone: "orange"
    };
  }

  if (action.includes("booking") || action.includes("confirm")) {
    return {
      message:
        locale === "en"
          ? `Manual confirmation recorded for ${customerName ?? "customer"}${serviceName ? ` — ${serviceName}` : ""}.`
          : `Confirmation manuelle enregistrée pour ${customerName ?? "client"}${serviceName ? ` — ${serviceName}` : ""}.`,
      iconTone: "green"
    };
  }

  return {
    message: action.replaceAll(".", " "),
    iconTone: "neutral"
  };
}

async function buildActivityLog({
  organizationId,
  locale,
  now
}: {
  organizationId: string;
  locale: Locale;
  now: Date;
}): Promise<DashboardActivityEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data: auditRows, error } = await supabase
    .from("audit_logs")
    .select("id, action, metadata, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!error && auditRows && auditRows.length > 0) {
    const { formatRelativeTime } = await import("@/lib/dashboard/date-range");
    return auditRows.map((row) => {
      const formatted = formatAuditLogMessage(
        row.action,
        row.metadata as Record<string, unknown> | null,
        locale
      );

      return {
        id: row.id,
        relativeTime: formatRelativeTime(row.created_at, locale === "en" ? "en" : "fr", now),
        message: formatted.message,
        iconTone: formatted.iconTone
      };
    });
  }

  const [smsResult, bookingsResult, customersResult, openingsResult] =
    await Promise.all([
      supabase
        .from("sms_messages")
        .select("id, created_at, direction, message_type, customer_id, opening_id")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("booking_requests")
        .select("id, created_at, status, customer_id, opening_id")
        .eq("organization_id", organizationId)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("customers")
        .select("id, full_name, created_at")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("openings")
        .select("id, title, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

  const { formatRelativeTime } = await import("@/lib/dashboard/date-range");
  const events: Array<{
    id: string;
    createdAt: string;
    message: string;
    iconTone: DashboardActivityEntry["iconTone"];
  }> = [];

  const customerIds = [
    ...new Set(
      [
        ...(smsResult.data ?? []).map((row) => row.customer_id),
        ...(bookingsResult.data ?? []).map((row) => row.customer_id)
      ].filter((id): id is string => Boolean(id))
    )
  ];
  const openingIds = [
    ...new Set(
      [
        ...(smsResult.data ?? []).map((row) => row.opening_id),
        ...(bookingsResult.data ?? []).map((row) => row.opening_id)
      ].filter((id): id is string => Boolean(id))
    )
  ];

  const [customersLookup, openingsLookup] = await Promise.all([
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select("id, full_name")
          .eq("organization_id", organizationId)
          .in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    openingIds.length > 0
      ? supabase
          .from("openings")
          .select("id, title")
          .eq("organization_id", organizationId)
          .in("id", openingIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  const customerNameById = new Map(
    (customersLookup.data ?? []).map((customer) => [customer.id, customer.full_name])
  );
  const openingTitleById = new Map(
    (openingsLookup.data ?? []).map((opening) => [opening.id, opening.title])
  );

  for (const sms of smsResult.data ?? []) {
    if (sms.direction !== "outbound") {
      continue;
    }

    const customerName = sms.customer_id
      ? customerNameById.get(sms.customer_id) ?? (locale === "en" ? "customer" : "client")
      : locale === "en"
        ? "customer"
        : "client";
    const openingTitle = sms.opening_id
      ? openingTitleById.get(sms.opening_id)
      : null;

    events.push({
      id: `sms-${sms.id}`,
      createdAt: sms.created_at,
      message:
        locale === "en"
          ? `SMS sent to ${customerName}${openingTitle ? ` for ${openingTitle}` : ""}.`
          : `SMS envoyé à ${customerName}${openingTitle ? ` pour sa réponse à l'annulation ${openingTitle}` : ""}.`,
      iconTone: "purple"
    });
  }

  for (const booking of bookingsResult.data ?? []) {
    const customerName = booking.customer_id
      ? customerNameById.get(booking.customer_id) ??
        (locale === "en" ? "customer" : "client")
      : locale === "en"
        ? "customer"
        : "client";

    events.push({
      id: `booking-${booking.id}`,
      createdAt: booking.created_at,
      message:
        locale === "en"
          ? `Manual confirmation recorded for ${customerName}.`
          : `Confirmation manuelle enregistrée pour ${customerName}.`,
      iconTone: "green"
    });
  }

  for (const customer of customersResult.data ?? []) {
    events.push({
      id: `customer-${customer.id}`,
      createdAt: customer.created_at,
      message:
        locale === "en"
          ? `New customer added: ${customer.full_name}.`
          : `Nouveau client ajouté : ${customer.full_name}.`,
      iconTone: "blue"
    });
  }

  for (const opening of openingsResult.data ?? []) {
    events.push({
      id: `opening-${opening.id}`,
      createdAt: opening.created_at,
      message:
        locale === "en"
          ? `New cancellation created: ${opening.title}.`
          : `Nouvelle annulation créée : ${opening.title}.`,
      iconTone: "orange"
    });
  }

  return events
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, 5)
    .map((event) => ({
      id: event.id,
      relativeTime: formatRelativeTime(
        event.createdAt,
        locale === "en" ? "en" : "fr",
        now
      ),
      message: event.message,
      iconTone: event.iconTone
    }));
}

export async function loadDashboardHomeData({
  organizationId,
  organizationName,
  rangeParam,
  locale = "fr",
  now = new Date()
}: {
  organizationId: string;
  organizationName: string;
  rangeParam?: string | null;
  locale?: Locale;
  now?: Date;
}): Promise<DashboardHomeData> {
  assertDashboardOrganizationId(organizationId);

  const range = normalizeDashboardRange(rangeParam);
  const window = getDashboardDateRange(range, now);
  const comparisonLabel = formatPreviousRangeLabel(window, locale === "en" ? "en" : "fr");
  const rangeLabel = formatDashboardRangeLabel(window, locale === "en" ? "en" : "fr");
  const dateAxisLabels = formatDayAxisLabels(window.start, window.days, locale === "en" ? "en" : "fr");
  const extendedStartIso = window.previousStartIso;

  const supabase = await createSupabaseServerClient();

  const [
    customersCountResult,
    waitlistEntriesCountResult,
    servicesCountResult,
    openingsCountResult,
    pendingRepliesResult,
    customersSeriesResult,
    servicesSeriesResult,
    waitlistSeriesResult,
    openingsSeriesResult,
    smsSeriesResult,
    bookingsSeriesResult,
    revenueSeriesResult,
    pendingSeriesResult,
    appointmentsResult,
    appointmentEventsResult,
    recoveryOpeningsResult,
    recentOffersResult,
    recentOpeningsResult,
    baselineCustomersResult,
    baselineServicesResult,
    baselineWaitlistResult
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
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
      .from("customers")
      .select("created_at")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("services")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("waitlist_entries")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("openings")
      .select("created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("sms_messages")
      .select("created_at")
      .eq("organization_id", organizationId)
      .eq("direction", "outbound")
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("booking_requests")
      .select("created_at, status, recovered_value_cents")
      .eq("organization_id", organizationId)
      .in("status", ["confirmed", "completed"])
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("booking_requests")
      .select("created_at, recovered_value_cents")
      .eq("organization_id", organizationId)
      .in("status", ["confirmed", "completed"])
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("opening_offers")
      .select("created_at, responded_at, status")
      .eq("organization_id", organizationId)
      .gte("created_at", extendedStartIso)
      .lte("created_at", window.endIso),
    supabase
      .from("appointments")
      .select("id, starts_at, status, reminder_status, confirmation_status, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("appointment_events")
      .select("appointment_id, event_type, created_at")
      .eq("organization_id", organizationId)
      .eq("event_type", "appointment.sms_cancelled"),
    supabase
      .from("openings")
      .select("id, source_appointment_id, status, created_at")
      .eq("organization_id", organizationId)
      .eq("source", "appointment_cancellation"),
    supabase
      .from("opening_offers")
      .select("id, customer_id, opening_id, status, response_rank, response_text, responded_at, created_at")
      .eq("organization_id", organizationId)
      .in("status", ["responded", "selected", "rejected"])
      .not("responded_at", "is", null)
      .order("responded_at", { ascending: false })
      .limit(4),
    supabase
      .from("openings")
      .select("id, title, service_id, start_time, status, normal_price_cents, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .lt("created_at", window.startIso),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .lt("created_at", window.startIso),
    supabase
      .from("waitlist_entries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .lt("created_at", window.startIso)
  ]);

  const customersCount = readCount("Customers", customersCountResult);
  const servicesCount = readCount("Services", servicesCountResult);
  const waitlistEntriesCount = readCount("Waitlist entries", waitlistEntriesCountResult);
  const openingsCount = readCount("Openings", openingsCountResult);
  const pendingRepliesCount = readCount("Pending replies", pendingRepliesResult);

  const customerTimestamps = (customersSeriesResult.data ?? []).map(
    (row: TimestampRow) => row.created_at
  );
  const serviceTimestamps = (servicesSeriesResult.data ?? []).map(
    (row: TimestampRow) => row.created_at
  );
  const waitlistTimestamps = (waitlistSeriesResult.data ?? []).map(
    (row: TimestampRow) => row.created_at
  );
  const openingTimestamps = (openingsSeriesResult.data ?? []).map(
    (row: TimestampRow) => row.created_at
  );
  const smsTimestamps = (smsSeriesResult.data ?? []).map(
    (row: TimestampRow) => row.created_at
  );
  const bookingRows = bookingsSeriesResult.data ?? [];
  const revenueRows = revenueSeriesResult.data ?? [];
  const pendingRows = pendingSeriesResult.data ?? [];

  const baselineCustomers = readCount("Baseline customers", baselineCustomersResult);
  const baselineServices = readCount("Baseline services", baselineServicesResult);
  const baselineWaitlist = readCount("Baseline waitlist", baselineWaitlistResult);

  const customerSeries = buildCumulativeSeries(
    customerTimestamps.filter((ts) => new Date(ts) <= window.end),
    window.start,
    window.days,
    baselineCustomers
  );
  const serviceSeries = buildCumulativeSeries(
    serviceTimestamps.filter((ts) => new Date(ts) <= window.end),
    window.start,
    window.days,
    baselineServices
  );
  const waitlistSeries = buildCumulativeSeries(
    waitlistTimestamps.filter((ts) => new Date(ts) <= window.end),
    window.start,
    window.days,
    baselineWaitlist
  );
  const openingDailySeries = buildDailyCounts(
    openingTimestamps.filter(
      (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
    ),
    window.start,
    window.days
  );
  const smsDailySeries = buildDailyCounts(
    smsTimestamps.filter(
      (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
    ),
    window.start,
    window.days
  );
  const recoveredDailySeries = buildDailyCounts(
    bookingRows
      .filter((row) => new Date(row.created_at) <= window.end)
      .map((row) => row.created_at),
    window.start,
    window.days
  );
  const revenueDailySeries = Array.from({ length: window.days }, (_, index) => {
    const dayStart = new Date(window.start);
    dayStart.setDate(dayStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    return revenueRows
      .filter((row) => {
        const time = new Date(row.created_at).getTime();
        return time >= dayStart.getTime() && time <= dayEnd.getTime();
      })
      .reduce((total, row) => total + (row.recovered_value_cents ?? 0), 0);
  });

  const pendingDailySeries = buildDailyCounts(
    pendingRows
      .filter((row) => row.status === "responded")
      .map((row) => row.responded_at ?? row.created_at),
    window.start,
    window.days
  );

  const customersCurrent = countInWindow(customerTimestamps, window.start, window.end);
  const customersPrevious = countInWindow(
    customerTimestamps,
    window.previousStart,
    window.previousEnd
  );
  const servicesCurrent = countInWindow(serviceTimestamps, window.start, window.end);
  const servicesPrevious = countInWindow(
    serviceTimestamps,
    window.previousStart,
    window.previousEnd
  );
  const waitlistCurrent = countInWindow(waitlistTimestamps, window.start, window.end);
  const waitlistPrevious = countInWindow(
    waitlistTimestamps,
    window.previousStart,
    window.previousEnd
  );
  const openingsCurrent = countInWindow(openingTimestamps, window.start, window.end);
  const openingsPrevious = countInWindow(
    openingTimestamps,
    window.previousStart,
    window.previousEnd
  );
  const smsCurrent = countInWindow(smsTimestamps, window.start, window.end);
  const smsPrevious = countInWindow(
    smsTimestamps,
    window.previousStart,
    window.previousEnd
  );
  const recoveredCurrent = countInWindow(
    bookingRows.map((row) => row.created_at),
    window.start,
    window.end
  );
  const recoveredPrevious = countInWindow(
    bookingRows.map((row) => row.created_at),
    window.previousStart,
    window.previousEnd
  );
  const revenueCurrent = revenueRows
    .filter((row) => {
      const time = new Date(row.created_at).getTime();
      return time >= window.start.getTime() && time <= window.end.getTime();
    })
    .reduce((total, row) => total + (row.recovered_value_cents ?? 0), 0);
  const revenuePrevious = revenueRows
    .filter((row) => {
      const time = new Date(row.created_at).getTime();
      return (
        time >= window.previousStart.getTime() &&
        time <= window.previousEnd.getTime()
      );
    })
    .reduce((total, row) => total + (row.recovered_value_cents ?? 0), 0);
  const pendingCurrent = countInWindow(
    pendingRows
      .filter((row) => row.status === "responded")
      .map((row) => row.responded_at ?? row.created_at),
    window.start,
    window.end
  );
  const pendingPrevious = countInWindow(
    pendingRows
      .filter((row) => row.status === "responded")
      .map((row) => row.responded_at ?? row.created_at),
    window.previousStart,
    window.previousEnd
  );

  const recoveredBookingsCount = recoveredCurrent;
  const recoveredRevenueCents = revenueCurrent;
  const smsSentCount = smsCurrent;

  const recoveryOpeningIds = (recoveryOpeningsResult.data ?? []).map(
    (opening) => opening.id
  );

  const [
    recoveryAlertsResult,
    recoveryRepliesResult,
    recoveryBookingsResult,
    openingAlertsSentResult,
    openingResponsesResult,
    inboundMessagesResult
  ] = await Promise.all([
    recoveryOpeningIds.length > 0
      ? supabase
          .from("sms_messages")
          .select("id, opening_id, created_at")
          .eq("organization_id", organizationId)
          .eq("direction", "outbound")
          .eq("message_type", "opening_alert")
          .in("opening_id", recoveryOpeningIds)
      : Promise.resolve({ data: [], error: null }),
    recoveryOpeningIds.length > 0
      ? supabase
          .from("opening_offers")
          .select("id, opening_id, status, created_at, responded_at")
          .eq("organization_id", organizationId)
          .in("opening_id", recoveryOpeningIds)
      : Promise.resolve({ data: [], error: null }),
    recoveryOpeningIds.length > 0
      ? supabase
          .from("booking_requests")
          .select("id, opening_id, status, recovered_value_cents, created_at")
          .eq("organization_id", organizationId)
          .in("opening_id", recoveryOpeningIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("sms_messages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("direction", "outbound")
      .eq("message_type", "opening_alert"),
    supabase
      .from("opening_offers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["responded", "selected"]),
    recentOffersResult.data && recentOffersResult.data.length > 0
      ? supabase
          .from("sms_messages")
          .select("customer_id, opening_id, body, created_at")
          .eq("organization_id", organizationId)
          .eq("direction", "inbound")
          .in(
            "opening_id",
            recentOffersResult.data.map((offer) => offer.opening_id)
          )
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ]);

  const appointments = (appointmentsResult.data ?? []).map((appointment) => ({
    id: appointment.id,
    startsAt: appointment.starts_at,
    status: appointment.status,
    reminderStatus: appointment.reminder_status,
    confirmationStatus: appointment.confirmation_status
  }));
  const appointmentEvents = (appointmentEventsResult.data ?? []).map((event) => ({
    appointmentId: event.appointment_id,
    eventType: event.event_type
  }));
  const recoveryOpenings = recoveryOpeningsResult.data ?? [];
  const recoveryAlerts = (recoveryAlertsResult.data ?? []).map((alert) => ({
    id: alert.id,
    openingId: alert.opening_id
  }));
  const recoveryReplies = (recoveryRepliesResult.data ?? []).map((reply) => ({
    id: reply.id,
    openingId: reply.opening_id,
    status: reply.status
  }));
  const recoveredBookings = (recoveryBookingsResult.data ?? []).map((booking) => ({
    id: booking.id,
    openingId: booking.opening_id,
    status: booking.status,
    recoveredValueCents: booking.recovered_value_cents
  }));

  const automation = calculateAutomationOutcomeMetrics({
    now,
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

  const openingAlertsSentCount = readCount(
    "Opening alerts sent",
    openingAlertsSentResult
  );
  const openingResponsesCount = readCount(
    "Opening responses",
    openingResponsesResult
  );

  const overview = buildDashboardOverview({
    organizationName,
    customersCount,
    waitlistEntriesCount,
    servicesCount,
    openingsCount,
    pendingRepliesCount,
    recoveredBookingsCount,
    recoveredRevenueCents,
    smsSentCount,
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

  const activityChartRecovered = recoveredDailySeries;
  const activityChartOpenings = openingDailySeries;

  const metrics = {
    customers: buildMetricTrend({
      value: customersCount,
      series: customerSeries,
      currentWindowCount: customersCurrent,
      previousWindowCount: customersPrevious,
      comparisonLabel,
      locale
    }),
    services: buildMetricTrend({
      value: servicesCount,
      series: serviceSeries,
      currentWindowCount: servicesCurrent,
      previousWindowCount: servicesPrevious,
      comparisonLabel,
      locale
    }),
    waitlist: buildMetricTrend({
      value: waitlistEntriesCount,
      series: waitlistSeries,
      currentWindowCount: waitlistCurrent,
      previousWindowCount: waitlistPrevious,
      comparisonLabel,
      locale
    }),
    openCancellations: buildMetricTrend({
      value: openingsCount,
      series: openingDailySeries,
      currentWindowCount: openingsCurrent,
      previousWindowCount: openingsPrevious,
      comparisonLabel,
      locale
    }),
    smsSent: buildMetricTrend({
      value: smsSentCount,
      series: smsDailySeries,
      currentWindowCount: smsCurrent,
      previousWindowCount: smsPrevious,
      comparisonLabel,
      locale
    }),
    recoveredAppointments: buildMetricTrend({
      value: recoveredBookingsCount,
      series: recoveredDailySeries,
      currentWindowCount: recoveredCurrent,
      previousWindowCount: recoveredPrevious,
      comparisonLabel,
      locale
    }),
    pendingResponses: buildMetricTrend({
      value: pendingRepliesCount,
      series: pendingDailySeries,
      currentWindowCount: pendingCurrent,
      previousWindowCount: pendingPrevious,
      comparisonLabel,
      locale
    }),
    recoveredRevenue: buildMoneyMetricTrend({
      valueCents: recoveredRevenueCents,
      series: revenueDailySeries,
      currentWindowCents: revenueCurrent,
      previousWindowCents: revenuePrevious,
      comparisonLabel,
      locale
    })
  };

  const appointmentConfirmedTimestamps = (appointmentsResult.data ?? [])
    .filter((row) => row.status === "confirmed")
    .map((row) => row.created_at);
  const appointmentAwaitingTimestamps = (appointmentsResult.data ?? [])
    .filter((row) => row.confirmation_status === "pending")
    .map((row) => row.created_at);
  const appointmentFailedTimestamps = (appointmentsResult.data ?? [])
    .filter((row) => row.reminder_status === "failed")
    .map((row) => row.created_at);
  const appointmentNext7Timestamps = (appointmentsResult.data ?? [])
    .filter((row) => {
      const time = new Date(row.starts_at).getTime();
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      return time >= now.getTime() && time <= end.getTime();
    })
    .map((row) => row.starts_at);

  const smsCancellationTimestamps = (appointmentEventsResult.data ?? []).map(
    (row) => row.created_at
  );
  const recoveryOpeningTimestamps = recoveryOpenings.map((row) => row.created_at);
  const recoveryReplyTimestamps = (recoveryRepliesResult.data ?? [])
    .filter((row) => ["responded", "selected", "rejected"].includes(row.status))
    .map((row) => row.responded_at ?? row.created_at);
  const recoveryRevenueRows = (recoveryBookingsResult.data ?? []).filter(
    (row) => row.status === "confirmed" || row.status === "completed"
  );

  const remindersMetrics = {
    next7Days: buildMetricTrend({
      value: automation.appointmentsNext7Days,
      series: buildDailyCounts(appointmentNext7Timestamps, window.start, window.days),
      currentWindowCount: appointmentNext7Timestamps.length,
      previousWindowCount: 0,
      comparisonLabel,
      locale
    }),
    confirmed: buildMetricTrend({
      value: automation.appointmentsConfirmed,
      series: buildDailyCounts(
        appointmentConfirmedTimestamps.filter(
          (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
        ),
        window.start,
        window.days
      ),
      currentWindowCount: countInWindow(
        appointmentConfirmedTimestamps,
        window.start,
        window.end
      ),
      previousWindowCount: countInWindow(
        appointmentConfirmedTimestamps,
        window.previousStart,
        window.previousEnd
      ),
      comparisonLabel,
      locale
    }),
    awaiting: buildMetricTrend({
      value: automation.appointmentsAwaitingConfirmation,
      series: buildDailyCounts(
        appointmentAwaitingTimestamps.filter(
          (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
        ),
        window.start,
        window.days
      ),
      currentWindowCount: countInWindow(
        appointmentAwaitingTimestamps,
        window.start,
        window.end
      ),
      previousWindowCount: countInWindow(
        appointmentAwaitingTimestamps,
        window.previousStart,
        window.previousEnd
      ),
      comparisonLabel,
      locale
    }),
    failed: buildMetricTrend({
      value: automation.remindersFailed,
      series: buildDailyCounts(
        appointmentFailedTimestamps.filter(
          (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
        ),
        window.start,
        window.days
      ),
      currentWindowCount: countInWindow(
        appointmentFailedTimestamps,
        window.start,
        window.end
      ),
      previousWindowCount: countInWindow(
        appointmentFailedTimestamps,
        window.previousStart,
        window.previousEnd
      ),
      comparisonLabel,
      locale
    })
  };

  const recoveryRevenueCurrent = recoveryRevenueRows
    .filter((row) => {
      const time = new Date(row.created_at).getTime();
      return time >= window.start.getTime() && time <= window.end.getTime();
    })
    .reduce((total, row) => total + (row.recovered_value_cents ?? 0), 0);
  const recoveryRevenuePrevious = recoveryRevenueRows
    .filter((row) => {
      const time = new Date(row.created_at).getTime();
      return (
        time >= window.previousStart.getTime() &&
        time <= window.previousEnd.getTime()
      );
    })
    .reduce((total, row) => total + (row.recovered_value_cents ?? 0), 0);

  const recoveryMetrics = {
    smsCancellations: buildMetricTrend({
      value: automation.appointmentsCancelledBySms,
      series: buildDailyCounts(
        smsCancellationTimestamps.filter(
          (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
        ),
        window.start,
        window.days
      ),
      currentWindowCount: countInWindow(
        smsCancellationTimestamps,
        window.start,
        window.end
      ),
      previousWindowCount: countInWindow(
        smsCancellationTimestamps,
        window.previousStart,
        window.previousEnd
      ),
      comparisonLabel,
      locale
    }),
    openingsCreated: buildMetricTrend({
      value: automation.recoveryOpeningsCreated,
      series: buildDailyCounts(
        recoveryOpeningTimestamps.filter(
          (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
        ),
        window.start,
        window.days
      ),
      currentWindowCount: countInWindow(
        recoveryOpeningTimestamps,
        window.start,
        window.end
      ),
      previousWindowCount: countInWindow(
        recoveryOpeningTimestamps,
        window.previousStart,
        window.previousEnd
      ),
      comparisonLabel,
      locale
    }),
    recoveryReplies: buildMetricTrend({
      value: automation.recoveryRepliesReceived,
      series: buildDailyCounts(
        recoveryReplyTimestamps.filter(
          (ts) => new Date(ts) >= window.start && new Date(ts) <= window.end
        ),
        window.start,
        window.days
      ),
      currentWindowCount: countInWindow(
        recoveryReplyTimestamps,
        window.start,
        window.end
      ),
      previousWindowCount: countInWindow(
        recoveryReplyTimestamps,
        window.previousStart,
        window.previousEnd
      ),
      comparisonLabel,
      locale
    }),
    recoveredAfterSms: buildMoneyMetricTrend({
      valueCents: automation.recoveredAfterCancellationRevenueCents,
      series: buildDailyCounts(
        recoveryRevenueRows.map((row) => row.created_at),
        window.start,
        window.days
      ).map((_, index) => {
        const dayStart = new Date(window.start);
        dayStart.setDate(dayStart.getDate() + index);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        return recoveryRevenueRows
          .filter((row) => {
            const time = new Date(row.created_at).getTime();
            return time >= dayStart.getTime() && time <= dayEnd.getTime();
          })
          .reduce((total, row) => total + (row.recovered_value_cents ?? 0), 0);
      }),
      currentWindowCents: recoveryRevenueCurrent,
      previousWindowCents: recoveryRevenuePrevious,
      comparisonLabel,
      locale
    })
  };

  const { formatRelativeTime, formatOpeningDateTime, getInitials, avatarColorFromName } =
    await import("@/lib/dashboard/date-range");

  const offerCustomerIds = [
    ...new Set((recentOffersResult.data ?? []).map((offer) => offer.customer_id))
  ];
  const offerOpeningIds = [
    ...new Set((recentOffersResult.data ?? []).map((offer) => offer.opening_id))
  ];
  const recentOpeningServiceIds = [
    ...new Set(
      (recentOpeningsResult.data ?? [])
        .map((opening) => opening.service_id)
        .filter((id): id is string => Boolean(id))
    )
  ];

  const [offerCustomersResult, offerOpeningsResult, recentServicesResult, recentBookingsResult] =
    await Promise.all([
      offerCustomerIds.length > 0
        ? supabase
            .from("customers")
            .select("id, full_name")
            .eq("organization_id", organizationId)
            .in("id", offerCustomerIds)
        : Promise.resolve({ data: [], error: null }),
      offerOpeningIds.length > 0
        ? supabase
            .from("openings")
            .select("id, service_id, title")
            .eq("organization_id", organizationId)
            .in("id", offerOpeningIds)
        : Promise.resolve({ data: [], error: null }),
      recentOpeningServiceIds.length > 0
        ? supabase
            .from("services")
            .select("id, name, normal_price_cents")
            .eq("organization_id", organizationId)
            .in("id", recentOpeningServiceIds)
        : Promise.resolve({ data: [], error: null }),
      (recentOpeningsResult.data ?? []).length > 0
        ? supabase
            .from("booking_requests")
            .select("opening_id, recovered_value_cents, created_at, status")
            .eq("organization_id", organizationId)
            .in(
              "opening_id",
              (recentOpeningsResult.data ?? []).map((opening) => opening.id)
            )
            .in("status", ["confirmed", "completed"])
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null })
    ]);

  const customerNameById = new Map(
    (offerCustomersResult.data ?? []).map((customer) => [
      customer.id,
      customer.full_name
    ])
  );
  const openingServiceById = new Map(
    (offerOpeningsResult.data ?? []).map((opening) => [opening.id, opening.service_id])
  );
  const serviceNameById = new Map(
    (recentServicesResult.data ?? []).map((service) => [service.id, service.name])
  );
  const servicePriceById = new Map(
    (recentServicesResult.data ?? []).map((service) => [
      service.id,
      service.normal_price_cents
    ])
  );
  const inboundByContext = new Map<string, string>();

  for (const message of inboundMessagesResult.data ?? []) {
    const key = `${message.opening_id}:${message.customer_id}`;

    if (!inboundByContext.has(key)) {
      inboundByContext.set(key, message.body);
    }
  }

  const serviceNotSpecified = locale === "en" ? "Service not specified" : "Service non précisé";

  const recentResponses: DashboardRecentResponse[] = (recentOffersResult.data ?? []).map(
    (offer) => {
      const customerName =
        customerNameById.get(offer.customer_id) ??
        (locale === "en" ? "Unknown customer" : "Client inconnu");
      const serviceId = openingServiceById.get(offer.opening_id);
      const serviceName = serviceId
        ? serviceNameById.get(serviceId) ?? serviceNotSpecified
        : serviceNotSpecified;
      const inboundBody =
        inboundByContext.get(`${offer.opening_id}:${offer.customer_id}`) ?? null;
      const classification = inboundBody
        ? classifyInboundSmsBody(inboundBody, "waitlist")
        : offer.status === "responded"
          ? "waitlist_positive"
          : "none";
      const answer = mapResponseAnswer(
        classification,
        offer.status,
        offer.response_rank,
        locale
      );
      const status = mapResponseStatus(offer.status, locale);

      return {
        id: offer.id,
        customerName,
        customerInitials: getInitials(customerName),
        avatarColor: avatarColorFromName(customerName),
        serviceName,
        responseLabel: answer.label,
        responseTone: answer.tone,
        relativeTime: formatRelativeTime(
          offer.responded_at ?? offer.created_at,
          locale === "en" ? "en" : "fr",
          now
        ),
        statusLabel: status.label,
        statusTone: status.tone
      };
    }
  );

  const recoveredValueByOpening = new Map<string, number | null>();

  for (const booking of recentBookingsResult.data ?? []) {
    if (!recoveredValueByOpening.has(booking.opening_id)) {
      recoveredValueByOpening.set(booking.opening_id, booking.recovered_value_cents);
    }
  }

  const currencyFormatter = new Intl.NumberFormat(
    locale === "en" ? "en-CA" : "fr-CA",
    { style: "currency", currency: "CAD" }
  );

  const recentCancellations: DashboardRecentCancellation[] = (
    recentOpeningsResult.data ?? []
  ).map((opening) => {
    const serviceNormalPriceCents = opening.service_id
      ? servicePriceById.get(opening.service_id) ?? null
      : null;
    const displayValue = resolveOpeningDisplayValueCents({
      bookingRecoveredValueCents: recoveredValueByOpening.get(opening.id) ?? null,
      openingNormalPriceCents: opening.normal_price_cents,
      serviceNormalPriceCents
    });
    const status = mapOpeningStatusForDashboard(opening.status, locale);

    return {
      id: opening.id,
      title: opening.title,
      serviceName: opening.service_id
        ? serviceNameById.get(opening.service_id) ?? serviceNotSpecified
        : serviceNotSpecified,
      dateTimeLabel: formatOpeningDateTime(
        opening.start_time,
        locale === "en" ? "en" : "fr",
        now
      ),
      estimatedValueLabel:
        displayValue.valueCents !== null
          ? currencyFormatter.format(displayValue.valueCents / 100)
          : "—",
      statusLabel: status.label,
      statusTone: status.tone
    };
  });

  const activityLog = await buildActivityLog({ organizationId, locale, now });

  const setupSteps: DashboardSetupStep[] = [
    {
      href: "/dashboard/services",
      title: locale === "en" ? "Add your services" : "Ajouter vos services",
      description:
        locale === "en"
          ? "Create your services with duration, capacity, and cancellation rules."
          : "Créez vos services avec durée, capacité et règles d'annulation.",
      completed: overview.setup.hasServices,
      iconTone: "blue"
    },
    {
      href: "/dashboard/clients",
      title: locale === "en" ? "Add your customers" : "Ajouter vos clients",
      description:
        locale === "en"
          ? "Import or add customers to start managing appointments."
          : "Importez ou ajoutez vos clients pour commencer à gérer vos rendez-vous.",
      completed: overview.setup.hasCustomers,
      iconTone: "purple"
    },
    {
      href: "/dashboard/new-cancellation",
      title:
        locale === "en"
          ? "Create your first cancellation"
          : "Créer votre première annulation",
      description:
        locale === "en"
          ? "Test the cancellation process and generated openings."
          : "Testez le processus d'annulation et les ouvertures générées.",
      completed: overview.setup.hasOpenings,
      iconTone: "orange"
    },
    {
      href: "/dashboard/waitlist",
      title:
        locale === "en" ? "Create your waitlist" : "Créer votre liste d'attente",
      description:
        locale === "en"
          ? "Activate your waitlist and define assignment rules."
          : "Activez votre liste d'attente et définissez vos règles d'attribution.",
      completed: overview.setup.hasWaitlistEntries,
      iconTone: "green"
    },
    {
      href: "/dashboard/messages",
      title: locale === "en" ? "Verify an SMS alert" : "Vérifier une alerte SMS",
      description:
        locale === "en"
          ? "Send a test SMS and make sure alerts are received."
          : "Envoyez un SMS test et assurez-vous de bien recevoir les alertes.",
      completed: smsSentCount > 0 || openingAlertsSentCount > 0,
      iconTone: "blue"
    }
  ];

  const setupCompletedCount = setupSteps.filter((step) => step.completed).length;

  const keyPoints = buildKeyPointTexts({
    revenueChange: metrics.recoveredRevenue.change,
    smsChange: metrics.smsSent.change,
    pendingRepliesCount,
    locale
  });

  return {
    ...overview,
    range,
    rangeLabel,
    dateAxisLabels,
    metrics,
    activityChart: {
      recoveredAppointments: activityChartRecovered,
      openCancellations: activityChartOpenings
    },
    keyPoints,
    recentResponses,
    recentCancellations,
    activityLog,
    setupSteps,
    setupCompletedCount,
    remindersMetrics,
    recoveryMetrics
  };
}
