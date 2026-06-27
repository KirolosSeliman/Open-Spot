export type SubscriptionMonthOption = {
  key: string;
  year: number;
  month: number;
  label: string;
  labelWithYear: string;
  isActive: boolean;
  isFuture: boolean;
  isCurrent: boolean;
};

const MONTH_NAMES_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre"
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

function getZonedParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "1970");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");

  return { year, month };
}

export function buildSubscriptionMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseSubscriptionMonthKey(
  value: string | null | undefined,
  timezone: string,
  now = new Date()
) {
  const current = getZonedParts(now, timezone);

  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [yearPart, monthPart] = value.split("-");
    const year = Number(yearPart);
    const month = Number(monthPart);

    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12
    ) {
      return {
        key: buildSubscriptionMonthKey(year, month),
        year,
        month
      };
    }
  }

  return {
    key: buildSubscriptionMonthKey(current.year, current.month),
    year: current.year,
    month: current.month
  };
}

export function getSubscriptionMonthWindow({
  year,
  month,
  timezone
}: {
  year: number;
  month: number;
  timezone: string;
}) {
  const startLabel = `${year}-${String(month).padStart(2, "0")}-01T00:00:00`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endLabel = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00`;

  const start = zonedDateTimeToUtc(startLabel, timezone);
  const end = zonedDateTimeToUtc(endLabel, timezone);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

function zonedDateTimeToUtc(localDateTime: string, timezone: string) {
  const [datePart, timePart = "00:00:00"] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(guess), timezone);

  return new Date(guess - offsetMinutes * 60_000);
}

function getTimeZoneOffsetMinutes(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
    hour: "2-digit"
  });
  const part = formatter.formatToParts(date).find((item) => item.type === "timeZoneName")
    ?.value;

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

export function buildSubscriptionMonthOptions({
  activeKey,
  timezone,
  locale,
  now = new Date()
}: {
  activeKey: string;
  timezone: string;
  locale: "fr" | "en";
  now?: Date;
}): SubscriptionMonthOption[] {
  const current = getZonedParts(now, timezone);
  const monthNames = locale === "fr" ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const options: SubscriptionMonthOption[] = [];

  for (let month = 1; month <= 12; month += 1) {
    const key = buildSubscriptionMonthKey(current.year, month);
    const isFuture = month > current.month;
    const label = monthNames[month - 1];
    const labelWithYear =
      locale === "fr" ? `${label} ${current.year}` : `${label} ${current.year}`;

    options.push({
      key,
      year: current.year,
      month,
      label,
      labelWithYear,
      isActive: key === activeKey,
      isFuture,
      isCurrent: month === current.month
    });
  }

  return options;
}

export function formatSubscriptionMonthLabel({
  year,
  month,
  locale,
  includeYear = true
}: {
  year: number;
  month: number;
  locale: "fr" | "en";
  includeYear?: boolean;
}) {
  const monthNames = locale === "fr" ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const label = monthNames[month - 1] ?? "";

  if (!includeYear) {
    return label;
  }

  return `${label} ${year}`;
}
