export type AdminDateRangeKey = "7d" | "30d" | "90d" | "custom";

export type AdminDateRange = {
  label: string;
  rangeKey: AdminDateRangeKey;
  from: Date;
  to: Date;
  fromIso: string;
  toIso: string;
};

const maxCustomRangeDays = 365;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function endOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

function parseDateOnly(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function buildFixedRange(days: 7 | 30 | 90, now: Date): AdminDateRange {
  const to = endOfUtcDay(now);
  const from = startOfUtcDay(now);
  from.setUTCDate(from.getUTCDate() - days + 1);

  return {
    label: `${days} days`,
    rangeKey: `${days}d`,
    from,
    to,
    fromIso: from.toISOString(),
    toIso: to.toISOString()
  };
}

export function parseAdminDateRange(
  searchParams: {
    range?: string;
    from?: string;
    to?: string;
  },
  now = new Date()
): AdminDateRange {
  if (searchParams.range === "7d") {
    return buildFixedRange(7, now);
  }

  if (searchParams.range === "90d") {
    return buildFixedRange(90, now);
  }

  if (searchParams.range === "custom") {
    const fromDate = parseDateOnly(searchParams.from);
    const toDate = parseDateOnly(searchParams.to);

    if (fromDate && toDate) {
      const from = startOfUtcDay(fromDate);
      const to = endOfUtcDay(toDate);
      const daySpan = Math.ceil(
        (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (to >= from && daySpan <= maxCustomRangeDays) {
        return {
          label: `${searchParams.from} to ${searchParams.to}`,
          rangeKey: "custom",
          from,
          to,
          fromIso: from.toISOString(),
          toIso: to.toISOString()
        };
      }
    }
  }

  return buildFixedRange(30, now);
}

export function formatAdminDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
