import { describe, expect, it } from "vitest";

import { createCommissionRecord } from "@/lib/billing/commission";
import {
  canBillingStatusSendSms,
  getNextPeriodEnd,
  normalizeManualBillingInput
} from "@/lib/billing/manual-billing";
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

  it("only allows paid manual billing status to unlock SMS billing gate", () => {
    expect(canBillingStatusSendSms("paid")).toBe(true);

    for (const status of [
      "unpaid",
      "payment_link_sent",
      "past_due",
      "cancelled",
      "comped",
      "trial",
      null
    ]) {
      expect(canBillingStatusSendSms(status)).toBe(false);
    }
  });

  it("validates manual billing plan inputs without accepting unsafe payment URLs", () => {
    const formData = new FormData();
    formData.set("planName", "Founder Pilot");
    formData.set("monthlyPrice", "149");
    formData.set("currency", "CAD");
    formData.set("billingInterval", "monthly");
    formData.set("paymentMethod", "stripe_payment_link");
    formData.set("externalPaymentUrl", "http://example.com/pay");

    expect(normalizeManualBillingInput(formData)).toEqual({
      ok: false,
      errors: ["The payment link must be a valid HTTPS URL."]
    });

    formData.set("externalPaymentUrl", "https://example.com/pay");

    expect(normalizeManualBillingInput(formData)).toEqual({
      ok: true,
      value: expect.objectContaining({
        planName: "Founder Pilot",
        monthlyPriceCents: 14900,
        currency: "CAD",
        billingInterval: "monthly",
        paymentMethod: "stripe_payment_link",
        externalPaymentUrl: "https://example.com/pay"
      })
    });
  });

  it("calculates the next manual billing period end for recurring plans", () => {
    const start = new Date("2026-06-24T12:00:00.000Z");

    expect(getNextPeriodEnd({ start, interval: "monthly" })?.toISOString()).toBe(
      "2026-07-24T12:00:00.000Z"
    );
    expect(getNextPeriodEnd({ start, interval: "yearly" })?.toISOString()).toBe(
      "2027-06-24T12:00:00.000Z"
    );
    expect(getNextPeriodEnd({ start, interval: "one_time" })).toBeNull();
  });
});
