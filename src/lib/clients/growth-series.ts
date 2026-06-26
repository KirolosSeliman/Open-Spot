export type GrowthSeriesPoint = {
  dateKey: string;
  label: string;
  fullLabel: string;
  count: number;
};

export type WaitlistEnrollment = {
  customerId: string;
  enrolledAt: string;
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

export function buildUniqueWaitlistEnrollments(
  customers: Array<{ id: string; created_at: string }>,
  waitlistEntries: Array<{ customer_id: string; created_at: string }>
): WaitlistEnrollment[] {
  const enrollmentByCustomer = new Map<string, string>();

  for (const entry of waitlistEntries) {
    const existing = enrollmentByCustomer.get(entry.customer_id);
    if (!existing || new Date(entry.created_at) < new Date(existing)) {
      enrollmentByCustomer.set(entry.customer_id, entry.created_at);
    }
  }

  for (const customer of customers) {
    const existing = enrollmentByCustomer.get(customer.id);
    if (!existing) {
      continue;
    }

    if (new Date(customer.created_at) < new Date(existing)) {
      enrollmentByCustomer.set(customer.id, customer.created_at);
    }
  }

  return Array.from(enrollmentByCustomer.entries()).map(([customerId, enrolledAt]) => ({
    customerId,
    enrolledAt
  }));
}

export function buildGrowthSeries(
  enrollments: WaitlistEnrollment[],
  days: GrowthChartPeriodDays | number = 30
): GrowthSeriesPoint[] {
  const now = startOfDay(new Date());
  const series: GrowthSeriesPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const count = enrollments.filter(
      (enrollment) => new Date(enrollment.enrolledAt) <= endOfDay
    ).length;

    series.push({
      dateKey: getDateKey(day),
      label: formatShortLabel(day),
      fullLabel: formatFullLabel(day),
      count
    });
  }

  return series;
}

export function getGrowthChartYScale(maxValue: number) {
  if (maxValue <= 0) {
    return { max: 1, ticks: [0, 1] };
  }

  if (maxValue <= 5) {
    return {
      max: maxValue,
      ticks: Array.from({ length: maxValue + 1 }, (_, index) => index)
    };
  }

  if (maxValue <= 10) {
    const max = Math.max(6, Math.ceil(maxValue / 2) * 2);
    const step = max <= 6 ? 1 : 2;
    const ticks: number[] = [];

    for (let tick = 0; tick <= max; tick += step) {
      ticks.push(tick);
    }

    return { max, ticks };
  }

  const roughStep = Math.ceil(maxValue / 5);
  const step = getNiceIntegerStep(roughStep);
  const max = Math.ceil(maxValue / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, index) => index * step);

  return { max, ticks };
}

function getNiceIntegerStep(value: number) {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  const normalized = value / magnitude;

  if (normalized <= 1) {
    return magnitude;
  }

  if (normalized <= 2) {
    return 2 * magnitude;
  }

  if (normalized <= 5) {
    return 5 * magnitude;
  }

  return 10 * magnitude;
}

export function getGrowthChartXTickIndexes(seriesLength: number) {
  if (seriesLength <= 0) {
    return [];
  }

  if (seriesLength === 1) {
    return [0];
  }

  const targetLabelCount = 5;
  const interval = Math.max(Math.floor(seriesLength / targetLabelCount), 1);
  const indexes = [0];

  for (let index = interval; index < seriesLength - 1; index += interval) {
    indexes.push(index);
  }

  const lastIndex = seriesLength - 1;
  const previousIndex = indexes[indexes.length - 1] ?? 0;
  const minGapBeforeLast = Math.max(Math.ceil(interval / 2), 1);

  if (lastIndex - previousIndex >= minGapBeforeLast) {
    indexes.push(lastIndex);
  }

  return indexes;
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
