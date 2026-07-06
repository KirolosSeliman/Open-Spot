import { describe, expect, it } from "vitest";

import {
  applyManualRecipientOverride,
  evaluateSmsRecipientEligibility
} from "@/lib/sms/smart-recipient-engine";

const now = new Date("2026-07-06T14:00:00.000Z");

const baseCustomer = {
  customerId: "customer-1",
  smsConsentStatus: "opted_in" as const,
  phoneE164: "+15145550199",
  phoneIsValid: true,
  isArchived: false,
  alreadyReceivedAlert: false,
  deliveryQuarantined: false,
  manualSendMode: "auto" as const,
  manualSnoozeUntil: null,
  lastCompletedAppointmentAt: null,
  lastFilledSpotAt: null,
  nextAppointmentAt: null,
  smsSentLast24h: 0,
  smsSentLast7d: 0,
  smsSentLast30d: 0
};

function evaluate(overrides = {}) {
  return evaluateSmsRecipientEligibility({
    customer: {
      ...baseCustomer,
      ...overrides
    },
    now
  });
}

describe("evaluateSmsRecipientEligibility", () => {
  it("locks hard-blocked recipients before smart sending rules", () => {
    expect(evaluate({ optedOutAt: "2026-07-05T10:00:00.000Z" })).toMatchObject({
      baseDecision: "locked_blocked",
      finalDecision: "locked_blocked",
      reasonCodes: ["blocked_opted_out"],
      canSend: false
    });
    expect(evaluate({ smsConsentStatus: "needs_consent" })).toMatchObject({
      baseDecision: "locked_blocked",
      reasonCodes: ["blocked_no_consent"]
    });
    expect(evaluate({ phoneIsValid: false })).toMatchObject({
      baseDecision: "locked_blocked",
      reasonCodes: ["blocked_invalid_phone"]
    });
    expect(evaluate({ isArchived: true })).toMatchObject({
      baseDecision: "locked_blocked",
      reasonCodes: ["blocked_archived_customer"]
    });
    expect(evaluate({ alreadyReceivedAlert: true })).toMatchObject({
      baseDecision: "locked_blocked",
      reasonCodes: ["blocked_duplicate_alert"]
    });
  });

  it("protects recipients who are likely to be over-contacted", () => {
    const protectedCases = [
      {
        overrides: { lastCompletedAppointmentAt: "2026-07-05T14:00:00.000Z" },
        reason: "protected_recent_completed_appointment"
      },
      {
        overrides: { lastFilledSpotAt: "2026-07-04T14:00:00.000Z" },
        reason: "protected_recent_filled_spot"
      },
      {
        overrides: { smsSentLast24h: 1 },
        reason: "protected_frequency_cap_24h"
      },
      {
        overrides: { smsSentLast7d: 2 },
        reason: "protected_frequency_cap_7d"
      },
      {
        overrides: { smsSentLast30d: 5 },
        reason: "protected_frequency_cap_30d"
      },
      {
        overrides: { nextAppointmentAt: "2026-07-07T14:00:00.000Z" },
        reason: "protected_future_appointment"
      },
      {
        overrides: { manualSnoozeUntil: "2026-07-08T14:00:00.000Z" },
        reason: "protected_manual_snooze"
      },
      {
        overrides: { manualSendMode: "prefer_exclude" },
        reason: "protected_manual_prefer_exclude"
      },
      {
        overrides: { manualSendMode: "never_send_last_minute" },
        reason: "manual_never_send_last_minute"
      }
    ] as const;

    for (const { overrides, reason } of protectedCases) {
      expect(evaluate(overrides)).toMatchObject({
        baseDecision: "protected",
        finalDecision: "do_not_send",
        decisionType: "auto",
        reasonCodes: [reason],
        canSend: false,
        warningRequired: false
      });
    }
  });

  it("returns eligible/send for a consenting valid recipient with no cooldowns or caps", () => {
    expect(evaluate()).toMatchObject({
      baseDecision: "eligible",
      finalDecision: "send",
      decisionType: "auto",
      reasonCodes: ["eligible"],
      canSend: true,
      manuallyOverridden: false,
      warningRequired: false
    });
  });

  it("does not over-block exact cooldown boundary dates", () => {
    expect(
      evaluate({
        lastCompletedAppointmentAt: "2026-06-29T14:00:00.000Z"
      })
    ).toMatchObject({
      baseDecision: "eligible",
      finalDecision: "send"
    });

    expect(
      evaluate({
        lastCompletedAppointmentAt: "2026-06-29T14:01:00.000Z"
      })
    ).toMatchObject({
      baseDecision: "protected",
      reasonCodes: ["protected_recent_completed_appointment"]
    });
  });

  it("uses safe defaults and ignores soft smart protections when smart mode is disabled", () => {
    expect(
      evaluateSmsRecipientEligibility({
        customer: {
          ...baseCustomer,
          lastCompletedAppointmentAt: "2026-07-05T14:00:00.000Z"
        },
        settings: { smartSendingEnabled: false },
        now
      })
    ).toMatchObject({
      baseDecision: "eligible",
      finalDecision: "send"
    });

    expect(
      evaluateSmsRecipientEligibility({
        customer: {
          ...baseCustomer,
          smsConsentStatus: "opted_out"
        },
        settings: { smartSendingEnabled: false },
        now
      })
    ).toMatchObject({
      baseDecision: "locked_blocked",
      reasonCodes: ["blocked_opted_out"]
    });
  });

  it("protects recipients outside the allowed business sending window", () => {
    expect(
      evaluateSmsRecipientEligibility({
        customer: baseCustomer,
        settings: {
          allowedSendStartTime: "08:00",
          allowedSendEndTime: "20:00"
        },
        now: new Date("2026-07-06T03:30:00.000Z"),
        businessTimezone: "America/Toronto"
      })
    ).toMatchObject({
      baseDecision: "protected",
      reasonCodes: ["outside_allowed_sending_hours"]
    });
  });
});

describe("applyManualRecipientOverride", () => {
  it("applies the manual override truth table without bypassing locked blocks", () => {
    const eligible = evaluate();
    const protectedDecision = evaluate({
      lastFilledSpotAt: "2026-07-04T14:00:00.000Z"
    });
    const locked = evaluate({ smsConsentStatus: "opted_out" });

    expect(applyManualRecipientOverride(eligible, "exclude")).toMatchObject({
      finalDecision: "do_not_send",
      decisionType: "manual_exclude",
      canSend: false,
      manuallyOverridden: true,
      warningRequired: false
    });
    expect(applyManualRecipientOverride(eligible, "include")).toMatchObject({
      finalDecision: "send",
      decisionType: "manual_include",
      canSend: true,
      warningRequired: false
    });
    expect(applyManualRecipientOverride(protectedDecision, "auto")).toMatchObject({
      finalDecision: "do_not_send",
      canSend: false
    });
    expect(applyManualRecipientOverride(protectedDecision, "include")).toMatchObject({
      finalDecision: "send",
      decisionType: "manual_include",
      canSend: true,
      manuallyOverridden: true,
      warningRequired: true
    });
    expect(applyManualRecipientOverride(protectedDecision, "exclude")).toMatchObject({
      finalDecision: "do_not_send",
      decisionType: "manual_exclude",
      canSend: false
    });
    expect(applyManualRecipientOverride(locked, "include")).toMatchObject({
      finalDecision: "locked_blocked",
      decisionType: "manual_locked",
      canSend: false,
      manuallyOverridden: false,
      warningRequired: false
    });
  });
});
