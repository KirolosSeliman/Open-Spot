import type {
  InsightsDualSeriesPoint,
  InsightsFunnelStep,
  InsightsGranularity,
  InsightsSeriesPoint,
  InsightsServiceRow,
  InsightsTrend
} from "@/lib/analytics/types";
import { isWithinRange } from "@/lib/analytics/periods";

type OpeningRow = {
  id: string;
  service_id: string | null;
  created_at: string;
};

type BookingRow = {
  opening_id: string;
  status: string;
  recovered_value_cents: number | null;
  confirmed_at: string | null;
  created_at: string;
};

type SmsRow = {
  opening_id: string | null;
  direction: string;
  message_type: string | null;
  created_at: string;
};

type OfferRow = {
  opening_id: string;
  status: string;
  responded_at: string | null;
  created_at: string;
};

type CustomerRow = {
  id: string;
  created_at: string;
};

type WaitlistRow = {
  customer_id: string;
  created_at: string;
};

type ServiceRow = {
  id: string;
  name: string;
};

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatShortLabel(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "short",
    timeZone: timezone
  }).format(date);
}

function formatFullLabel(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone
  }).format(date);
}

function getDateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone
  }).format(date);
}

function filterByService<T extends { opening_id?: string | null; service_id?: string | null }>(
  rows: T[],
  openingById: Map<string, OpeningRow>,
  serviceId: string | null
) {
  if (!serviceId) {
    return rows;
  }

  return rows.filter((row) => {
    if ("service_id" in row && row.service_id) {
      return row.service_id === serviceId;
    }

    if (!row.opening_id) {
      return false;
    }

    const opening = openingById.get(row.opening_id);
    return opening?.service_id === serviceId;
  });
}

function filterOpenings(openings: OpeningRow[], serviceId: string | null) {
  if (!serviceId) {
    return openings;
  }

  return openings.filter((opening) => opening.service_id === serviceId);
}

function countInWindow<T>(
  rows: T[],
  getTimestamp: (row: T) => string | null | undefined,
  start: string,
  end: string
) {
  return rows.filter((row) => isWithinRange(getTimestamp(row), start, end)).length;
}

