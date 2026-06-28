import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  computeSmsSenderReadiness,
  deriveSenderStatusFromConfig
} from "@/lib/sms/sms-setup-readiness";
import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import {
  formatPhoneForDisplay,
  maskTwilioSid,
  validateE164,
  validateTwilioAccountSid,
  validateTwilioMessagingServiceSid,
  validateTwilioPhoneNumberSid
} from "@/lib/sms/twilio-validation";

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

describe("twilio validation helpers", () => {
  it("validates Twilio SIDs and E.164 numbers", () => {
    expect(validateTwilioAccountSid(fakeAccountSid)).toBe(true);
    expect(validateTwilioMessagingServiceSid(fakeMessagingServiceSid)).toBe(true);
    expect(validateTwilioPhoneNumberSid(fakePhoneNumberSid)).toBe(true);
    expect(validateE164("+14385551234")).toBe(true);
    expect(validateTwilioAccountSid("invalid")).toBe(false);
    expect(validateE164("4385551234")).toBe(false);
  });

  it("masks Twilio SIDs without exposing full values", () => {
    expect(maskTwilioSid(fakeAccountSid)).toBe("AC••••••••••••••••••••000");
  });

  it("formats phone numbers for admin display", () => {
    expect(formatPhoneForDisplay("+14385551234")).toBe("+1 (438) 555-1234");
  });
});

describe("sms sender readiness", () => {
  it("blocks when sender is not configured", () => {
    const readiness = computeSmsSenderReadiness({
      sender: null,
      env: { ALLOW_REAL_SMS_SENDS: "true" }
    });

    expect(readiness.isReady).toBe(false);
    expect(readiness.blockingReasons.length).toBeGreaterThan(0);
  });

  it("blocks when phone number or webhooks are missing", () => {
    const readiness = computeSmsSenderReadiness({
      sender: {
        ...baseSender,
        phone_e164: null,
        inbound_webhook_url: null,
        status_callback_url: null,
        last_test_sms_sent_at: null,
        last_status_callback_at: null
      },
      env: { ALLOW_REAL_SMS_SENDS: "true" }
    });

    expect(readiness.isReady).toBe(false);
    expect(readiness.blockingReasons.join(" ")).toMatch(/Numéro dédié|Webhook|Message test/i);
  });

  it("is ready only when all production checks pass", () => {
    const readiness = computeSmsSenderReadiness({
      sender: {
        ...baseSender,
        sender_status: "ready",
        activated_at: "2026-06-27T10:10:00.000Z"
      },
      organizationReadiness: {
        canSendSms: true,
        onboardingStatus: "completed",
        billingStatus: "paid",
        smsStatus: "active",
        blockingReasons: []
      },
      env: { ALLOW_REAL_SMS_SENDS: "true" }
    });

    expect(readiness.isReady).toBe(true);
    expect(readiness.canActivate).toBe(true);
  });

  it("derives sender status from partial configuration", () => {
    expect(
      deriveSenderStatusFromConfig({
        ...baseSender,
        phone_e164: null
      })
    ).toBe("number_missing");

    expect(
      deriveSenderStatusFromConfig({
        ...baseSender,
        inbound_webhook_url: null
      })
    ).toBe("webhook_missing");
  });
});

describe("organization SMS integration wiring", () => {
  it("routes inbound webhooks through dedicated sender lookup", () => {
    const inboundHandler = readFileSync(
      join(process.cwd(), "src/lib/sms/inbound-handler.ts"),
      "utf8"
    );

    expect(inboundHandler).toContain("resolveInboundOrganizationFromSender");
    expect(inboundHandler).toContain("findLatestOutboundContext");
    expect(inboundHandler).toContain('status: "pending_merchant_validation"');
    expect(inboundHandler).not.toContain("auto-confirm");
  });

  it("updates sender status callback timestamps", () => {
    const statusRoute = readFileSync(
      join(process.cwd(), "src/app/api/webhooks/twilio/status/route.ts"),
      "utf8"
    );

    expect(statusRoute).toContain("touchOrganizationSmsSenderStatusCallback");
  });

  it("keeps platform SMS isolated from organization senders", () => {
    const platformConfig = readFileSync(
      join(process.cwd(), "src/lib/sms/platform-config.ts"),
      "utf8"
    );
    const organizationSms = readFileSync(
      join(process.cwd(), "src/lib/sms/organization-sms.ts"),
      "utf8"
    );

    expect(platformConfig).toContain("TWILIO_PLATFORM_MESSAGING_SERVICE_SID");
    expect(organizationSms).toContain("loadOrganizationSmsSender");
    expect(organizationSms).toContain("assertOrganizationSmsSenderReady");
    expect(organizationSms).not.toContain("TWILIO_PLATFORM_MESSAGING_SERVICE_SID");
  });

  it("protects admin SMS actions and hides secrets in UI", () => {
    const actions = readFileSync(
      join(process.cwd(), "src/lib/admin/sms-sender-actions.ts"),
      "utf8"
    );
    const dashboard = readFileSync(
      join(process.cwd(), "src/components/admin/sms-configuration-dashboard.tsx"),
      "utf8"
    );
    const page = readFileSync(
      join(process.cwd(), "src/app/admin/organizations/[id]/sms/page.tsx"),
      "utf8"
    );

    expect(actions).toContain('role !== "super_admin"');
    expect(actions).not.toContain("TWILIO_AUTH_TOKEN");
    expect(dashboard).not.toContain("TWILIO_AUTH_TOKEN");
    expect(page).toContain("Configuration SMS");
    expect(dashboard).toContain(
      "Les réponses positives ne confirment jamais automatiquement"
    );
  });

  it("validates Twilio inbound signatures with account-aware auth token lookup", () => {
    const inboundRoute = readFileSync(
      join(process.cwd(), "src/app/api/webhooks/twilio/inbound/route.ts"),
      "utf8"
    );

    expect(inboundRoute).toContain("validateTwilioWebhookRequestForAccountSid");
    expect(inboundRoute).toContain("resolveTwilioAuthTokenForAccountSid");
  });
});
