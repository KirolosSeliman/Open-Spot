import { describe, expect, it } from "vitest";

import { calculateCommissionEstimate } from "@/lib/openings/commission";

describe("calculateCommissionEstimate", () => {
  it("calculates configurable commission and respects caps", () => {
    expect(
      calculateCommissionEstimate({
        recoveredValueCents: 10000,
        commissionPercent: 10,
        capCents: 750
      })
    ).toBe(750);
  });
});
