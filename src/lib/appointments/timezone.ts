export type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getTimeZoneOffsetMinutes(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
    hour: "2-digit"
  });
  const part = formatter
    .formatToParts(date)
    .find((item) => item.type === "timeZoneName")?.value;

  if (!part || part === "GMT") {
    return 0;
  }

  const match = part.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);

  if (!match) {
    return 0;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");

  return hours * 60 + Math.sign(hours) * minutes;
}

export function zonedDateTimeToUtc(localDateTime: string, timezone: string) {
  const [datePart, timePart = "00:00:00"] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(guess), timezone);

  return new Date(guess - offsetMinutes * 60_000);
}

export function utcToZonedParts(date: Date, timezone: string): ZonedDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "1970"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "1"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "1"),
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? "0"),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? "0"),
    second: Number(parts.find((part) => part.type === "second")?.value ?? "0")
  };
}

export function zonedPartsToLocalString(parts: ZonedDateTimeParts) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second).padStart(2, "0")}`;
}

export function utcToZonedLocalString(date: Date, timezone: string) {
  return zonedPartsToLocalString(utcToZonedParts(date, timezone));
}

export function addDaysToZonedParts(
  parts: ZonedDateTimeParts,
  days: number,
  timezone: string
): ZonedDateTimeParts {
  const utc = zonedDateTimeToUtc(zonedPartsToLocalString(parts), timezone);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utcToZonedParts(utc, timezone);
}

export function addMonthsToZonedParts(
  parts: ZonedDateTimeParts,
  months: number,
  timezone: string
): ZonedDateTimeParts {
  let year = parts.year;
  let month = parts.month + months;

  while (month > 12) {
    month -= 12;
    year += 1;
  }

  while (month < 1) {
    month += 12;
    year -= 1;
  }

  const maxDay = daysInMonth(year, month);
  const day = Math.min(parts.day, maxDay);

  const candidate: ZonedDateTimeParts = {
    ...parts,
    year,
    month,
    day
  };

  return utcToZonedParts(
    zonedDateTimeToUtc(zonedPartsToLocalString(candidate), timezone),
    timezone
  );
}

export function addYearsToZonedParts(
  parts: ZonedDateTimeParts,
  years: number,
  timezone: string
): ZonedDateTimeParts {
  return addMonthsToZonedParts({ ...parts, year: parts.year + years }, 0, timezone);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getWeekdayIndex(parts: ZonedDateTimeParts, timezone: string) {
  const utc = zonedDateTimeToUtc(zonedPartsToLocalString(parts), timezone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).format(utc);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };

  return map[weekday] ?? utc.getUTCDay();
}

export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number,
  timezone: string
): ZonedDateTimeParts | null {
  const firstDayUtc = zonedDateTimeToUtc(
    `${year}-${String(month).padStart(2, "0")}-01T12:00:00`,
    timezone
  );
  let cursor = utcToZonedParts(firstDayUtc, timezone);
  const firstWeekday = getWeekdayIndex(cursor, timezone);
  const offset = (weekday - firstWeekday + 7) % 7;
  cursor = addDaysToZonedParts(cursor, offset + (nth - 1) * 7, timezone);

  if (cursor.month !== month) {
    return null;
  }

  return cursor;
}

export function getWeekdayOccurrenceInMonth(parts: ZonedDateTimeParts, timezone: string) {
  const weekday = getWeekdayIndex(parts, timezone);
  let nth = 0;

  for (let day = 1; day <= parts.day; day += 1) {
    const candidate = {
      ...parts,
      day
    };
    if (getWeekdayIndex(candidate, timezone) === weekday) {
      nth += 1;
    }
  }

  return { weekday, nth };
}

export function parseDateKeyInTimezone(dateKey: string, timezone: string) {
  return utcToZonedParts(
    zonedDateTimeToUtc(`${dateKey}T12:00:00`, timezone),
    timezone
  );
}

export function toDateKey(parts: Pick<ZonedDateTimeParts, "year" | "month" | "day">) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
