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

export type SubscriptionYearOption = {
  year: number;
  isActive: boolean;
  href: string;
};

export type OrganizationRegistrationBounds = {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
};

export type SubscriptionSelection = {
  key: string;
  year: number;
  month: number;
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

export function getOrganizationRegistrationBounds({
  registeredAt,
  timezone,
  now = new Date()
}: {
  registeredAt: string;
  timezone: string;
  now?: Date;
}): OrganizationRegistrationBounds {
  const start = getZonedParts(new Date(registeredAt), timezone);
  const end = getZonedParts(now, timezone);

  return {
    startYear: start.year,
    startMonth: start.month,
    endYear: end.year,
    endMonth: end.month
  };
}

function getMonthRangeForYear(
  year: number,
  bounds: OrganizationRegistrationBounds
) {
  const minMonth = year === bounds.startYear ? bounds.startMonth : 1;
  const maxMonth = year === bounds.endYear ? bounds.endMonth : 12;

  return { minMonth, maxMonth };
}

export function clampSubscriptionSelection({
  year,
  month,
  bounds
}: {
  year: number;
  month: number;
  bounds: OrganizationRegistrationBounds;
}): SubscriptionSelection {
  const clampedYear = Math.max(
    bounds.startYear,
    Math.min(bounds.endYear, year)
  );
  const { minMonth, maxMonth } = getMonthRangeForYear(clampedYear, bounds);
  const clampedMonth = Math.max(minMonth, Math.min(maxMonth, month));

  return {
    year: clampedYear,
    month: clampedMonth,
    key: buildSubscriptionMonthKey(clampedYear, clampedMonth)
  };
}

export function parseSubscriptionSelection({
  monthKey,
  registeredAt,
  timezone,
  now = new Date()
}: {
  monthKey: string | null | undefined;
  registeredAt: string;
  timezone: string;
  now?: Date;
}): SubscriptionSelection {
  const bounds = getOrganizationRegistrationBounds({
    registeredAt,
    timezone,
    now
  });
  const fallback = clampSubscriptionSelection({
    year: bounds.endYear,
    month: bounds.endMonth,
    bounds
  });

  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return fallback;
  }

  const [yearPart, monthPart] = monthKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return fallback;
  }

  return clampSubscriptionSelection({ year, month, bounds });
}

export function buildSubscriptionHref({
  year,
  month,
  bounds
}: {
  year: number;
  month: number;
  bounds: OrganizationRegistrationBounds;
}) {
  const selection = clampSubscriptionSelection({ year, month, bounds });

  return `/dashboard/billing?month=${selection.key}`;
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

export function buildSubscriptionYearOptions({
  bounds,
  activeYear,
  activeMonth
}: {
  bounds: OrganizationRegistrationBounds;
  activeYear: number;
  activeMonth: number;
}): SubscriptionYearOption[] {
  const options: SubscriptionYearOption[] = [];

  for (let year = bounds.startYear; year <= bounds.endYear; year += 1) {
    options.push({
      year,
      isActive: year === activeYear,
      href: buildSubscriptionHref({ year, month: activeMonth, bounds })
    });
  }

  return options;
}

export function buildSubscriptionMonthOptions({
  activeKey,
  selectedYear,
  bounds,
  locale,
  now = new Date(),
  timezone
}: {
  activeKey: string;
  selectedYear: number;
  bounds: OrganizationRegistrationBounds;
  locale: "fr" | "en";
  now?: Date;
  timezone: string;
}): SubscriptionMonthOption[] {
  const current = getZonedParts(now, timezone);
  const monthNames = locale === "fr" ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const { minMonth, maxMonth } = getMonthRangeForYear(selectedYear, bounds);
  const options: SubscriptionMonthOption[] = [];

  for (let month = minMonth; month <= maxMonth; month += 1) {
    const key = buildSubscriptionMonthKey(selectedYear, month);
    const isFuture =
      selectedYear > current.year ||
      (selectedYear === current.year && month > current.month);
    const label = monthNames[month - 1];
    const labelWithYear = `${label} ${selectedYear}`;

    options.push({
      key,
      year: selectedYear,
      month,
      label,
      labelWithYear,
      isActive: key === activeKey,
      isFuture,
      isCurrent:
        selectedYear === current.year && month === current.month
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
