import {
  addDaysToZonedParts,
  parseDateKeyInTimezone,
  toDateKey,
  utcToZonedParts,
  zonedDateTimeToUtc,
  zonedPartsToLocalString,
  type ZonedDateTimeParts
} from "@/lib/appointments/timezone";

export type CalendarViewMode = "month" | "week" | "day";

export const CALENDAR_HOUR_START = 8;
export const CALENDAR_HOUR_END = 18;
export const CALENDAR_HOUR_HEIGHT = 64;

export function parseCalendarView(value: string | undefined): CalendarViewMode {
  if (value === "week" || value === "day") {
    return value;
  }

  return "month";
}

export function parseCalendarDateKey(
  value: string | undefined,
  timezone: string
): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const now = utcToZonedParts(new Date(), timezone);
  return toDateKey(now);
}

export function getMondayOfWeek(parts: ZonedDateTimeParts, timezone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).format(zonedPartsToDate(parts, timezone));
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };
  const index = map[weekday] ?? 0;
  return addDaysToZonedParts(parts, -index, timezone);
}

function zonedPartsToDate(parts: ZonedDateTimeParts, timezone: string) {
  return zonedDateTimeToUtc(zonedPartsToLocalString(parts), timezone);
}

export function getMonthGridDays(
  anchorDateKey: string,
  timezone: string
): Array<{ dateKey: string; inCurrentMonth: boolean }> {
  const anchor = parseDateKeyInTimezone(anchorDateKey, timezone);
  const firstOfMonth: ZonedDateTimeParts = {
    ...anchor,
    day: 1
  };
  const monday = getMondayOfWeek(firstOfMonth, timezone);
  const days: Array<{ dateKey: string; inCurrentMonth: boolean }> = [];

  for (let index = 0; index < 42; index += 1) {
    const day = addDaysToZonedParts(monday, index, timezone);
    days.push({
      dateKey: toDateKey(day),
      inCurrentMonth: day.month === anchor.month && day.year === anchor.year
    });
  }

  return days;
}

export function getWeekDays(anchorDateKey: string, timezone: string) {
  const anchor = parseDateKeyInTimezone(anchorDateKey, timezone);
  const monday = getMondayOfWeek(anchor, timezone);

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDaysToZonedParts(monday, index, timezone);
    return {
      dateKey: toDateKey(day),
      parts: day
    };
  });
}

export function shiftCalendarDate(
  anchorDateKey: string,
  view: CalendarViewMode,
  direction: -1 | 1,
  timezone: string
) {
  const anchor = parseDateKeyInTimezone(anchorDateKey, timezone);

  if (view === "month") {
    let month = anchor.month + direction;
    let year = anchor.year;

    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }

    const day = Math.min(anchor.day, daysInMonth(year, month));
    return toDateKey({ year, month, day });
  }

  if (view === "week") {
    return toDateKey(addDaysToZonedParts(anchor, direction * 7, timezone));
  }

  return toDateKey(addDaysToZonedParts(anchor, direction, timezone));
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getCalendarQueryRange(
  view: CalendarViewMode,
  anchorDateKey: string,
  timezone: string
): { startIso: string; endIso: string } {
  if (view === "day") {
    const start = zonedDateTimeToUtc(`${anchorDateKey}T00:00:00`, timezone);
    const end = zonedDateTimeToUtc(`${anchorDateKey}T23:59:59`, timezone);
    end.setUTCSeconds(59, 999);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }

  if (view === "week") {
    const days = getWeekDays(anchorDateKey, timezone);
    const start = zonedDateTimeToUtc(`${days[0].dateKey}T00:00:00`, timezone);
    const end = zonedDateTimeToUtc(`${days[6].dateKey}T23:59:59`, timezone);
    end.setUTCSeconds(59, 999);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }

  const grid = getMonthGridDays(anchorDateKey, timezone);
  const start = zonedDateTimeToUtc(`${grid[0].dateKey}T00:00:00`, timezone);
  const end = zonedDateTimeToUtc(`${grid[grid.length - 1].dateKey}T23:59:59`, timezone);
  end.setUTCSeconds(59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function buildAppointmentsHref({
  view,
  date
}: {
  view: CalendarViewMode;
  date: string;
}) {
  const params = new URLSearchParams();
  params.set("view", view);
  params.set("date", date);
  return `/dashboard/appointments?${params.toString()}`;
}

export type TimedAppointment = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  durationMinutes?: number | null;
};

export function getAppointmentDurationMinutes(appointment: TimedAppointment) {
  if (appointment.ends_at) {
    const start = new Date(appointment.starts_at).getTime();
    const end = new Date(appointment.ends_at).getTime();

    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return Math.round((end - start) / 60_000);
    }
  }

  if (appointment.durationMinutes && appointment.durationMinutes > 0) {
    return appointment.durationMinutes;
  }

  return 60;
}

