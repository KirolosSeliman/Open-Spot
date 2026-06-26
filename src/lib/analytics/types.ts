export type InsightsPeriod = "1w" | "2w" | "1m" | "3m" | "12m" | "all";

export type InsightsGranularity = "daily" | "weekly" | "monthly";

export type InsightsTrend = {
  display: string;
  tone: "positive" | "negative" | "neutral";
  hasPreviousData: boolean;
};

export type InsightsKpi = {
  label: string;
  value: string;
  trend: InsightsTrend;
};

export type InsightsSeriesPoint = {
  dateKey: string;
  label: string;
  fullLabel: string;
  value: number;
};

export type InsightsDualSeriesPoint = {
  dateKey: string;
  label: string;
  fullLabel: string;
  smsSent: number;
  responses: number;
};

export type InsightsFunnelStep = {
  label: string;
  count: number;
  rateLabel: string | null;
};

export type InsightsServiceRow = {
  serviceId: string;
  serviceName: string;
  cancellations: number;
  responseRate: number;
  recoveredAppointments: number;
  recoveredRevenueCents: number;
};

export type InsightsFilters = {
  period: InsightsPeriod;
  serviceId: string | null;
  granularity: InsightsGranularity;
};

export type InsightsPeriodWindow = {
  period: InsightsPeriod;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
  dateRangeLabel: string;
  previousDateRangeLabel: string;
};

export type InsightsData = {
  organizationName: string;
  timezone: string;
  filters: InsightsFilters;
  periodWindow: InsightsPeriodWindow;
  services: Array<{ id: string; name: string }>;
  kpis: {
    recoveredRevenue: InsightsKpi;
    recoveredAppointments: InsightsKpi;
    responseRate: InsightsKpi;
    cancellationsReceived: InsightsKpi;
    smsSent: InsightsKpi;
    clientsAdded: InsightsKpi;
  };
  recoveredRevenueSeries: InsightsSeriesPoint[];
  recoveredRevenueTotalCents: number;
  recoveredRevenueTrend: InsightsTrend;
  smsVsResponsesSeries: InsightsDualSeriesPoint[];
  funnel: {
    steps: InsightsFunnelStep[];
    globalConversionRate: number;
  };
  responseRateDonut: {
    rate: number;
    responses: number;
    noResponse: number;
    trend: InsightsTrend;
  };
  waitlistGrowthSeries: InsightsSeriesPoint[];
  waitlistTotal: number;
  waitlistTrend: InsightsTrend;
  topServices: InsightsServiceRow[];
  exportPayload: InsightsExportPayload;
};

export type InsightsExportPayload = {
  generatedAt: string;
  organizationName: string;
  timezone: string;
  periodLabel: string;
  dateRangeLabel: string;
  serviceLabel: string;
  kpis: Array<{ label: string; value: string; trend: string }>;
  recoveredRevenueSeries: InsightsSeriesPoint[];
  smsVsResponsesSeries: InsightsDualSeriesPoint[];
  funnel: InsightsFunnelStep[];
  responseRateDonut: {
    rate: number;
    responses: number;
    noResponse: number;
  };
  waitlistGrowthSeries: InsightsSeriesPoint[];
  topServices: InsightsServiceRow[];
};
