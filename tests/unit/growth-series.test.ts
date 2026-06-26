import { describe, expect, it } from "vitest";

import {
  buildGrowthSeries,
  buildUniqueWaitlistEnrollments,
  getGrowthChartXTickIndexes,
  getGrowthChartYScale
} from "@/lib/clients/growth-series";

describe("buildUniqueWaitlistEnrollments", () => {
  it("counts each client once even with customer and waitlist timestamps", () => {
    const enrollments = buildUniqueWaitlistEnrollments(
      [
        { id: "c1", created_at: "2026-06-11T10:00:00.000Z" },
        { id: "c2", created_at: "2026-06-25T10:00:00.000Z" }
      ],
      [
        { customer_id: "c1", created_at: "2026-06-12T10:00:00.000Z" },
        { customer_id: "c2", created_at: "2026-06-26T10:00:00.000Z" }
      ]
    );

    expect(enrollments).toHaveLength(2);
    expect(enrollments).toEqual(
      expect.arrayContaining([
        { customerId: "c1", enrolledAt: "2026-06-11T10:00:00.000Z" },
        { customerId: "c2", enrolledAt: "2026-06-25T10:00:00.000Z" }
      ])
    );
  });

  it("deduplicates multiple waitlist entries for the same client", () => {
    const enrollments = buildUniqueWaitlistEnrollments(
      [{ id: "c1", created_at: "2026-06-20T10:00:00.000Z" }],
      [
        { customer_id: "c1", created_at: "2026-06-18T10:00:00.000Z" },
        { customer_id: "c1", created_at: "2026-06-22T10:00:00.000Z" }
      ]
    );

    expect(enrollments).toEqual([
      { customerId: "c1", enrolledAt: "2026-06-18T10:00:00.000Z" }
    ]);
  });
});

describe("buildGrowthSeries", () => {
  it("builds a cumulative count from unique enrollments", () => {
    const series = buildGrowthSeries(
      [
        { customerId: "c1", enrolledAt: "2026-06-11T10:00:00.000Z" },
        { customerId: "c2", enrolledAt: "2026-06-25T10:00:00.000Z" }
      ],
      30
    );

    expect(series.at(-1)?.count).toBe(2);
  });
});

describe("getGrowthChartYScale", () => {
  it("uses unique integer ticks for small datasets", () => {
    expect(getGrowthChartYScale(2)).toEqual({
      max: 2,
      ticks: [0, 1, 2]
    });
  });

  it("avoids duplicate labels caused by fractional steps", () => {
    const scale = getGrowthChartYScale(2);
    const labels = scale.ticks.map((tick) => Math.round(tick));

    expect(new Set(labels).size).toBe(labels.length);
  });

  it("uses wider steps for larger datasets", () => {
    expect(getGrowthChartYScale(432)).toEqual({
      max: 500,
      ticks: [0, 100, 200, 300, 400, 500]
    });
  });
});

describe("getGrowthChartXTickIndexes", () => {
  it("spaces labels evenly without crowding the last day", () => {
    const indexes = getGrowthChartXTickIndexes(30);

    expect(indexes[0]).toBe(0);
    expect(indexes).not.toEqual([0, 7, 14, 21, 28, 29]);
    expect(indexes.at(-1)).toBe(29);
    expect((indexes.at(-1) ?? 0) - (indexes.at(-2) ?? 0)).toBeGreaterThanOrEqual(3);
  });
});
