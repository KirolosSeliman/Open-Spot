export type DashboardRange = "7d" | "30d" | "90d";

export type DashboardDateRangeWindow = {
  range: DashboardRange;
  days: number;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  startIso: string;
  endIso: string;
  previousStartIso: string;
  previousEndIso: string;
};

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function normalizeDashboardRange(
  value: string | null | undefined
): DashboardRange {
  if (value === "30d" || value === "90d") {
    return value;
  }

  return "7d";
}

export function getDashboardDateRange(
  range: DashboardRange,
  now = new Date()
): DashboardDateRangeWindow {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const end = endOfDay(now);
  const start = startOfDay(new Date(end));
  start.setDate(start.getDate() - (days - 1));

  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
  const previousStart = startOfDay(new Date(previousEnd));
  previousStart.setDate(previousStart.getDate() - (days - 1));

  return {
    range,
    days,
    start,
    end,
    previousStart,
    previousEnd,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    previousStartIso: previousStart.toISOString(),
    previousEndIso: previousEnd.toISOString()
  };
}

export function buildDailyCounts(
  timestamps: string[],
  rangeStart: Date,
  dayCount: number
): number[] {
  const buckets = Array.from({ length: dayCount }, () => 0);
  const rangeStartTime = startOfDay(rangeStart).getTime();
  const dayMs = 86_400_000;

  for (const timestamp of timestamps) {
    const time = new Date(timestamp).getTime();

    if (!Number.isFinite(time)) {
      continue;
    }

    const dayIndex = Math.floor((startOfDay(new Date(time)).getTime() - rangeStartTime) / dayMs);

    if (dayIndex >= 0 && dayIndex < dayCount) {
      buckets[dayIndex] += 1;
    }
  }

  return buckets;
}

export function buildCumulativeSeries(
  timestamps: string[],
  rangeStart: Date,
  dayCount: number,
  baselineCount: number
): number[] {
  const dailyNew = buildDailyCounts(timestamps, rangeStart, dayCount);
  let running = baselineCount;

  return dailyNew.map((count) => {
    running += count;
    return running;
  });
}

export function sumSeries(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function countInWindow(
  timestamps: string[],
  windowStart: Date,
  windowEnd: Date
) {
  const startTime = windowStart.getTime();
  const endTime = windowEnd.getTime();

  return timestamps.filter((timestamp) => {
    const time = new Date(timestamp).getTime();
    return Number.isFinite(time) && time >= startTime && time <= endTime;
  }).length;
}

export type PeriodChange = {
  percent: number;
  direction: "up" | "down" | "neutral";
  display: string;
  isNew: boolean;
};

export function calculatePeriodChange(
  current: number,
  previous: number,
  locale: "fr" | "en" = "fr"
): PeriodChange {
  if (previous === 0 && current > 0) {
    return {
      percent: 100,
      direction: "up",
      display: locale === "fr" ? "Nouveau" : "New",
      isNew: true
    };
  }

  if (previous === 0 && current === 0) {
    return {
      percent: 0,
      direction: "neutral",
      display: "0 %",
      isNew: false
    };
  }

  const rawPercent = ((current - previous) / previous) * 100;
  const rounded = Math.round(rawPercent * 10) / 10;
  const direction =
    rounded > 0 ? "up" : rounded < 0 ? "down" : "neutral";
  const sign = rounded > 0 ? "+" : "";
  const formatted =
    locale === "fr"
      ? `${sign}${rounded.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} %`
      : `${sign}${rounded.toLocaleString("en-CA", { maximumFractionDigits: 1 })} %`;

  return {
    percent: rounded,
    direction,
    display: formatted,
    isNew: false
  };
}

export function formatDashboardRangeLabel(
  window: Pick<DashboardDateRangeWindow, "start" | "end">,
  locale: "fr" | "en"
) {
  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return `${formatter.format(window.start)} – ${formatter.format(window.end)}`;
}

export function formatPreviousRangeLabel(
  window: Pick<DashboardDateRangeWindow, "previousStart" | "previousEnd">,
  locale: "fr" | "en"
) {
  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "numeric",
    month: "short"
  });

  return locale === "fr"
    ? `vs. ${formatter.format(window.previousStart)}–${formatter.format(window.previousEnd)}`
    : `vs. ${formatter.format(window.previousStart)}–${formatter.format(window.previousEnd)}`;
}

export function formatDayAxisLabels(
  rangeStart: Date,
  dayCount: number,
  locale: "fr" | "en"
) {
  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "numeric",
    month: "short"
  });

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + index);
    return formatter.format(date);
  });
}

export function formatRelativeTime(
  value: string,
  locale: "fr" | "en",
  now = new Date()
) {
  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return locale === "fr" ? "Date inconnue" : "Unknown date";
  }

  const diffMs = now.getTime() - time;
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return locale === "fr" ? "à l'instant" : "just now";
  }

  if (diffMinutes < 60) {
    return locale === "fr"
      ? `il y a ${diffMinutes} min`
      : `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return locale === "fr" ? `il y a ${diffHours} h` : `${diffHours} h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return locale === "fr" ? `il y a ${diffDays} j` : `${diffDays} d ago`;
}

export function formatOpeningDateTime(
  value: string,
  locale: "fr" | "en",
  now = new Date()
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "fr" ? "Date inconnue" : "Unknown date";
  }

  const today = startOfDay(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = startOfDay(date);
  const timeFormatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    hour: "2-digit",
    minute: "2-digit"
  });

  if (target.getTime() === today.getTime()) {
    return locale === "fr"
      ? `Aujourd'hui ${timeFormatter.format(date)}`
      : `Today ${timeFormatter.format(date)}`;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (target.getTime() === yesterday.getTime()) {
    return locale === "fr"
      ? `Hier ${timeFormatter.format(date)}`
      : `Yesterday ${timeFormatter.format(date)}`;
  }

  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function avatarColorFromName(name: string) {
  const palette = [
    "#dbeafe",
    "#ede9fe",
    "#dcfce7",
    "#ffedd5",
    "#fce7f3",
    "#e0f2fe"
  ];
  const hash = name.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}
