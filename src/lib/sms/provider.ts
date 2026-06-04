import type { SmsProvider } from "@/lib/env/config";

export type SmsProviderDescriptor = {
  name: SmsProvider;
  sendsRealMessages: boolean;
};

export type SendSmsInput = {
  to: string;
  body: string;
  metadata?: Record<string, string>;
};

export type SendSmsResult = {
  provider: SmsProvider;
  providerMessageId: string;
  status:
    | "accepted"
    | "queued"
    | "sending"
    | "sent"
    | "delivered"
    | "undelivered"
    | "failed"
    | "submitted_to_provider"
    | "simulated";
  fromNumber: string;
};

export type SmsProviderClient = {
  getProviderName(): SmsProvider;
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;
  verifyWebhookSignature(request: Request): Promise<boolean>;
  parseInboundRequest(request: Request): Promise<{
    from: string;
    to: string;
    body: string;
    providerMessageId?: string;
    smsSid?: string;
    accountSid?: string;
    messagingServiceSid?: string;
  }>;
};

export type SmsProviderMode = "simulation" | "real";
export type SmsConsentStatus = "opted_in" | "needs_consent" | "opted_out";

export function createSmsProviderDescriptor(
  provider: SmsProvider
): SmsProviderDescriptor {
  return {
    name: provider,
    sendsRealMessages: provider !== "simulator"
  };
}

export function getSmsProviderMode(
  env: Partial<Record<string, string | undefined>> = process.env
): SmsProviderMode {
  if (
    env.SMS_PROVIDER_MODE === "real" &&
    env.SMS_REAL_SEND_ENABLED === "true" &&
    Boolean(env.SMS_PROVIDER_API_KEY)
  ) {
    return "real";
  }

  return "simulation";
}

export function assertCanSendSms({
  phoneE164,
  consentStatus
}: {
  phoneE164: string;
  consentStatus: SmsConsentStatus;
}) {
  if (consentStatus !== "opted_in") {
    throw new Error("SMS consent is not opted in.");
  }

  if (!/^\+[1-9][0-9]{7,14}$/.test(phoneE164)) {
    throw new Error("SMS phone must be valid E.164.");
  }
}

const stopKeywords = new Set([
  "stop",
  "arret",
  "arrêt",
  "unsubscribe",
  "cancel",
  "desabonner",
  "désabonner"
]);

export function isStopKeyword(body: string) {
  return stopKeywords.has(body.trim().toLowerCase());
}
