import { describe, expect, it } from "vitest";

import { generateRecurrenceOccurrences } from "@/lib/appointments/recurrence";

const timezone = "America/Toronto";

describe("generateRecurrenceOccurrences", () => {
  it("creates a single occurrence when recurrence is none", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-05T13:00:00.000Z",
      endsAt: "2026-06-05T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "none",
        intervalCount: 1,
        weekdays: [],
        monthlyPattern: "day_of_month",
        endType: "never",
        endAfterCount: null,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.occurrences).toHaveLength(1);
    }
  });

  it("creates 5 daily occurrences with end after 5", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-05T13:00:00.000Z",
      endsAt: "2026-06-05T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "daily",
        intervalCount: 1,
        weekdays: [],
        monthlyPattern: "day_of_month",
        endType: "after",
        endAfterCount: 5,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.occurrences).toHaveLength(5);
    }
  });

  it("creates weekly tuesday/thursday occurrences", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-03T13:00:00.000Z",
      endsAt: "2026-06-03T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "weekly",
        intervalCount: 1,
        weekdays: [1, 3],
        monthlyPattern: "day_of_month",
        endType: "after",
        endAfterCount: 4,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.occurrences).toHaveLength(4);
    }
  });

  it("skips a week when interval is 2", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-02T13:00:00.000Z",
      endsAt: "2026-06-02T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "weekly",
        intervalCount: 2,
        weekdays: [0],
        monthlyPattern: "day_of_month",
        endType: "after",
        endAfterCount: 2,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.occurrences).toHaveLength(2);
      const first = new Date(result.occurrences[0].startsAt);
      const second = new Date(result.occurrences[1].startsAt);
      const diffDays = (second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(14);
    }
  });

  it("keeps day of month for monthly recurrence", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-15T13:00:00.000Z",
      endsAt: "2026-06-15T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "monthly",
        intervalCount: 1,
        weekdays: [],
        monthlyPattern: "day_of_month",
        endType: "after",
        endAfterCount: 3,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const occurrence of result.occurrences) {
        const day = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          day: "2-digit"
        }).format(new Date(occurrence.startsAt));
        expect(day).toBe("15");
      }
    }
  });

  it("does not exceed until date", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-05T13:00:00.000Z",
      endsAt: "2026-06-05T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "daily",
        intervalCount: 1,
        weekdays: [],
        monthlyPattern: "day_of_month",
        endType: "until",
        endAfterCount: null,
        endDate: "2026-06-07"
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.occurrences.length).toBeLessThanOrEqual(3);
    }
  });

  it("rejects more than 100 occurrences", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-05T13:00:00.000Z",
      endsAt: "2026-06-05T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "daily",
        intervalCount: 1,
        weekdays: [],
        monthlyPattern: "day_of_month",
        endType: "never",
        endAfterCount: null,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("100");
    }
  });

  it("returns an error when end is before start", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-05T14:00:00.000Z",
      endsAt: "2026-06-05T13:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "none",
        intervalCount: 1,
        weekdays: [],
        monthlyPattern: "day_of_month",
        endType: "never",
        endAfterCount: null,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(false);
  });

  it("preserves local hour across generated daily occurrences", () => {
    const result = generateRecurrenceOccurrences({
      startsAt: "2026-06-05T13:00:00.000Z",
      endsAt: "2026-06-05T14:00:00.000Z",
      timezone,
      recurrence: {
        frequency: "daily",
        intervalCount: 1,
        weekdays: [],
        monthlyPattern: "day_of_month",
        endType: "after",
        endAfterCount: 3,
        endDate: null
      },
      now: new Date("2026-01-01T00:00:00.000Z")
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const hours = result.occurrences.map((occurrence) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          hour: "2-digit",
          hour12: false
        }).format(new Date(occurrence.startsAt))
      );
      expect(new Set(hours).size).toBe(1);
    }
  });
});
