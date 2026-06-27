import {
  addDaysToZonedParts,
  addMonthsToZonedParts,
  addYearsToZonedParts,
  getNthWeekdayOfMonth,
  getWeekdayIndex,
  getWeekdayOccurrenceInMonth,
  utcToZonedParts,
  zonedDateTimeToUtc,
  zonedPartsToLocalString,
  type ZonedDateTimeParts
} from "@/lib/appointments/timezone";

export const MAX_RECURRENCE_OCCURRENCES = 100;
export const NEVER_RECURRENCE_HORIZON_MONTHS = 12;

export type RecurrenceFrequency =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type RecurrenceEndType = "never" | "after" | "until";

export type MonthlyPatternType = "day_of_month" | "nth_weekday";

export type RecurrenceInput = {
  frequency: RecurrenceFrequency;
  intervalCount: number;
  weekdays: number[];
  monthlyPattern: MonthlyPatternType;
  endType: RecurrenceEndType;
  endAfterCount: number | null;
  endDate: string | null;
};

export type RecurrenceOccurrence = {
  startsAt: string;
  endsAt: string | null;
  instanceIndex: number;
};

export type RecurrenceValidationResult =
  | { ok: true; input: RecurrenceInput }
  | { ok: false; errors: string[] };

const WEEKDAY_VALUES = new Set([0, 1, 2, 3, 4, 5, 6]);

export function parseRecurrenceWeekdays(value: unknown): number[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => WEEKDAY_VALUES.has(item));
}

export function validateRecurrenceInput(input: {
  frequency?: unknown;
  intervalCount?: unknown;
  weekdays?: unknown;
  monthlyPattern?: unknown;
  endType?: unknown;
  endAfterCount?: unknown;
  endDate?: unknown;
}): RecurrenceValidationResult {
  const errors: string[] = [];
  const frequency = String(input.frequency ?? "none") as RecurrenceFrequency;
  const allowedFrequencies: RecurrenceFrequency[] = [
    "none",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "custom"
  ];

  if (!allowedFrequencies.includes(frequency)) {
    errors.push("La fréquence de récurrence est invalide.");
  }

  const intervalCount = Number(input.intervalCount ?? 1);

  if (!Number.isInteger(intervalCount) || intervalCount < 1 || intervalCount > 99) {
    errors.push("L'intervalle de récurrence doit être entre 1 et 99.");
  }

  const weekdays = parseRecurrenceWeekdays(input.weekdays);
  const monthlyPattern =
    input.monthlyPattern === "nth_weekday" ? "nth_weekday" : "day_of_month";
  const endType = String(input.endType ?? "never") as RecurrenceEndType;
  const endAfterCountRaw = String(input.endAfterCount ?? "").trim();
  const endAfterCount = endAfterCountRaw ? Number(endAfterCountRaw) : null;
  const endDate = String(input.endDate ?? "").trim() || null;

  if (endType !== "never" && endType !== "after" && endType !== "until") {
    errors.push("La fin de récurrence est invalide.");
  }

  if (endType === "after") {
    if (
      !endAfterCount ||
      !Number.isInteger(endAfterCount) ||
      endAfterCount < 1 ||
      endAfterCount > MAX_RECURRENCE_OCCURRENCES
    ) {
      errors.push(
        `Le nombre d'occurrences doit être entre 1 et ${MAX_RECURRENCE_OCCURRENCES}.`
      );
    }
  }

  if (endType === "until" && !endDate) {
    errors.push("La date de fin de récurrence est requise.");
  }

  if (
    (frequency === "weekly" || frequency === "custom") &&
    weekdays.length === 0
  ) {
    errors.push("Sélectionnez au moins un jour de la semaine.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      frequency,
      intervalCount,
      weekdays,
      monthlyPattern,
      endType,
      endAfterCount,
      endDate
    }
  };
}

function withSeedTime(parts: ZonedDateTimeParts, seed: ZonedDateTimeParts) {
  return {
    ...parts,
    hour: seed.hour,
    minute: seed.minute,
    second: seed.second
  };
}

