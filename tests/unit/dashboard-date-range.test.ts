import { describe, expect, it } from "vitest";

import {
  buildDailyCounts,
  calculatePeriodChange,
  formatDashboardRangeLabel,
  getDashboardDateRange,
  normalizeDashboardRange
} from "@/lib/dashboard/date-range";

describe("dashboard date range", () => {
  it("normalizes dashboard range query params", () => {
    expect(normalizeDashboardRange("7d")).toBe("7d");
    expect(normalizeDashboardRange("30d")).toBe("30d");
    expect(normalizeDashboardRange("90d")).toBe("90d");
    expect(normalizeDashboardRange(undefined)).toBe("7d");
  });

  it("builds current and previous windows", () => {
    const window = getDashboardDateRange(
      "7d",
      new Date("2026-05-19T12:00:00.000Z")
    );

    expect(window.days).toBe(7);
    expect(window.start.toISOString()).toBe("2026-05-13T04:00:00.000Z");
    expect(window.previousStart.toISOString()).toBe("2026-05-06T04:00:00.000Z");
  });

  it("calculates daily counts and period change", () => {
    const window = getDashboardDateRange(
      "7d",
      new Date("2026-05-19T12:00:00.000Z")
    );
    const series = buildDailyCounts(
      ["2026-05-14T10:00:00.000Z", "2026-05-14T12:00:00.000Z"],
      window.start,
      window.days
    );

    expect(series[1]).toBe(2);
    expect(calculatePeriodChange(3, 0, "fr").display).toBe("Nouveau");
    expect(calculatePeriodChange(11, 10, "fr").display).toContain("10");
  });

  it("formats readable range labels", () => {
    const window = getDashboardDateRange(
      "7d",
      new Date("2026-05-19T12:00:00.000Z")
    );

    expect(formatDashboardRangeLabel(window, "fr")).toContain("2026");
  });
});
