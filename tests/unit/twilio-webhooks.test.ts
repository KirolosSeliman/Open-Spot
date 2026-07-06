import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { classifyInboundSmsBody } from "@/lib/sms/inbound";
import {
  createTwilioSmsProvider,
  getMonotonicTwilioDeliveryStatus,
  normalizeInitialTwilioStatus,
  normalizeTwilioDeliveryStatus,
  parseTwilioInboundRequest,
  parseTwilioStatusRequest,
  resolveTwilioSenderOptions
} from "@/lib/sms/twilio";

const twilioProviderSource = readFileSync(
  join(process.cwd(), "src/lib/sms/twilio.ts"),
  "utf8"
);
const twilioInboundRoute = readFileSync(
  join(process.cwd(), "src/app/api/webhooks/twilio/inbound/route.ts"),
  "utf8"
);
const twilioStatusRoute = readFileSync(
  join(process.cwd(), "src/app/api/webhooks/twilio/status/route.ts"),
  "utf8"
);
const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const smokeScript = readFileSync(
  join(process.cwd(), "scripts/twilio-smoke-test.mjs"),
  "utf8"
);
const smsDeliveryMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260604170000_sms_delivery_status_callbacks.sql"
  ),
  "utf8"
);

describe("Twilio webhook foundation", () => {
  it("uses the official Twilio SDK for signature validation", () => {
    expect(packageJson).toContain('"twilio"');
    expect(twilioProviderSource).toContain('import twilio from "twilio"');
    expect(twilioProviderSource).toContain("twilio.validateRequest");
    expect(twilioProviderSource).toContain("resolveConfiguredSiteUrl");
    expect(twilioProviderSource).toContain("x-twilio-signature");
  });

  it("keeps real Twilio sending behind explicit provider and allow flags", () => {
    expect(twilioProviderSource).toContain('env.SMS_PROVIDER !== "twilio"');
    expect(twilioProviderSource).toContain(
      'env.ALLOW_REAL_SMS_SENDS !== "true"'
    );
    expect(twilioProviderSource).toContain("TWILIO_ACCOUNT_SID");
    expect(twilioProviderSource).toContain("TWILIO_AUTH_TOKEN");
    expect(twilioProviderSource).toContain("TWILIO_SOURCE_NUMBER");
    expect(twilioProviderSource).toContain("TWILIO_MESSAGING_SERVICE_SID");
    expect(twilioProviderSource).toContain("TWILIO_STATUS_CALLBACK_URL");
    expect(twilioProviderSource).toContain("metadata?.from");
    expect(twilioProviderSource).toContain("client.messages.create");
    expect(twilioProviderSource).toContain(
      "status: normalizeInitialTwilioStatus(message.status)"
    );
    expect(twilioProviderSource).not.toContain('status: "sent"');
  });

  it("normalizes initial Twilio statuses without pretending delivery", () => {
    expect(normalizeInitialTwilioStatus("queued")).toBe("queued");
    expect(normalizeInitialTwilioStatus("accepted")).toBe("accepted");
    expect(normalizeInitialTwilioStatus("sent")).toBe("sent");
    expect(normalizeInitialTwilioStatus("delivered")).toBe("delivered");
    expect(normalizeInitialTwilioStatus("mystery")).toBe(
      "submitted_to_provider"
    );
    expect(normalizeInitialTwilioStatus(undefined)).toBe(
      "submitted_to_provider"
    );
  });

  it("normalizes Twilio callback statuses", () => {
    expect(normalizeTwilioDeliveryStatus("delivered")).toBe("delivered");
    expect(normalizeTwilioDeliveryStatus("failed")).toBe("failed");
    expect(normalizeTwilioDeliveryStatus("undelivered")).toBe("undelivered");
    expect(normalizeTwilioDeliveryStatus("SENT")).toBe("sent");
    expect(normalizeTwilioDeliveryStatus("")).toBe("submitted_to_provider");
  });

  it("does not downgrade terminal Twilio delivery statuses", () => {
    expect(
      getMonotonicTwilioDeliveryStatus({
        currentStatus: "delivered",
        nextStatus: "sent"
      })
    ).toBe("delivered");
    expect(
      getMonotonicTwilioDeliveryStatus({
        currentStatus: "failed",
        nextStatus: "queued"
      })
    ).toBe("failed");
    expect(
      getMonotonicTwilioDeliveryStatus({
        currentStatus: "sent",
        nextStatus: "delivered"
      })
    ).toBe("delivered");
  });

  it("returns the twilio provider name and refuses disabled real sends", async () => {
    const provider = createTwilioSmsProvider({
      SMS_PROVIDER: "twilio",
      ALLOW_REAL_SMS_SENDS: "false",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_SOURCE_NUMBER: "+15145551234"
    });

    expect(provider.getProviderName()).toBe("twilio");
    await expect(
      provider.sendSms({
        to: "+15145550000",
        body: "Test Open Spot"
      })
    ).rejects.toThrow("Twilio real SMS sending is disabled.");
  });

  it("refuses empty Twilio message bodies before attempting a real send", async () => {
    const provider = createTwilioSmsProvider({
      SMS_PROVIDER: "twilio",
      ALLOW_REAL_SMS_SENDS: "true",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_SOURCE_NUMBER: "+15145551234"
    });

    await expect(
      provider.sendSms({
        to: "+15145550000",
        body: "   "
      })
    ).rejects.toThrow("Twilio SMS body is required.");
  });

  it("requires a valid sender or messaging service for Twilio sends", () => {
    expect(() =>
      resolveTwilioSenderOptions({
        TWILIO_MESSAGING_SERVICE_SID: "MG123"
      })
    ).toThrow("Twilio Messaging Service SID must start with MG");

    expect(() => resolveTwilioSenderOptions({})).toThrow(
      "Twilio source number or Messaging Service SID is not configured."
    );

    expect(() =>
      resolveTwilioSenderOptions({
        TWILIO_SOURCE_NUMBER: "5145551234"
      })
    ).toThrow("Twilio source number must be a valid E.164 value.");
  });

  it("prefers Messaging Service SID while retaining a source number for reply linking", () => {
    const sender = resolveTwilioSenderOptions({
      TWILIO_MESSAGING_SERVICE_SID: "MG12345678901234567890123456789012",
      TWILIO_SOURCE_NUMBER: "+15145551234"
    });

    expect(sender.messageParams).toEqual({
      messagingServiceSid: "MG12345678901234567890123456789012"
    });
    expect(sender.fromNumber).toBe("+15145551234");
  });

  it("falls back to a source number when no Messaging Service SID is configured", () => {
    const sender = resolveTwilioSenderOptions({
      TWILIO_SOURCE_NUMBER: "+15145551234"
    });

    expect(sender.messageParams).toEqual({ from: "+15145551234" });
    expect(sender.fromNumber).toBe("+15145551234");
  });

  it("parses Twilio inbound fields needed for SMS replies", () => {
    expect(twilioProviderSource).toContain('formData.get("From")');
    expect(twilioProviderSource).toContain('formData.get("To")');
    expect(twilioProviderSource).toContain('formData.get("Body")');
    expect(twilioProviderSource).toContain('formData.get("MessageSid")');
    expect(twilioProviderSource).toContain('formData.get("SmsMessageSid")');
    expect(twilioProviderSource).toContain('formData.get("SmsSid")');
    expect(twilioProviderSource).toContain('formData.get("AccountSid")');
    expect(twilioProviderSource).toContain(
      'formData.get("MessagingServiceSid")'
    );
  });

  it("parses Twilio form-url-encoded inbound requests", async () => {
    const request = new Request("https://example.com/api/webhooks/twilio/inbound", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        From: "+15145550000",
        To: "+15145551234",
        Body: "OUI",
        MessageSid: "SM123",
        SmsSid: "SM123",
        AccountSid: "AC123",
        MessagingServiceSid: "MG123"
      })
    });

    await expect(parseTwilioInboundRequest(request)).resolves.toMatchObject({
      from: "+15145550000",
      to: "+15145551234",
      body: "OUI",
      providerMessageId: "SM123",
      smsSid: "SM123",
      accountSid: "AC123",
      messagingServiceSid: "MG123"
    });
  });

  it("parses Twilio delivery status callback fields", async () => {
    const request = new Request("https://example.com/api/webhooks/twilio/status", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        MessageSid: "SM123",
        SmsSid: "SM123",
        AccountSid: "AC123",
        MessagingServiceSid: "MG123",
        MessageStatus: "undelivered",
        ErrorCode: "30007",
        ErrorMessage: "Carrier violation",
        From: "+15145551234",
        To: "+15145550000"
      })
    });

    await expect(parseTwilioStatusRequest(request)).resolves.toMatchObject({
      providerMessageId: "SM123",
      messageStatus: "undelivered",
      errorCode: "30007",
      errorMessage: "Carrier violation",
      from: "+15145551234",
      to: "+15145550000"
    });
  });

  it("returns false when the Twilio signature is missing", async () => {
    const provider = createTwilioSmsProvider({
      TWILIO_AUTH_TOKEN: "secret",
      APP_BASE_URL: "https://example.com"
    });
    const request = new Request("https://example.com/api/webhooks/twilio/inbound", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        From: "+15145550000",
        To: "+15145551234",
        Body: "OUI",
        MessageSid: "SM123"
      })
    });

    await expect(provider.verifyWebhookSignature(request)).resolves.toBe(false);
  });

  it("routes Twilio inbound replies through the same safe inbound processor", () => {
    expect(twilioInboundRoute).toContain("handleInboundSmsRequest");
    expect(twilioInboundRoute).toContain("createTwilioSmsProvider");
    expect(twilioInboundRoute).toContain('runtime = "nodejs"');
  });

  it("handles Twilio delivery status callbacks without exposing secrets", () => {
    expect(twilioStatusRoute).toContain("validateTwilioWebhookRequest");
    expect(twilioStatusRoute).toContain("parseTwilioStatusRequest");
    expect(twilioStatusRoute).toContain('provider_message_id"');
    expect(twilioStatusRoute).toContain("normalizeTwilioDeliveryStatus");
    expect(twilioStatusRoute).toContain("getMonotonicTwilioDeliveryStatus");
    expect(twilioStatusRoute).toContain("status_callback_received_at");
    expect(twilioStatusRoute).toContain("delivered_at");
    expect(twilioStatusRoute).toContain("failed_at");
    expect(twilioStatusRoute).toContain("error_code");
    expect(twilioStatusRoute).toContain("provider_status_payload");
    expect(twilioStatusRoute).toContain("status.errorCode ? { error_code");
    expect(twilioStatusRoute).toContain('"sms.twilio_status.received"');
    expect(twilioStatusRoute).not.toContain("TWILIO_AUTH_TOKEN=");
  });

  it("adds non-destructive delivery status persistence columns", () => {
    expect(smsDeliveryMigration).toContain("add column if not exists error_code");
    expect(smsDeliveryMigration).toContain("status_callback_received_at");
    expect(smsDeliveryMigration).toContain("delivered_at");
    expect(smsDeliveryMigration).toContain("failed_at");
    expect(smsDeliveryMigration).toContain("provider_status_payload jsonb");
    expect(smsDeliveryMigration).toContain("sms_messages_twilio_delivery_lookup_idx");
    expect(smsDeliveryMigration).toContain("sms_messages_opening_outbound_created_idx");
    expect(smsDeliveryMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("keeps the Twilio smoke test behind explicit env and E.164 checks", () => {
    expect(packageJson).toContain('"twilio:smoke"');
    expect(smokeScript).toContain('ALLOW_REAL_SMS_SENDS !== "true"');
    expect(smokeScript).toContain('requireEnv("TWILIO_ACCOUNT_SID")');
    expect(smokeScript).toContain('requireEnv("TWILIO_AUTH_TOKEN")');
    expect(smokeScript).toContain('requireEnv("TWILIO_SOURCE_NUMBER")');
    expect(smokeScript).toContain("isE164Phone");
    expect(smokeScript).not.toContain("TWILIO_AUTH_TOKEN=");
  });

  it("classifies required bilingual reply keywords", () => {
    expect(classifyInboundSmsBody("STOP")).toBe("opt_out");
    expect(classifyInboundSmsBody("stop svp")).toBe("opt_out");
    expect(classifyInboundSmsBody("ARRET")).toBe("opt_out");
    expect(classifyInboundSmsBody("ARRÊT")).toBe("opt_out");
    expect(classifyInboundSmsBody("unsubscribe")).toBe("opt_out");
    expect(classifyInboundSmsBody("unsubscribe me")).toBe("opt_out");
    expect(classifyInboundSmsBody("cancel")).toBe("opt_out");
    expect(classifyInboundSmsBody("arrêt merci")).toBe("opt_out");
    expect(classifyInboundSmsBody("arrêtez svp")).toBe("opt_out");
    expect(classifyInboundSmsBody("désinscrire moi")).toBe("opt_out");
    expect(classifyInboundSmsBody("désinscris-moi")).toBe("opt_out");
    expect(classifyInboundSmsBody("je veux me désinscrire")).toBe("opt_out");
    expect(classifyInboundSmsBody("cancel please")).toBe("opt_out");
    expect(classifyInboundSmsBody("retirez-moi")).toBe("opt_out");
    expect(classifyInboundSmsBody("non", "waitlist")).not.toBe("opt_out");
    expect(classifyInboundSmsBody("no", "waitlist")).not.toBe("opt_out");
    expect(classifyInboundSmsBody("OUI")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody("YES")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody("1")).toBe("waitlist_positive");
  });
});