function estimateOccurrenceCount(
  recurrence: RecurrenceInput,
  seed: ZonedDateTimeParts,
  timezone: string
) {
  if (recurrence.frequency === "daily") {
    const horizon = addMonthsToZonedParts(
      seed,
      NEVER_RECURRENCE_HORIZON_MONTHS,
      timezone
    );
    const startUtc = zonedDateTimeToUtc(zonedPartsToLocalString(seed), timezone);
    const endUtc = zonedDateTimeToUtc(zonedPartsToLocalString(horizon), timezone);
    const days = Math.ceil((endUtc.getTime() - startUtc.getTime()) / 86_400_000);
    return Math.ceil(Math.max(days, 0) / recurrence.intervalCount);
  }

  if (recurrence.frequency === "weekly" || recurrence.frequency === "custom") {
    const weekdayCount = Math.max(recurrence.weekdays.length, 1);
    return Math.ceil((52 / recurrence.intervalCount) * weekdayCount);
  }

  if (recurrence.frequency === "monthly") {
    return Math.ceil(NEVER_RECURRENCE_HORIZON_MONTHS / recurrence.intervalCount);
  }

  if (recurrence.frequency === "yearly") {
    return Math.ceil(NEVER_RECURRENCE_HORIZON_MONTHS / (12 * recurrence.intervalCount));
  }

  return 1;
}

function isWithinRecurrenceBounds(
  occurrenceStart: Date,
  recurrence: RecurrenceInput,
  timezone: string,
  now: Date
) {
  if (occurrenceStart < now) {
    return false;
  }

  if (recurrence.endType === "until" && recurrence.endDate) {
    const untilUtc = zonedDateTimeToUtc(`${recurrence.endDate}T23:59:59`, timezone);
    if (occurrenceStart > untilUtc) {
      return false;
    }
  }

  return true;
}

