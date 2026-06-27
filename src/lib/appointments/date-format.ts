import type { CalendarViewMode } from "@/lib/appointments/calendar";
import { getWeekDays } from "@/lib/appointments/calendar";
import {
  parseDateKeyInTimezone,
  type ZonedDateTimeParts
} from "@/lib/appointments/timezone";
import { intlLocale } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

const WEEKDAY_LABELS_FR = ["LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM.", "DIM."] as const;
const WEEKDAY_LABELS_EN = ["MON.", "TUE.", "WED.", "THU.", "FRI.", "SAT.", "SUN."] as const;

const MONTH_NAMES_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre"
] as const;

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

const MONTH_NAMES_SHORT_FR = [
  "JANV.",
  "FÉVR.",
  "MARS",
  "AVR.",
  "MAI",
  "JUIN",
  "JUIL.",
  "AOÛT",
  "SEPT.",
  "OCT.",
  "NOV.",
  "DÉC."
] as const;

function getMonthNames(locale: Locale) {
  return locale === "fr" ? MONTH_NAMES_FR : MONTH_NAMES_EN;
}

function getWeekdayLabels(locale: Locale) {
  return locale === "fr" ? WEEKDAY_LABELS_FR : WEEKDAY_LABELS_EN;
}

export function formatShortTime(value: string, locale: Locale, timezone: string) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone
  }).format(new Date(value));
}

export function formatTimeRange(
  startsAt: string,
  endsAt: string | null,
  locale: Locale,
  timezone: string
) {
  const start = formatShortTime(startsAt, locale, timezone);

  if (!endsAt) {
    return start;
  }

  const end = formatShortTime(endsAt, locale, timezone);
  return `${start} – ${end}`;
}

export function formatCalendarPeriodTitle({
  view,
  dateKey,
  locale,
  timezone
}: {
  view: CalendarViewMode;
  dateKey: string;
  locale: Locale;
  timezone: string;
}) {
  const parts = parseDateKeyInTimezone(dateKey, timezone);
  const monthNames = getMonthNames(locale);

  if (view === "month") {
    const label = `${monthNames[parts.month - 1]} ${parts.year}`;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  if (view === "day") {
    const date = new Intl.DateTimeFormat(intlLocale(locale), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: timezone
    }).format(new Date(`${dateKey}T12:00:00Z`));

    return date.charAt(0).toUpperCase() + date.slice(1);
  }

  const week = getWeekDays(dateKey, timezone);
  const start = week[0].parts;
  const end = week[6].parts;
  const startLabel = `${start.day} ${monthNames[start.month - 1]}`;
  const endLabel =
    start.month === end.month && start.year === end.year
      ? `${end.day} ${monthNames[end.month - 1]} ${end.year}`
      : `${end.day} ${monthNames[end.month - 1]} ${end.year}`;

  return `${startLabel} – ${endLabel}`;
}

export function formatDayHeader({
  parts,
  locale,
  timezone,
  dateKey
}: {
  parts: ZonedDateTimeParts;
  locale: Locale;
  timezone: string;
  dateKey: string;
}) {
  const labels = getWeekdayLabels(locale);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).format(new Date(`${dateKey}T12:00:00Z`));
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };
  const monthNames = getMonthNames(locale);
  const label = labels[map[weekday] ?? 0];
  return `${label} ${parts.day}${parts.day === parts.day ? ` ${monthNames[parts.month - 1]}` : ""}`;
}

export function formatDaySubheader(dateKey: string, locale: Locale, timezone: string) {
  const parts = parseDateKeyInTimezone(dateKey, timezone);
  const labels = getWeekdayLabels(locale);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).format(new Date(`${dateKey}T12:00:00Z`));
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };
  const monthShort =
    locale === "fr" ? MONTH_NAMES_SHORT_FR[parts.month - 1] : MONTH_NAMES_EN[parts.month - 1].toUpperCase();

  return `${labels[map[weekday] ?? 0]} ${parts.day} ${monthShort} ${parts.year}`;
}

export function formatUpcomingDateBlock(value: string, locale: Locale, timezone: string) {
  const parts = parseDateKeyInTimezone(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(value)),
    timezone
  );
  const monthShort =
    locale === "fr" ? MONTH_NAMES_SHORT_FR[parts.month - 1] : MONTH_NAMES_EN[parts.month - 1].toUpperCase();

  return {
    day: String(parts.day).padStart(2, "0"),
    month: monthShort.replace(".", "")
  };
}

export function formatRecurrencePreviewDate(
  value: string,
  locale: Locale,
  timezone: string
) {
  const date = new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone
  }).format(new Date(value));
  const time = formatShortTime(value, locale, timezone);
  return `${date}, ${time}`;
}

export function getWeekdayHeaderLabels(locale: Locale) {
  return getWeekdayLabels(locale);
}

export function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function toDateTimeLocalValue(value: string | null, timezone: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${year}-${month}-${day}T${hour}:${minute}`;
}
