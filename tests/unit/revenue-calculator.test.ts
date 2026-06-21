import { describe, expect, it } from "vitest";

import {
  calculateRevenueEstimate,
  formatRevenueAmount,
  sliderPercent
} from "@/lib/marketing/revenue-calculator";

describe("revenue calculator", () => {
  it("calculates monthly risk and recovered revenue from the default inputs", () => {
    expect(
      calculateRevenueEstimate({
        averageServicePrice: 110,
        lostSpotsPerWeek: 11,
        recoveryRate: 50
      })
    ).toEqual({
      monthlyRevenueAtRisk: 4840,
      recoveredRevenue: 2420
    });
  });

  it("formats CAD revenue without decimals in French and English", () => {
    expect(formatRevenueAmount(2420, "fr")).toBe("2 420 $");
    expect(formatRevenueAmount(2420, "en")).toBe("$2,420");
  });

  it("keeps visual slider progress within bounds", () => {
    expect(sliderPercent({ value: 10, min: 10, max: 60 })).toBe(0);
    expect(sliderPercent({ value: 50, min: 10, max: 60 })).toBe(80);
    expect(sliderPercent({ value: 90, min: 10, max: 60 })).toBe(100);
  });
});
