import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canBillingStatusSendSms } from "@/lib/billing/manual-billing";
import {
  evaluateOrganizationSmsActivationReadiness,
  evaluateOrganizationSmsReadiness
} from "@/lib/sms/organization-gate";
import { computeSmsSenderReadiness } from "@/lib/sms/sms-setup-readiness";
import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import {
  formatSafeTwilioUiErrorMessage,
  getSafeTwilioUiError,
  isTwilioDuplicateMessagingAttachError
} from "@/lib/sms/twilio-ui-errors";

const fakeAccountSid = `AC${"0".repeat(32)}`;
const fakeMessagingServiceSid = `MG${"0".repeat(32)}`;
const fakePhoneNumberSid = `PN${"0".repeat(32)}`;

const baseSender: OrganizationSmsSenderRow = {
  id: "sender-1",
  organization_id: "org-1",
  provider: "twilio",
  sender_model: "dedicated_subaccount",
  twilio_subaccount_sid: fakeAccountSid,
  twilio_subaccount_friendly_name: "Open Spot - Demo",
  twilio_subaccount_status: "active",
  twilio_messaging_service_sid: fakeMessagingServiceSid,
  twilio_phone_number_sid: fakePhoneNumberSid,
  phone_e164: "+14385551234",
  sender_status: "connected",
  compliance_status: "approved",
  consent_strategy: "explicit_opt_in",
  stop_help_status: "active",
  inbound_webhook_url: "https://app.example.com/api/webhooks/twilio/inbound",
  status_callback_url: "https://app.example.com/api/webhooks/twilio/status",
  last_synced_at: "2026-06-27T10:00:00.000Z",
  last_test_sms_sent_at: "2026-06-27T10:05:00.000Z",
  last_inbound_test_at: null,
  last_status_callback_at: "2026-06-27T10:06:00.000Z",
  activated_at: null,
  paused_at: null,
  blocked_at: null,
  last_error: null,
  provider_payload: {},
  created_by_platform_admin_id: null,
  updated_by_platform_admin_id: null,
  created_at: "2026-06-27T09:00:00.000Z",
  updated_at: "2026-06-27T10:00:00.000Z"
};

describe("organization SMS gate", () => {
  it("does not depend on onboarding submissions", () => {
    const gateSource = readFileSync(
      join(process.cwd(), "src/lib/sms/organization-gate.ts"),
      "utf8"
    );

    expect(gateSource).not.toContain("organization_onboarding_submissions");
    expect(gateSource).not.toContain("Client onboarding is not completed.");
  });

  it("allows activation when billing is paid, trial, or comped", () => {
    expect(canBillingStatusSendSms("paid")).toBe(true);
    expect(canBillingStatusSendSms("trial")).toBe(true);
    expect(canBillingStatusSendSms("comped")).toBe(true);
  });

  it("blocks unpaid and unknown billing statuses", () => {
    expect(canBillingStatusSendSms("unpaid")).toBe(false);
    expect(canBillingStatusSendSms("past_due")).toBe(false);
    expect(canBillingStatusSendSms("cancelled")).toBe(false);
    expect(canBillingStatusSendSms("unknown")).toBe(false);
  });

  it("requires sms_status active only for canSendSms", () => {
    const activation = evaluateOrganizationSmsActivationReadiness({
      billingStatus: "trial",
      smsStatus: "inactive"
    });

    expect(activation.canActivateSms).toBe(true);

    const send = evaluateOrganizationSmsReadiness({
      billingStatus: "trial",
      smsStatus: "inactive"
    });

    expect(send.canSendSms).toBe(false);
    expect(send.blockingReasons).toContain("SMS status is not active.");
  });
});

describe("sms sender readiness hardening", () => {
  it("blocks test sends when messaging service is missing", () => {
    const readiness = computeSmsSenderReadiness({
      sender: {
        ...baseSender,
        twilio_messaging_service_sid: null
      },
      env: { ALLOW_REAL_SMS_SENDS: "true" }
    });

    expect(readiness.canSendTest).toBe(false);
    expect(readiness.blockingReasons.join(" ")).toMatch(/Service d'envoi/i);
  });

  it("uses live verification for configured badges when available", () => {
    const readiness = computeSmsSenderReadiness({
      sender: baseSender,
      liveVerification: {
        verifiedAt: "2026-06-27T10:00:00.000Z",
        subaccountOk: true,
        phoneOk: false,
        messagingServiceOk: true,
        inboundWebhookOk: false,
        statusCallbackOk: true,
        phoneAttachedToService: false,
        issues: ["Numéro Twilio invalide."]
      },
      env: { ALLOW_REAL_SMS_SENDS: "true" }
    });

    const numberCheck = readiness.checks.find((check) => check.key === "dedicated_number");
    const webhookCheck = readiness.checks.find((check) => check.key === "inbound_webhook");

    expect(numberCheck?.status).toBe("error");
    expect(webhookCheck?.status).toBe("error");
  });

  it("requires status callback before marking test validated", () => {
    const readiness = computeSmsSenderReadiness({
      sender: {
        ...baseSender,
        last_test_sms_sent_at: "2026-06-27T10:05:00.000Z",
        last_status_callback_at: null
      },
      env: { ALLOW_REAL_SMS_SENDS: "true" }
    });

    const testCheck = readiness.checks.find((check) => check.key === "test_message");

    expect(testCheck?.status).toBe("missing");
  });
});

describe("Twilio UI and webhook hardening", () => {
  it("masks stale PN errors for UI", () => {
    const safe = getSafeTwilioUiError(
      new Error(
        "The requested resource /2010-04-01/Accounts/AC1234567890123456789012345678901234/IncomingPhoneNumbers/PN1234567890123456789012345678901234 was not found"
      ),
      {
        accountSid: "AC1234567890123456789012345678901234",
        phoneNumberSid: "PN1234567890123456789012345678901234"
      }
    );

    expect(formatSafeTwilioUiErrorMessage(safe)).toMatch(/introuvable/i);
    expect(safe.maskedAccountSid).toContain("•");
    expect(safe.message).not.toContain("PN1234567890123456789012345678901234");
  });

  it("accepts only explicit duplicate attach errors", () => {
    expect(isTwilioDuplicateMessagingAttachError(new Error("21710 Phone Number already exists"))).toBe(
      true
    );
    expect(isTwilioDuplicateMessagingAttachError(new Error("20404 Not Found"))).toBe(false);
  });

  it("validates status callbacks with account-aware auth", () => {
    const statusRoute = readFileSync(
      join(process.cwd(), "src/app/api/webhooks/twilio/status/route.ts"),
      "utf8"
    );

    expect(statusRoute).toContain("validateTwilioWebhookRequestForAccountSid");
    expect(statusRoute).toContain("resolveTwilioAuthTokenForAccountSid");
    expect(statusRoute).not.toContain("validateTwilioWebhookRequest(request, params)");
  });

  it("does not silently swallow messaging attach failures", () => {
    const twilioAdmin = readFileSync(
      join(process.cwd(), "src/lib/sms/twilio-admin.ts"),
      "utf8"
    );

    expect(twilioAdmin).not.toMatch(/catch \{\s*\/\/ Number may already be attached/);
    expect(twilioAdmin).toContain("isTwilioDuplicateMessagingAttachError");
  });
});
