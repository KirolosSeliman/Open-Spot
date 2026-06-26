import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assertDashboardOrganizationId } from "@/lib/dashboard/real-data";
import {
  buildFunnel,
  buildRecoveredRevenueSeries,
  buildSmsVsResponsesSeries,
  buildTopServices,
  buildWaitlistGrowthSeries,
  calculatePercentTrend,
  calculatePointsTrend,
  summarizePeriodMetrics
} from "@/lib/analytics/metrics";
import {
  getInsightsPeriodWindow,
  normalizeInsightsGranularity,
  normalizeInsightsPeriod
} from "@/lib/analytics/periods";
import type {
  InsightsData,
  InsightsExportPayload,
  InsightsFilters,
  InsightsKpi
} from "@/lib/analytics/types";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

function formatPercent(value: number) {
  return `${value.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} %`;
}

function buildKpi(label: string, value: string, trend: InsightsKpi["trend"]): InsightsKpi {
  return { label, value, trend };
}

function getEmptyInsightsData({
  organizationName,
  timezone,
  filters,
  periodWindow
}: {
  organizationName: string;
  timezone: string;
  filters: InsightsFilters;
  periodWindow: InsightsData["periodWindow"];
}): InsightsData {
  const emptyTrend = {
    display: "—",
    tone: "neutral" as const,
    hasPreviousData: false
  };
  const emptyKpi = (label: string, value = "0") =>
    buildKpi(label, value, emptyTrend);
  const exportPayload: InsightsExportPayload = {
    generatedAt: new Date().toISOString(),
    organizationName,
    timezone,
    periodLabel: periodWindow.period,
    dateRangeLabel: periodWindow.dateRangeLabel,
    serviceLabel: "Tous les services",
    kpis: [],
    recoveredRevenueSeries: [],
    smsVsResponsesSeries: [],
    funnel: [],
    responseRateDonut: { rate: 0, responses: 0, noResponse: 0 },
    waitlistGrowthSeries: [],
    topServices: []
  };

  return {
    organizationName,
    timezone,
    filters,
    periodWindow,
    services: [],
    kpis: {
      recoveredRevenue: emptyKpi("Revenus récupérés", formatCurrency(0)),
      recoveredAppointments: emptyKpi("Rendez-vous récupérés", "0"),
      responseRate: emptyKpi("Taux de réponse", "0 %"),
      cancellationsReceived: emptyKpi("Annulations reçues", "0"),
      smsSent: emptyKpi("SMS envoyés", "0"),
      clientsAdded: emptyKpi("Clients ajoutés", "0")
    },
    recoveredRevenueSeries: [],
    recoveredRevenueTotalCents: 0,
    recoveredRevenueTrend: emptyTrend,
    smsVsResponsesSeries: [],
    funnel: { steps: [], globalConversionRate: 0 },
    responseRateDonut: {
      rate: 0,
      responses: 0,
      noResponse: 0,
      trend: emptyTrend
    },
    waitlistGrowthSeries: [],
    waitlistTotal: 0,
    waitlistTrend: emptyTrend,
    topServices: [],
    exportPayload
  };
}

