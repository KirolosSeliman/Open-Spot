import { describe, expect, it } from "vitest";

import {
  buildGrowthSeries,
  buildUniqueWaitlistEnrollments
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
