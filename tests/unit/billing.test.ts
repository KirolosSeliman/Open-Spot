import { describe, expect, it } from "vitest";

import { createCommissionRecord } from "@/lib/billing/commission";
import { canSendSmsWithinLimits } from "@/lib/billing/sms-cost-controls";

describe("billing and cost controls", () => {
  it("stores commission inputs so the amount is traceable later", () => {
    expect(
      createCommissionRecord({
        recoveredValueCents: 10000,
        discountAmountCents: 1000,
        commissionPercent: 10,
        commissionCapCents: 700,
        currency: "CAD"
      })
    ).toMatchObject({
      recoveredValueCents: 10000,
      discountAmountCents: 1000,
      commissionPercent: 10,
      commissionCapCents: 700,
      commissionAmountCents: 700,
      currency: "CAD"
    });
  });

  it("blocks SMS sends when daily or monthly limits are exhausted", () => {
    expect(
      canSendSmsWithinLimits({
        dailySent: 50,
        dailyLimit: 50,
        monthlySent: 100,
        monthlyLimit: 1000
      })
    ).toEqual({ ok: false, reason: "Daily SMS limit reached." });

    expect(
      canSendSmsWithinLimits({
        dailySent: 5,
        dailyLimit: 50,
        monthlySent: 1000,
        monthlyLimit: 1000
      })
    ).toEqual({ ok: false, reason: "Monthly SMS limit reached." });
  });
});
