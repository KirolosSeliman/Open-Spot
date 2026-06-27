import type { AppointmentCalendarItem, CalendarInterval } from "./types";

export function normalizeCalendarInterval(
  value: string | undefined
): CalendarInterval {
  switch (value) {
    case "2d":
      return "2d";
    case "1w":
      return "1w";
    case "1m":
      return "1m";
    default:
      return "1d";
  }
}

function parseCalendarDate(value: string | undefined) {
  if (!value) {
    return new Date();
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

export function getCalendarRange(
  anchor: Date,
  interval: CalendarInterval
): { start: Date; end: Date } {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  switch (interval) {
    case "2d":
      end.setDate(end.getDate() + 2);
      break;
    case "1w":
      end.setDate(end.getDate() + 7);
      break;
    case "1m":
      end.setMonth(end.getMonth() + 1);
      break;
    default:
      end.setDate(end.getDate() + 1);
      break;
  }

  return { start, end };
}

export function shiftCalendarAnchor(
  anchor: Date,
  interval: CalendarInterval,
  direction: -1 | 1
) {
  const next = new Date(anchor);

  switch (interval) {
    case "2d":
      next.setDate(next.getDate() + direction * 2);
      break;
    case "1w":
      next.setDate(next.getDate() + direction * 7);
      break;
    case "1m":
      next.setMonth(next.getMonth() + direction);
      break;
    default:
      next.setDate(next.getDate() + direction);
      break;
  }

  return next;
}

export function formatCalendarAnchorKey(date: Date) {
  return date.toLocaleDateString("fr-CA");
}

export function formatCalendarRangeLabel(
  start: Date,
  end: Date,
  locale: string
) {
  const endInclusive = new Date(end);
  endInclusive.setMilliseconds(endInclusive.getMilliseconds() - 1);

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium"
  });

  if (start.toDateString() === endInclusive.toDateString()) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} – ${formatter.format(endInclusive)}`;
}

export function parseCalendarAnchor(value: string | undefined) {
  return parseCalendarDate(value);
}

export function groupAppointmentsByDay(items: AppointmentCalendarItem[]) {
  const groups = new Map<string, AppointmentCalendarItem[]>();

  for (const item of items) {
    const key = new Date(item.startsAt).toLocaleDateString("fr-CA");
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dayItems]) => ({
      dateKey,
      dateLabel: new Intl.DateTimeFormat("fr-CA", { dateStyle: "full" }).format(
        new Date(`${dateKey}T12:00:00`)
      ),
      items: dayItems.sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )
    }));
}