export function getAppointmentTopAndHeight(
  startsAt: string,
  durationMinutes: number,
  hourStart = CALENDAR_HOUR_START,
  hourEnd = CALENDAR_HOUR_END,
  hourHeight = CALENDAR_HOUR_HEIGHT,
  timezone: string
) {
  const parts = utcToZonedParts(new Date(startsAt), timezone);
  const totalMinutes = (hourEnd - hourStart) * 60;
  const startMinutes = parts.hour * 60 + parts.minute - hourStart * 60;
  const clampedStart = Math.max(0, startMinutes);
  const clampedDuration = Math.min(durationMinutes, totalMinutes - clampedStart);

  return {
    top: (clampedStart / 60) * hourHeight,
    height: Math.max((clampedDuration / 60) * hourHeight, 28),
    startsBeforeRange: startMinutes < 0,
    endsAfterRange: startMinutes + durationMinutes > totalMinutes
  };
}

export type OverlapLayout = {
  column: number;
  columnCount: number;
};

export function layoutOverlappingEvents<
  T extends {
    id: string;
    starts_at: string;
    ends_at: string | null;
    durationMinutes?: number | null;
  }
>(events: T[]): Map<string, OverlapLayout> {
  const sorted = [...events].sort(
    (left, right) =>
      new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime()
  );
  const layouts = new Map<string, OverlapLayout>();

  type ActiveEvent = {
    id: string;
    end: number;
    column: number;
  };

  let active: ActiveEvent[] = [];
  let cluster: string[] = [];
  let clusterMaxColumns = 1;

  function flushCluster() {
    for (const id of cluster) {
      layouts.set(id, {
        column: layouts.get(id)?.column ?? 0,
        columnCount: clusterMaxColumns
      });
    }
    cluster = [];
    clusterMaxColumns = 1;
  }

  for (const event of sorted) {
    const start = new Date(event.starts_at).getTime();
    const duration = getAppointmentDurationMinutes(event);
    const end = start + duration * 60_000;

    active = active.filter((item) => item.end > start);

    if (active.length === 0 && cluster.length > 0) {
      flushCluster();
    }

    const usedColumns = new Set(active.map((item) => item.column));
    let column = 0;

    while (usedColumns.has(column)) {
      column += 1;
    }

    active.push({ id: event.id, end, column });
    cluster.push(event.id);
    clusterMaxColumns = Math.max(clusterMaxColumns, active.length);
    layouts.set(event.id, { column, columnCount: 1 });
  }

  flushCluster();
  return layouts;
}

export function getVisibleHourRange(
  appointments: TimedAppointment[],
  timezone: string,
  defaultStart = CALENDAR_HOUR_START,
  defaultEnd = CALENDAR_HOUR_END
) {
  let start = defaultStart;
  let end = defaultEnd;

  for (const appointment of appointments) {
    const parts = utcToZonedParts(new Date(appointment.starts_at), timezone);
    const duration = getAppointmentDurationMinutes(appointment);
    const appointmentEndHour =
      parts.hour + parts.minute / 60 + duration / 60;

    if (parts.hour < start) {
      start = Math.max(0, parts.hour);
    }

    if (appointmentEndHour > end) {
      end = Math.min(23, Math.ceil(appointmentEndHour));
    }
  }

  return { start, end };
}
