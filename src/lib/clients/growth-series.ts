export type GrowthSeriesPoint = {
  dateKey: string;
  label: string;
  fullLabel: string;
  count: number;
};

export const GROWTH_CHART_PERIODS = [
  { days: 7, label: "7 derniers jours" },
  { days: 30, label: "30 derniers jours" },
  { days: 90, label: "90 derniers jours" }
] as const;

export type GrowthChartPeriodDays =
  (typeof GROWTH_CHART_PERIODS)[number]["days"];

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function getDateKey(date: Date) {
  return date.toLocaleDateString("fr-CA");
}

function formatShortLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatFullLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function buildGrowthSeries(
  timestamps: string[],
  days: GrowthChartPeriodDays | number = 30
): GrowthSeriesPoint[] {
  const now = startOfDay(new Date());
  const series: GrowthSeriesPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const count = timestamps.filter((value) => new Date(value) <= endOfDay).length;

    series.push({
      dateKey: getDateKey(day),
      label: formatShortLabel(day),
      fullLabel: formatFullLabel(day),
      count
    });
  }

  return series;
}

export function getGrowthChartXTickInterval(seriesLength: number) {
  if (seriesLength <= 7) {
    return 1;
  }

  if (seriesLength <= 30) {
    return 7;
  }

  return 14;
}