export async function loadInsightsData({
  organizationId,
  organizationName,
  timezone,
  filters
}: {
  organizationId: string;
  organizationName: string;
  timezone: string;
  filters: InsightsFilters;
}): Promise<InsightsData> {
  assertDashboardOrganizationId(organizationId);

  const periodWindow = getInsightsPeriodWindow({
    period: filters.period,
    timezone
  });
  const supabase = await createSupabaseServerClient();
  const queryStart = periodWindow.previousStart;

  const [
    servicesResult,
    openingsResult,
    bookingsResult,
    smsResult,
    offersResult,
    customersResult,
    waitlistResult
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("openings")
      .select("id, service_id, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", queryStart)
      .lt("created_at", periodWindow.end),
    supabase
      .from("booking_requests")
      .select("opening_id, status, recovered_value_cents, confirmed_at, created_at")
      .eq("organization_id", organizationId)
      .in("status", ["confirmed", "completed"])
      .or(
        `confirmed_at.gte.${queryStart},and(confirmed_at.is.null,created_at.gte.${queryStart})`
      ),
    supabase
      .from("sms_messages")
      .select("opening_id, direction, message_type, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", queryStart),
    supabase
      .from("opening_offers")
      .select("opening_id, status, responded_at, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("customers")
      .select("id, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", queryStart)
      .lt("created_at", periodWindow.end),
    supabase
      .from("waitlist_entries")
      .select("customer_id, created_at")
      .eq("organization_id", organizationId)
  ]);

  if (servicesResult.error) {
    throw new Error(`Services query failed: ${servicesResult.error.message}`);
  }

  if (openingsResult.error) {
    throw new Error(`Openings query failed: ${openingsResult.error.message}`);
  }

  if (bookingsResult.error) {
    throw new Error(`Bookings query failed: ${bookingsResult.error.message}`);
  }

  if (smsResult.error) {
    throw new Error(`SMS query failed: ${smsResult.error.message}`);
  }

  if (offersResult.error) {
    throw new Error(`Offers query failed: ${offersResult.error.message}`);
  }

  if (customersResult.error) {
    throw new Error(`Customers query failed: ${customersResult.error.message}`);
  }

  if (waitlistResult.error) {
    throw new Error(`Waitlist query failed: ${waitlistResult.error.message}`);
  }

  const services = servicesResult.data ?? [];
  const openings = openingsResult.data ?? [];
  const bookings = bookingsResult.data ?? [];
  const smsMessages = smsResult.data ?? [];
  const offers = offersResult.data ?? [];
  const customers = customersResult.data ?? [];
  const waitlistEntries = waitlistResult.data ?? [];
  const serviceId = filters.serviceId;

  const currentMetrics = summarizePeriodMetrics({
    openings,
    bookings,
    smsMessages,
    offers,
    customers,
    serviceId,
    start: periodWindow.start,
    end: periodWindow.end
  });
  const previousMetrics = summarizePeriodMetrics({
    openings,
    bookings,
    smsMessages,
    offers,
    customers,
    serviceId,
    start: periodWindow.previousStart,
    end: periodWindow.previousEnd
  });

  const recoveredRevenueSeries = buildRecoveredRevenueSeries({
    bookings,
    openings,
    serviceId,
    start: periodWindow.start,
    end: periodWindow.end,
    granularity: filters.granularity,
    timezone
  });
  const smsVsResponsesSeries = buildSmsVsResponsesSeries({
    smsMessages,
    offers,
    openings,
    serviceId,
    start: periodWindow.start,
    end: periodWindow.end,
    granularity: filters.granularity,
    timezone
  });
  const waitlistGrowthSeries = buildWaitlistGrowthSeries({
    customers,
    waitlistEntries,
    start: periodWindow.start,
    end: periodWindow.end,
    timezone
  });
  const funnel = buildFunnel({
    openings,
    offers,
    bookings,
    serviceId,
    start: periodWindow.start,
    end: periodWindow.end
  });
  const topServices = buildTopServices({
    openings,
    offers,
    bookings,
    smsMessages,
    services,
    start: periodWindow.start,
    end: periodWindow.end
  });

  const previousLabel = periodWindow.previousDateRangeLabel;
  const recoveredRevenueTrend = calculatePercentTrend(
    currentMetrics.recoveredRevenueCents,
    previousMetrics.recoveredRevenueCents,
    previousLabel
  );
  const recoveredAppointmentsTrend = calculatePercentTrend(
    currentMetrics.recoveredAppointments,
    previousMetrics.recoveredAppointments,
    previousLabel
  );
  const responseRateTrend = calculatePointsTrend(
    currentMetrics.responseRate,
    previousMetrics.responseRate,
    previousLabel
  );
  const cancellationsTrend = calculatePercentTrend(
    currentMetrics.cancellationsReceived,
    previousMetrics.cancellationsReceived,
    previousLabel
  );
  const smsSentTrend = calculatePercentTrend(
    currentMetrics.smsSent,
    previousMetrics.smsSent,
    previousLabel
  );
  const clientsAddedTrend = calculatePercentTrend(
    currentMetrics.clientsAdded,
    previousMetrics.clientsAdded,
    previousLabel
  );
  const waitlistTotal =
    waitlistGrowthSeries[waitlistGrowthSeries.length - 1]?.value ?? 0;
  const previousWaitlistTotal = buildWaitlistGrowthSeries({
    customers,
    waitlistEntries,
    start: periodWindow.previousStart,
    end: periodWindow.previousEnd,
    timezone
  }).at(-1)?.value ?? 0;
  const waitlistTrend = calculatePercentTrend(
    waitlistTotal,
    previousWaitlistTotal,
    previousLabel
  );

  const noResponse = Math.max(currentMetrics.alertsSent - currentMetrics.responses, 0);
  const selectedService = services.find((service) => service.id === serviceId);

  const kpis = {
    recoveredRevenue: buildKpi(
      "Revenus récupérés",
      formatCurrency(currentMetrics.recoveredRevenueCents),
      recoveredRevenueTrend
    ),
    recoveredAppointments: buildKpi(
      "Rendez-vous récupérés",
      String(currentMetrics.recoveredAppointments),
      recoveredAppointmentsTrend
    ),
    responseRate: buildKpi(
      "Taux de réponse",
      formatPercent(currentMetrics.responseRate),
      responseRateTrend
    ),
    cancellationsReceived: buildKpi(
      "Annulations reçues",
      String(currentMetrics.cancellationsReceived),
      cancellationsTrend
    ),
    smsSent: buildKpi(
      "SMS envoyés",
      String(currentMetrics.smsSent),
      smsSentTrend
    ),
    clientsAdded: buildKpi(
      "Clients ajoutés",
      String(currentMetrics.clientsAdded),
      clientsAddedTrend
    )
  };

  const exportPayload: InsightsExportPayload = {
    generatedAt: new Date().toISOString(),
    organizationName,
    timezone,
    periodLabel:
      filters.period === "all"
        ? "Toujours"
        : filters.period,
    dateRangeLabel: periodWindow.dateRangeLabel,
    serviceLabel: selectedService?.name ?? "Tous les services",
    kpis: Object.values(kpis).map((kpi) => ({
      label: kpi.label,
      value: kpi.value,
      trend: kpi.trend.display
    })),
    recoveredRevenueSeries,
    smsVsResponsesSeries,
    funnel: funnel.steps,
    responseRateDonut: {
      rate: currentMetrics.responseRate,
      responses: currentMetrics.responses,
      noResponse
    },
    waitlistGrowthSeries,
    topServices
  };

  return {
    organizationName,
    timezone,
    filters,
    periodWindow,
    services,
    kpis,
    recoveredRevenueSeries,
    recoveredRevenueTotalCents: currentMetrics.recoveredRevenueCents,
    recoveredRevenueTrend,
    smsVsResponsesSeries,
    funnel,
    responseRateDonut: {
      rate: currentMetrics.responseRate,
      responses: currentMetrics.responses,
      noResponse,
      trend: responseRateTrend
    },
    waitlistGrowthSeries,
    waitlistTotal,
    waitlistTrend,
    topServices,
    exportPayload
  };
}

export function parseInsightsFilters(searchParams: {
  period?: string;
  service?: string;
  granularity?: string;
}): InsightsFilters {
  const period = normalizeInsightsPeriod(searchParams.period);
  const serviceId =
    searchParams.service && searchParams.service !== "all"
      ? searchParams.service
      : null;

  return {
    period,
    serviceId,
    granularity: normalizeInsightsGranularity(searchParams.granularity)
  };
}

export function getInsightsEmptyData({
  organizationName,
  timezone,
  filters
}: {
  organizationName: string;
  timezone: string;
  filters: InsightsFilters;
}) {
  const periodWindow = getInsightsPeriodWindow({
    period: filters.period,
    timezone
  });

  return getEmptyInsightsData({
    organizationName,
    timezone,
    filters,
    periodWindow
  });
}