export function calculatePercentTrend(
  current: number,
  previous: number,
  comparisonLabel: string
): InsightsTrend {
  if (previous === 0 && current === 0) {
    return {
      display: "—",
      tone: "neutral",
      hasPreviousData: false
    };
  }

  if (previous === 0) {
    return {
      display: `100 % de plus que ${comparisonLabel}`,
      tone: "positive",
      hasPreviousData: false
    };
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;
  const absolute = Math.abs(rounded).toLocaleString("fr-CA", {
    maximumFractionDigits: 1
  });

  if (rounded === 0) {
    return {
      display: `Stable par rapport à ${comparisonLabel}`,
      tone: "neutral",
      hasPreviousData: true
    };
  }

  if (rounded > 0) {
    return {
      display: `${absolute} % de plus que ${comparisonLabel}`,
      tone: "positive",
      hasPreviousData: true
    };
  }

  return {
    display: `${absolute} % de moins que ${comparisonLabel}`,
    tone: "negative",
    hasPreviousData: true
  };
}

export function calculatePointsTrend(
  currentRate: number,
  previousRate: number,
  comparisonLabel: string
): InsightsTrend {
  const delta = Math.round((currentRate - previousRate) * 10) / 10;

  if (delta === 0) {
    return {
      display: `Stable par rapport à ${comparisonLabel}`,
      tone: "neutral",
      hasPreviousData: true
    };
  }

  const absolute = Math.abs(delta).toLocaleString("fr-CA", {
    maximumFractionDigits: 1
  });

  if (delta > 0) {
    return {
      display: `${absolute} pt de plus que ${comparisonLabel}`,
      tone: "positive",
      hasPreviousData: true
    };
  }

  return {
    display: `${absolute} pt de moins que ${comparisonLabel}`,
    tone: "negative",
    hasPreviousData: true
  };
}

export function calculateResponseRate(responses: number, smsSent: number) {
  if (smsSent <= 0) {
    return 0;
  }

  return Math.round((responses / smsSent) * 1000) / 10;
}

export function buildBucketKeys({
  start,
  end,
  granularity,
  timezone
}: {
  start: string;
  end: string;
  granularity: InsightsGranularity;
  timezone: string;
}) {
  const keys: Date[] = [];
  let cursor = startOfDay(new Date(start));
  const endDate = new Date(end);

  while (cursor < endDate) {
    keys.push(new Date(cursor));

    if (granularity === "monthly") {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    } else if (granularity === "weekly") {
      cursor = addDays(cursor, 7);
    } else {
      cursor = addDays(cursor, 1);
    }
  }

  return keys.map((date) => ({
    date,
    dateKey: getDateKey(date, timezone),
    label: formatShortLabel(date, timezone),
    fullLabel: formatFullLabel(date, timezone)
  }));
}

function bucketTimestamp(
  value: string,
  granularity: InsightsGranularity,
  timezone: string
) {
  const date = new Date(value);

  if (granularity === "monthly") {
    return getDateKey(
      new Date(date.getFullYear(), date.getMonth(), 1),
      timezone
    );
  }

  if (granularity === "weekly") {
    const day = startOfDay(date);
    const dayIndex = day.getDay();
    const weekStart = addDays(day, -((dayIndex + 6) % 7));
    return getDateKey(weekStart, timezone);
  }

  return getDateKey(startOfDay(date), timezone);
}

export function buildRecoveredRevenueSeries({
  bookings,
  openings,
  serviceId,
  start,
  end,
  granularity,
  timezone
}: {
  bookings: BookingRow[];
  openings: OpeningRow[];
  serviceId: string | null;
  start: string;
  end: string;
  granularity: InsightsGranularity;
  timezone: string;
}): InsightsSeriesPoint[] {
  const openingById = new Map(openings.map((opening) => [opening.id, opening]));
  const scopedBookings = filterByService(bookings, openingById, serviceId).filter(
    (booking) =>
      (booking.status === "confirmed" || booking.status === "completed") &&
      isWithinRange(booking.confirmed_at ?? booking.created_at, start, end)
  );
  const buckets = buildBucketKeys({ start, end, granularity, timezone });
  const totals = new Map<string, number>();

  for (const booking of scopedBookings) {
    const timestamp = booking.confirmed_at ?? booking.created_at;
    const key = bucketTimestamp(timestamp, granularity, timezone);
    totals.set(key, (totals.get(key) ?? 0) + (booking.recovered_value_cents ?? 0));
  }

  return buckets.map((bucket) => ({
    dateKey: bucket.dateKey,
    label: bucket.label,
    fullLabel: bucket.fullLabel,
    value: totals.get(bucket.dateKey) ?? 0
  }));
}

export function buildSmsVsResponsesSeries({
  smsMessages,
  offers,
  openings,
  serviceId,
  start,
  end,
  granularity,
  timezone
}: {
  smsMessages: SmsRow[];
  offers: OfferRow[];
  openings: OpeningRow[];
  serviceId: string | null;
  start: string;
  end: string;
  granularity: InsightsGranularity;
  timezone: string;
}): InsightsDualSeriesPoint[] {
  const openingById = new Map(openings.map((opening) => [opening.id, opening]));
  const scopedSms = filterByService(
    smsMessages.filter(
      (message) =>
        message.direction === "outbound" &&
        message.message_type === "opening_alert" &&
        isWithinRange(message.created_at, start, end)
    ),
    openingById,
    serviceId
  );
  const scopedOffers = filterByService(offers, openingById, serviceId).filter(
    (offer) =>
      ["responded", "selected", "rejected"].includes(offer.status) &&
      isWithinRange(offer.responded_at ?? offer.created_at, start, end)
  );
  const buckets = buildBucketKeys({ start, end, granularity, timezone });
  const smsTotals = new Map<string, number>();
  const responseTotals = new Map<string, number>();

  for (const message of scopedSms) {
    const key = bucketTimestamp(message.created_at, granularity, timezone);
    smsTotals.set(key, (smsTotals.get(key) ?? 0) + 1);
  }

  for (const offer of scopedOffers) {
    const timestamp = offer.responded_at ?? offer.created_at;
    const key = bucketTimestamp(timestamp, granularity, timezone);
    responseTotals.set(key, (responseTotals.get(key) ?? 0) + 1);
  }

  return buckets.map((bucket) => ({
    dateKey: bucket.dateKey,
    label: bucket.label,
    fullLabel: bucket.fullLabel,
    smsSent: smsTotals.get(bucket.dateKey) ?? 0,
    responses: responseTotals.get(bucket.dateKey) ?? 0
  }));
}

export function buildWaitlistGrowthSeries({
  customers,
  waitlistEntries,
  start,
  end,
  timezone
}: {
  customers: CustomerRow[];
  waitlistEntries: WaitlistRow[];
  start: string;
  end: string;
  timezone: string;
}): InsightsSeriesPoint[] {
  const enrollmentByCustomer = new Map<string, string>();

  for (const entry of waitlistEntries) {
    const existing = enrollmentByCustomer.get(entry.customer_id);
    if (!existing || new Date(entry.created_at) < new Date(existing)) {
      enrollmentByCustomer.set(entry.customer_id, entry.created_at);
    }
  }

  for (const customer of customers) {
    const existing = enrollmentByCustomer.get(customer.id);
    if (existing && new Date(customer.created_at) < new Date(existing)) {
      enrollmentByCustomer.set(customer.id, customer.created_at);
    }
  }

  const enrollments = Array.from(enrollmentByCustomer.values());
  const startDate = startOfDay(new Date(start));
  const endDate = new Date(end);
  const series: InsightsSeriesPoint[] = [];

  for (
    let cursor = new Date(startDate);
    cursor < endDate;
    cursor = addDays(cursor, 1)
  ) {
    const endOfDay = new Date(cursor);
    endOfDay.setHours(23, 59, 59, 999);
    const count = enrollments.filter(
      (enrolledAt) => new Date(enrolledAt) <= endOfDay
    ).length;

    series.push({
      dateKey: getDateKey(cursor, timezone),
      label: formatShortLabel(cursor, timezone),
      fullLabel: formatFullLabel(cursor, timezone),
      value: count
    });
  }

  return series;
}

export function buildFunnel({
  openings,
  offers,
  bookings,
  serviceId,
  start,
  end
}: {
  openings: OpeningRow[];
  offers: OfferRow[];
  bookings: BookingRow[];
  serviceId: string | null;
  start: string;
  end: string;
}): { steps: InsightsFunnelStep[]; globalConversionRate: number } {
  const scopedOpenings = filterOpenings(openings, serviceId).filter((opening) =>
    isWithinRange(opening.created_at, start, end)
  );
  const openingIds = new Set(scopedOpenings.map((opening) => opening.id));
  const scopedOffers = offers.filter(
    (offer) =>
      openingIds.has(offer.opening_id) &&
      ["responded", "selected", "rejected"].includes(offer.status) &&
      isWithinRange(offer.responded_at ?? offer.created_at, start, end)
  );
  const scopedConfirmations = bookings.filter(
    (booking) =>
      openingIds.has(booking.opening_id) &&
      (booking.status === "confirmed" || booking.status === "completed") &&
      isWithinRange(booking.confirmed_at ?? booking.created_at, start, end)
  );
  const cancellations = scopedOpenings.length;
  const responses = scopedOffers.length;
  const confirmations = scopedConfirmations.length;
  const recoveredAppointments = confirmations;

  const responseRate =
    cancellations > 0 ? Math.round((responses / cancellations) * 1000) / 10 : 0;
  const confirmationRate =
    responses > 0 ? Math.round((confirmations / responses) * 1000) / 10 : 0;
  const recoveredRate =
    cancellations > 0
      ? Math.round((recoveredAppointments / cancellations) * 1000) / 10
      : 0;
  const globalConversionRate =
    cancellations > 0
      ? Math.round((recoveredAppointments / cancellations) * 1000) / 10
      : 0;

  return {
    steps: [
      { label: "Annulations", count: cancellations, rateLabel: null },
      {
        label: "Réponses",
        count: responses,
        rateLabel: `${responseRate.toLocaleString("fr-CA", {
          maximumFractionDigits: 1
        })} %`
      },
      {
        label: "Confirmations",
        count: confirmations,
        rateLabel: `${confirmationRate.toLocaleString("fr-CA", {
          maximumFractionDigits: 1
        })} %`
      },
      {
        label: "rdv récupéré",
        count: recoveredAppointments,
        rateLabel: `${recoveredRate.toLocaleString("fr-CA", {
          maximumFractionDigits: 1
        })} %`
      }
    ],
    globalConversionRate
  };
}

export function buildTopServices({
  openings,
  offers,
  bookings,
  smsMessages,
  services,
  start,
  end
}: {
  openings: OpeningRow[];
  offers: OfferRow[];
  bookings: BookingRow[];
  smsMessages: SmsRow[];
  services: ServiceRow[];
  start: string;
  end: string;
}): InsightsServiceRow[] {
  const serviceNameById = new Map(services.map((service) => [service.id, service.name]));
  const scopedOpenings = openings.filter((opening) =>
    isWithinRange(opening.created_at, start, end)
  );
  const openingIdsByService = new Map<string, Set<string>>();

  for (const opening of scopedOpenings) {
    if (!opening.service_id) {
      continue;
    }

    const ids = openingIdsByService.get(opening.service_id) ?? new Set<string>();
    ids.add(opening.id);
    openingIdsByService.set(opening.service_id, ids);
  }

  const rows: InsightsServiceRow[] = [];

  for (const [serviceId, openingIds] of openingIdsByService.entries()) {
    const cancellations = openingIds.size;
    const alertsSent = smsMessages.filter(
      (message) =>
        message.direction === "outbound" &&
        message.message_type === "opening_alert" &&
        message.opening_id &&
        openingIds.has(message.opening_id) &&
        isWithinRange(message.created_at, start, end)
    ).length;
    const responses = offers.filter(
      (offer) =>
        openingIds.has(offer.opening_id) &&
        ["responded", "selected", "rejected"].includes(offer.status) &&
        isWithinRange(offer.responded_at ?? offer.created_at, start, end)
    ).length;
    const recoveredAppointments = bookings.filter(
      (booking) =>
        openingIds.has(booking.opening_id) &&
        (booking.status === "confirmed" || booking.status === "completed") &&
        isWithinRange(booking.confirmed_at ?? booking.created_at, start, end)
    ).length;
    const recoveredRevenueCents = bookings
      .filter(
        (booking) =>
          openingIds.has(booking.opening_id) &&
          (booking.status === "confirmed" || booking.status === "completed") &&
          isWithinRange(booking.confirmed_at ?? booking.created_at, start, end)
      )
      .reduce((total, booking) => total + (booking.recovered_value_cents ?? 0), 0);

    rows.push({
      serviceId,
      serviceName: serviceNameById.get(serviceId) ?? "Service inconnu",
      cancellations,
      responseRate: calculateResponseRate(responses, alertsSent),
      recoveredAppointments,
      recoveredRevenueCents
    });
  }

  return rows
    .sort(
      (left, right) =>
        right.recoveredRevenueCents - left.recoveredRevenueCents ||
        right.recoveredAppointments - left.recoveredAppointments
    )
    .slice(0, 5);
}

export function summarizePeriodMetrics({
  openings,
  bookings,
  smsMessages,
  offers,
  customers,
  serviceId,
  start,
  end
}: {
  openings: OpeningRow[];
  bookings: BookingRow[];
  smsMessages: SmsRow[];
  offers: OfferRow[];
  customers: CustomerRow[];
  serviceId: string | null;
  start: string;
  end: string;
}) {
  const openingById = new Map(openings.map((opening) => [opening.id, opening]));
  const scopedOpenings = filterOpenings(openings, serviceId).filter((opening) =>
    isWithinRange(opening.created_at, start, end)
  );
  const openingIds = new Set(scopedOpenings.map((opening) => opening.id));
  const scopedBookings = filterByService(bookings, openingById, serviceId).filter(
    (booking) =>
      openingIds.has(booking.opening_id) &&
      (booking.status === "confirmed" || booking.status === "completed") &&
      isWithinRange(booking.confirmed_at ?? booking.created_at, start, end)
  );
  const alertsSent = filterByService(
    smsMessages.filter(
      (message) =>
        message.direction === "outbound" &&
        message.message_type === "opening_alert" &&
        isWithinRange(message.created_at, start, end)
    ),
    openingById,
    serviceId
  ).length;
  const responses = filterByService(offers, openingById, serviceId).filter(
    (offer) =>
      openingIds.has(offer.opening_id) &&
      ["responded", "selected", "rejected"].includes(offer.status) &&
      isWithinRange(offer.responded_at ?? offer.created_at, start, end)
  ).length;
  const smsSent = filterByService(
    smsMessages.filter(
      (message) =>
        message.direction === "outbound" &&
        isWithinRange(message.created_at, start, end)
    ),
    openingById,
    serviceId
  ).length;

  return {
    recoveredRevenueCents: scopedBookings.reduce(
      (total, booking) => total + (booking.recovered_value_cents ?? 0),
      0
    ),
    recoveredAppointments: scopedBookings.length,
    responseRate: calculateResponseRate(responses, alertsSent),
    cancellationsReceived: scopedOpenings.length,
    smsSent,
    clientsAdded: countInWindow(customers, (customer) => customer.created_at, start, end),
    responses,
    alertsSent
  };
}