export function generateRecurrenceOccurrences({
  startsAt,
  endsAt,
  timezone,
  recurrence,
  now = new Date(),
  skipNeverOverflowCheck = false
}: {
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  recurrence: RecurrenceInput;
  now?: Date;
  skipNeverOverflowCheck?: boolean;
}): { ok: true; occurrences: RecurrenceOccurrence[] } | { ok: false; error: string } {
  if (recurrence.frequency === "none") {
    const startUtc = new Date(startsAt);
    const endUtc = endsAt ? new Date(endsAt) : null;
    const durationMs =
      endUtc && !Number.isNaN(endUtc.getTime())
        ? endUtc.getTime() - startUtc.getTime()
        : 60 * 60_000;

    if (Number.isNaN(startUtc.getTime()) || durationMs <= 0) {
      return { ok: false, error: "Les dates de début et de fin sont invalides." };
    }

    return {
      ok: true,
      occurrences: [
        {
          startsAt: new Date(startsAt).toISOString(),
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          instanceIndex: 0
        }
      ]
    };
  }

  const startUtc = new Date(startsAt);
  const endUtc = endsAt ? new Date(endsAt) : null;
  const durationMs =
    endUtc && !Number.isNaN(endUtc.getTime())
      ? endUtc.getTime() - startUtc.getTime()
      : 60 * 60_000;

  if (Number.isNaN(startUtc.getTime()) || durationMs <= 0) {
    return { ok: false, error: "Les dates de début et de fin sont invalides." };
  }

  const seed = utcToZonedParts(startUtc, timezone);

  const targetCount =
    recurrence.endType === "after" && recurrence.endAfterCount
      ? recurrence.endAfterCount
      : MAX_RECURRENCE_OCCURRENCES;

  if (recurrence.endType === "never" && !skipNeverOverflowCheck) {
    const estimatedCount = estimateOccurrenceCount(recurrence, seed, timezone);

    if (estimatedCount > MAX_RECURRENCE_OCCURRENCES) {
      return {
        ok: false,
        error: `La récurrence ne peut pas créer plus de ${MAX_RECURRENCE_OCCURRENCES} rendez-vous à la fois.`
      };
    }
  }

  const occurrences: RecurrenceOccurrence[] = [];
  const seen = new Set<string>();

  const horizonUtc =
    recurrence.endType === "never"
      ? zonedDateTimeToUtc(
          zonedPartsToLocalString(
            addMonthsToZonedParts(seed, NEVER_RECURRENCE_HORIZON_MONTHS, timezone)
          ),
          timezone
        )
      : null;

  function pushOccurrence(parts: ZonedDateTimeParts, instanceIndex: number) {
    const localStart = withSeedTime(parts, seed);
    const key = zonedPartsToLocalString(localStart);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    const occurrenceStart = zonedDateTimeToUtc(key, timezone);

    if (!isWithinRecurrenceBounds(occurrenceStart, recurrence, timezone, now)) {
      return false;
    }

    if (horizonUtc && occurrenceStart > horizonUtc) {
      return false;
    }

    occurrences.push({
      startsAt: occurrenceStart.toISOString(),
      endsAt: new Date(occurrenceStart.getTime() + durationMs).toISOString(),
      instanceIndex
    });
    return true;
  }

  if (recurrence.frequency === "daily") {
    let cursor = seed;
    let guard = 0;

    while (occurrences.length < targetCount && guard < 400) {
      pushOccurrence(cursor, occurrences.length);
      cursor = addDaysToZonedParts(cursor, recurrence.intervalCount, timezone);
      guard += 1;
    }
  } else if (
    recurrence.frequency === "weekly" ||
    recurrence.frequency === "custom"
  ) {
    const weekdays =
      recurrence.weekdays.length > 0
        ? [...recurrence.weekdays].sort((left, right) => left - right)
        : [getWeekdayIndex(seed, timezone)];
    let weekOffset = 0;
    let guard = 0;

    while (occurrences.length < targetCount && guard < 400) {
      const weekStart = addDaysToZonedParts(
        seed,
        weekOffset * 7 * recurrence.intervalCount - getWeekdayIndex(seed, timezone),
        timezone
      );

      for (const weekday of weekdays) {
        const candidate = addDaysToZonedParts(weekStart, weekday, timezone);
        const candidateStart = zonedDateTimeToUtc(
          zonedPartsToLocalString(withSeedTime(candidate, seed)),
          timezone
        );

        if (candidateStart < startUtc) {
          continue;
        }

        pushOccurrence(candidate, occurrences.length);

        if (occurrences.length >= targetCount) {
          break;
        }
      }

      weekOffset += 1;
      guard += 1;
    }
  } else if (recurrence.frequency === "monthly") {
    let index = 0;

    while (occurrences.length < targetCount && index < 200) {
      let candidate = seed;

      if (recurrence.monthlyPattern === "nth_weekday") {
        const { weekday, nth } = getWeekdayOccurrenceInMonth(seed, timezone);
        let month = seed.month + index * recurrence.intervalCount;
        let year = seed.year;

        while (month > 12) {
          month -= 12;
          year += 1;
        }

        const resolved = getNthWeekdayOfMonth(year, month, weekday, nth, timezone);

        if (!resolved) {
          index += 1;
          continue;
        }

        candidate = resolved;
      } else {
        candidate = addMonthsToZonedParts(
          seed,
          index * recurrence.intervalCount,
          timezone
        );
      }

      const pushed = pushOccurrence(candidate, index);

      if (!pushed && recurrence.endType === "until") {
        break;
      }

      index += 1;
    }
  } else if (recurrence.frequency === "yearly") {
    let index = 0;

    while (occurrences.length < targetCount && index < 100) {
      const candidate = addYearsToZonedParts(
        seed,
        index * recurrence.intervalCount,
        timezone
      );
      pushOccurrence(candidate, index);
      index += 1;
    }
  }

  if (occurrences.length === 0) {
    return {
      ok: false,
      error: "Aucune occurrence future n'a pu être générée pour cette récurrence."
    };
  }

  if (occurrences.length > MAX_RECURRENCE_OCCURRENCES) {
    return {
      ok: false,
      error: `La récurrence ne peut pas créer plus de ${MAX_RECURRENCE_OCCURRENCES} rendez-vous à la fois.`
    };
  }

  return { ok: true, occurrences };
}

export function previewRecurrenceOccurrences(
  args: Parameters<typeof generateRecurrenceOccurrences>[0]
) {
  const result = generateRecurrenceOccurrences(args);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true as const,
    count: result.occurrences.length,
    preview: result.occurrences.slice(0, 5)
  };
}
