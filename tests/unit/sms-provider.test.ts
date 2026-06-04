import { describe, expect, it } from "vitest";

import { createSmsProvider } from "@/lib/sms/factory";
import {
  createSimulatorSmsProvider,
  isSimulatorWebhookAllowed,
  SIMULATOR_SOURCE_NUMBER,
  SIMULATOR_WEBHOOK_SECRET_HEADER
} from "@/lib/sms/simulator";
import {
  getOpeningAlertButtonLabel,
  getOpeningAlertModeCopy,
  getSmsRuntimeStatus
} from "@/lib/sms/runtime-status";
import {
  assertCanSendSms,
  getSmsProviderMode,
  isStopKeyword,
  type SmsConsentStatus
} from "@/lib/sms/provider";

describe("SMS provider safety", () => {
  it("defaults to simulation unless real sending is explicitly enabled", () => {
    expect(getSmsProviderMode({})).toBe("simulation");
    expect(
      getSmsProviderMode({
        SMS_PROVIDER_MODE: "real"
      })
    ).toBe("simulation");
    expect(
      getSmsProviderMode({
        SMS_PROVIDER_MODE: "real",
        SMS_REAL_SEND_ENABLED: "true",
        SMS_PROVIDER_API_KEY: "secret"
      })
    ).toBe("real");
  });

  it("blocks non-consented or invalid recipients", () => {
    expect(() =>
      assertCanSendSms({
        phoneE164: "+15142494425",
        consentStatus: "needs_consent" satisfies SmsConsentStatus
      })
    ).toThrow("SMS consent is not opted in.");

    expect(() =>
      assertCanSendSms({
        phoneE164: "5142494425",
        consentStatus: "opted_in"
      })
    ).toThrow("SMS phone must be valid E.164.");
  });

  it("detects conservative STOP unsubscribe keywords", () => {
    expect(isStopKeyword("STOP")).toBe(true);
    expect(isStopKeyword(" arrêt ")).toBe(true);
    expect(isStopKeyword("unsubscribe")).toBe(true);
    expect(isStopKeyword("oui")).toBe(false);
  });

  it("protects simulator inbound webhooks outside local development", () => {
    expect(SIMULATOR_WEBHOOK_SECRET_HEADER).toBe(
      "x-open-spot-simulator-secret"
    );
    expect(
      isSimulatorWebhookAllowed({
        providerName: "simulator",
        nodeEnv: "development"
      })
    ).toBe(true);
    expect(
      isSimulatorWebhookAllowed({
        providerName: "simulator",
        nodeEnv: "production",
        configuredSecret: undefined,
        requestSecret: undefined
      })
    ).toBe(false);
    expect(
      isSimulatorWebhookAllowed({
        providerName: "simulator",
        nodeEnv: "production",
        configuredSecret: "local-secret",
        requestSecret: "wrong"
      })
    ).toBe(false);
    expect(
      isSimulatorWebhookAllowed({
        providerName: "simulator",
        nodeEnv: "production",
        configuredSecret: "local-secret",
        requestSecret: "local-secret"
      })
    ).toBe(true);
  });

  it("reports simulator as the safe default runtime provider", () => {
    const status = getSmsRuntimeStatus({});

    expect(status.selectedProvider).toBe("simulator");
    expect(status.sendsRealMessages).toBe(false);
    expect(status.canSendOpeningAlerts).toBe(true);
    expect(status.blockingReasons).toEqual([]);
  });

  it("blocks simulator opening sends in deployed production surfaces", () => {
    const status = getSmsRuntimeStatus({
      SMS_PROVIDER: "simulator",
      NODE_ENV: "production"
    });

    expect(status.canSendOpeningAlerts).toBe(false);
    expect(status.blockingReasons).toContain(
      "SMS provider is not configured for production."
    );
    expect(getOpeningAlertButtonLabel(status)).toBe("Send SMS alert");
    expect(getOpeningAlertModeCopy(status)).toBe(
      "SMS provider is not configured for production."
    );
  });

  it("selects the simulator provider by default and when explicitly configured", () => {
    const previousProvider = process.env.SMS_PROVIDER;

    try {
      delete process.env.SMS_PROVIDER;
      expect(createSmsProvider().getProviderName()).toBe("simulator");
      process.env.SMS_PROVIDER = "simulator";
      expect(createSmsProvider().getProviderName()).toBe("simulator");
    } finally {
      if (previousProvider === undefined) {
        delete process.env.SMS_PROVIDER;
      } else {
        process.env.SMS_PROVIDER = previousProvider;
      }
    }
  });

  it("selects the Twilio provider when configured without sending SMS", () => {
    const previousProvider = process.env.SMS_PROVIDER;

    try {
      process.env.SMS_PROVIDER = "twilio";
      expect(createSmsProvider().getProviderName()).toBe("twilio");
    } finally {
      if (previousProvider === undefined) {
        delete process.env.SMS_PROVIDER;
      } else {
        process.env.SMS_PROVIDER = previousProvider;
      }
    }
  });

  it("records the simulator source number in provider send results", async () => {
    const result = await createSimulatorSmsProvider().sendSms({
      to: "+15145551234",
      body: "Test"
    });

    expect(result.provider).toBe("simulator");
    expect(result.fromNumber).toBe(SIMULATOR_SOURCE_NUMBER);
  });

  it("keeps Twilio unavailable until real sends and required config are present", () => {
    const disabled = getSmsRuntimeStatus({
      SMS_PROVIDER: "twilio",
      ALLOW_REAL_SMS_SENDS: "false",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_SOURCE_NUMBER: "+15145551234"
    });

    expect(disabled.selectedProvider).toBe("twilio");
    expect(disabled.sendsRealMessages).toBe(false);
    expect(disabled.canSendOpeningAlerts).toBe(false);
    expect(disabled.blockingReasons).toContain("Real SMS sends are disabled.");
  });

  it("reports Twilio ready without exposing secrets", () => {
    const ready = getSmsRuntimeStatus({
      SMS_PROVIDER: "twilio",
      ALLOW_REAL_SMS_SENDS: "true",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "super-secret-token",
      TWILIO_MESSAGING_SERVICE_SID: "MG12345678901234567890123456789012",
      TWILIO_SOURCE_NUMBER: "+15145551234",
      TWILIO_STATUS_CALLBACK_URL: "https://example.com/api/webhooks/twilio/status",
      APP_BASE_URL: "https://example.com"
    });

    expect(ready.canSendOpeningAlerts).toBe(true);
    expect(ready.sendsRealMessages).toBe(true);
    expect(ready.messagingServiceConfigured).toBe(true);
    expect(ready.fromNumberConfigured).toBe(true);
    expect(ready.statusCallbackConfigured).toBe(true);
    expect(ready.appBaseUrlConfigured).toBe(true);
    expect(ready.statusCallbackPathValid).toBe(true);
    expect(ready.statusCallbackDomainMatchesApp).toBe(true);
    expect(JSON.stringify(ready)).not.toContain("super-secret-token");
  });

  it("reports Twilio delivery callback configuration problems safely", () => {
    const missingCallback = getSmsRuntimeStatus({
      SMS_PROVIDER: "twilio",
      ALLOW_REAL_SMS_SENDS: "true",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "super-secret-token",
      TWILIO_SOURCE_NUMBER: "+15145551234",
      APP_BASE_URL: "https://app.example.com"
    });

    expect(missingCallback.canSendOpeningAlerts).toBe(false);
    expect(missingCallback.deliveryDiagnostics).toContain(
      "Status callback URL is missing. Delivery status cannot be confirmed."
    );
    expect(JSON.stringify(missingCallback)).not.toContain("super-secret-token");

    const wrongDomain = getSmsRuntimeStatus({
      SMS_PROVIDER: "twilio",
      ALLOW_REAL_SMS_SENDS: "true",
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "super-secret-token",
      TWILIO_SOURCE_NUMBER: "+15145551234",
      APP_BASE_URL: "https://app.example.com",
      TWILIO_STATUS_CALLBACK_URL:
        "https://other.example.com/api/webhooks/twilio/status"
    });

    expect(wrongDomain.statusCallbackDomainMatchesApp).toBe(false);
    expect(wrongDomain.deliveryDiagnostics).toContain(
      "APP_BASE_URL and TWILIO_STATUS_CALLBACK_URL use different domains. Twilio signature validation may fail."
    );
  });

  it("keeps Plivo unavailable until implemented", () => {
    const status = getSmsRuntimeStatus({
      SMS_PROVIDER: "plivo",
      PLIVO_SOURCE_NUMBER: "+15145551234"
    });

    expect(status.selectedProvider).toBe("plivo");
    expect(status.canSendOpeningAlerts).toBe(false);
    expect(status.blockingReasons).toContain("Plivo is not implemented yet.");
  });
});
