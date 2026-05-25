import { describe, expect, it } from "vitest";

import { calculateDashboardMetrics } from "@/lib/reports/metrics";

describe("calculateDashboardMetrics", () => {
  it("calculates response rate and recovered totals without counting unvalidated replies", () => {
    expect(
      calculateDashboardMetrics({
        openingsCreated: 4,
        openingsFilled: 2,
        smsSent: 20,
        responsesReceived: 5,
        recoveredBookings: [
          { recoveredValueCents: 10000, commissionCents: 1000 },
          { recoveredValueCents: 5000, commissionCents: 500 }
        ],
        waitlistCustomers: 12,
        optOuts: 1
      })
    ).toEqual({
      recoveredRevenueCents: 15000,
      openingsCreated: 4,
      openingsFilled: 2,
      responseRate: 25,
      waitlistCustomers: 12,
      smsSent: 20,
      optOuts: 1,
      estimatedCommissionCents: 1500
    });
  });
});
