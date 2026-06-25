import { describe, expect, it } from "vitest";

import {
  calculateRevenueEstimate,
  formatRevenueAmount,
  sliderPercent,
  sliderValueFromClientX
} from "@/lib/marketing/revenue-calculator";

describe("revenue calculator", () => {
  it("calculates monthly risk and recovered revenue from the default inputs", () => {
    expect(
      calculateRevenueEstimate({
        averageServicePrice: 110,
        lostSpotsPerWeek: 4,
        recoveryRate: 30
      })
    ).toEqual({
      monthlyRevenueAtRisk: 1760,
      recoveredRevenue: 528
    });
  });

  it("recovers the full monthly revenue at risk when recovery is 100 percent", () => {
    expect(
      calculateRevenueEstimate({
        averageServicePrice: 110,
        lostSpotsPerWeek: 4,
        recoveryRate: 100
      })
    ).toEqual({
      monthlyRevenueAtRisk: 1760,
      recoveredRevenue: 1760
    });
  });

  it("formats CAD revenue without decimals in French and English", () => {
    expect(formatRevenueAmount(2420, "fr")).toBe("2 420 $");
    expect(formatRevenueAmount(2420, "en")).toBe("$2,420");
  });

  it("keeps visual slider progress within bounds", () => {
    expect(sliderPercent({ value: 10, min: 10, max: 100 })).toBe(0);
    expect(sliderPercent({ value: 55, min: 10, max: 100 })).toBe(50);
    expect(sliderPercent({ value: 120, min: 10, max: 100 })).toBe(100);
  });

  it("maps pointer and touch coordinates to stepped slider values", () => {
    const sliderBounds = {
      fallbackValue: 30,
      max: 100,
      min: 10,
      step: 1,
      trackLeft: 150,
      trackWidth: 600
    };

    expect(sliderValueFromClientX({ ...sliderBounds, clientX: 150 })).toBe(10);
    expect(sliderValueFromClientX({ ...sliderBounds, clientX: 450 })).toBe(55);
    expect(sliderValueFromClientX({ ...sliderBounds, clientX: 750 })).toBe(100);
    expect(sliderValueFromClientX({ ...sliderBounds, clientX: 900 })).toBe(100);
    expect(sliderValueFromClientX({ ...sliderBounds, clientX: 450, trackWidth: 0 })).toBe(30);
  });
});
