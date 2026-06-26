import type { InsightsGranularity, InsightsPeriod, InsightsPeriodWindow } from "@/lib/analytics/types";

export const INSIGHTS_PERIOD_OPTIONS = [
  { value: "1w" as const, label: "1 sem", days: 7 },
  { value: "2w" as const, label: "2 sem", days: 14 },
  { value: "1m" as const, label: "1 mois", days: 30 },
  { value: "3m" as const, label: "3 mois", days: 90 },
  { value: "12m" as const, label: "12 mois", days: 365 },
  { value: "all" as const, label: "Toujours", days: null }
];

const DEFAULT_ALL_START = new Date("2020-01-01T00:00:00.000Z");

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatShortDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    timeZone: timezone
  }).format(date);
}

function formatDateRangeLabel(
  start: Date,
  end: Date,
  timezone: string
) {
  const endInclusive = addDays(end, -1);
  return `${formatShortDate(start, timezone)} – ${formatShortDate(endInclusive, timezone)}`;
}

export function normalizeInsightsPeriod(
  value: string | null | undefined
): InsightsPeriod {
  if (
    value === "1w" ||
    value === "2w" ||
    value === "1m" ||
    value === "3m" ||
    value === "12m" ||
    value === "all"
  ) {
    return value;
  }

  return "1m";
}

export function normalizeInsightsGranularity(
  value: string | null | undefined
): InsightsGranularity {
  if (value === "weekly" || value === "monthly") {
    return value;
  }

  return "daily";
}

export function getInsightsPeriodWindow({
  period,
  timezone,
  now = new Date(),
  earliestDataAt
}: {
  period: InsightsPeriod;
  timezone: string;
  now?: Date;
  earliestDataAt?: string | null;
}): InsightsPeriodWindow {
  const end = new Date(now);
  let start: Date;

  if (period === "all") {
    start = earliestDataAt
      ? startOfDay(new Date(earliestDataAt))
      : DEFAULT_ALL_START;
  } else {
    const option = INSIGHTS_PERIOD_OPTIONS.find((item) => item.value === period);
    const days = option?.days ?? 30;
    start = startOfDay(addDays(end, -(days - 1)));
  }

  const durationMs = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
  const previousEnd = new Date(start);
  const previousStart =
    period === "all"
      ? new Date(start)
      : new Date(previousEnd.getTime() - durationMs);

  return {
    period,
    start: start.toISOString(),
    end: end.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: previousEnd.toISOString(),
    dateRangeLabel: formatDateRangeLabel(start, end, timezone),
    previousDateRangeLabel: formatDateRangeLabel(
      previousStart,
      previousEnd,
      timezone
    )
  };
}

export function isWithinRange(
  value: string | null | undefined,
  startInclusive: string,
  endExclusive: string
) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return date >= new Date(startInclusive) && date < new Date(endExclusive);
}

export function getPeriodDays(period: InsightsPeriod) {
  const option = INSIGHTS_PERIOD_OPTIONS.find((item) => item.value === period);
  return option?.days ?? 30;
}
