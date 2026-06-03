import { getSmsProvider, type SmsProvider } from "@/lib/env/config";

type EnvSource = Partial<Record<string, string | undefined>>;

export type SmsRuntimeStatus = {
  selectedProvider: SmsProvider;
  sendsRealMessages: boolean;
  realSmsAllowed: boolean;
  canSendOpeningAlerts: boolean;
  blockingReasons: string[];
  fromNumberConfigured: boolean;
  messagingServiceConfigured: boolean;
  statusCallbackConfigured: boolean;
  appBaseUrlConfigured: boolean;
};

function isE164Phone(value: string | undefined) {
  return Boolean(value && /^\+[1-9][0-9]{7,14}$/.test(value));
}

function isMessagingServiceSid(value: string | undefined) {
  return Boolean(value && /^MG[a-zA-Z0-9]{32}$/.test(value));
}

export function getSmsRuntimeStatus(
  env: EnvSource = process.env
): SmsRuntimeStatus {
  const selectedProvider = getSmsProvider(env);
  const blockingReasons: string[] = [];
  const fromNumberConfigured =
    selectedProvider === "twilio"
      ? isE164Phone(env.TWILIO_SOURCE_NUMBER)
      : selectedProvider === "plivo"
        ? isE164Phone(env.PLIVO_SOURCE_NUMBER)
        : true;
  const messagingServiceConfigured = isMessagingServiceSid(
    env.TWILIO_MESSAGING_SERVICE_SID
  );
  const statusCallbackConfigured = Boolean(env.TWILIO_STATUS_CALLBACK_URL);
  const appBaseUrlConfigured = Boolean(env.APP_BASE_URL);
  const realSmsAllowed = env.ALLOW_REAL_SMS_SENDS === "true";
  const deployedEnvironment =
    env.NODE_ENV === "production" ||
    env.VERCEL_ENV === "preview" ||
    env.VERCEL_ENV === "production";

  if (selectedProvider === "simulator" && deployedEnvironment) {
    blockingReasons.push("SMS provider is not configured for production.");
  }

  if (selectedProvider === "plivo") {
    blockingReasons.push("Plivo is not implemented yet.");
  }

  if (selectedProvider === "twilio") {
    if (!realSmsAllowed) {
      blockingReasons.push("Real SMS sends are disabled.");
    }

    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      blockingReasons.push("Twilio credentials are not configured.");
    }

    if (!messagingServiceConfigured && !fromNumberConfigured) {
      blockingReasons.push("Twilio sender is not configured.");
    }

    if (messagingServiceConfigured && !fromNumberConfigured) {
      blockingReasons.push(
        "Twilio source number is required for inbound reply linking."
      );
    }
  }

  return {
    selectedProvider,
    sendsRealMessages: selectedProvider === "twilio" && realSmsAllowed,
    realSmsAllowed,
    canSendOpeningAlerts: blockingReasons.length === 0,
    blockingReasons,
    fromNumberConfigured,
    messagingServiceConfigured,
    statusCallbackConfigured,
    appBaseUrlConfigured
  };
}

export function getOpeningAlertButtonLabel(status: SmsRuntimeStatus) {
  if (status.selectedProvider === "twilio" && status.canSendOpeningAlerts) {
    return "Send SMS alert";
  }

  if (status.selectedProvider === "simulator") {
    return "Send SMS alert";
  }

  return "SMS unavailable";
}

export function getOpeningAlertModeCopy(status: SmsRuntimeStatus) {
  if (status.selectedProvider === "twilio") {
    return status.canSendOpeningAlerts
      ? "Twilio mode: real SMS will be sent to opted-in eligible clients."
      : `Twilio mode is not ready: ${status.blockingReasons.join(" ")}`;
  }

  if (status.selectedProvider === "plivo") {
    return "Plivo is not implemented yet.";
  }

  if (!status.canSendOpeningAlerts) {
    return "SMS provider is not configured for production.";
  }

  return "Simulation mode: no real SMS will be sent.";
}
