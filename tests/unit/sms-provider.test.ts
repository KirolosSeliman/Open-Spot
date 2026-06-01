import { describe, expect, it } from "vitest";

import {
  isSimulatorWebhookAllowed,
  SIMULATOR_WEBHOOK_SECRET_HEADER
} from "@/lib/sms/simulator";
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
});
