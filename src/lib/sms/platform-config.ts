import "server-only";

import twilio from "twilio";

import { getSmsProvider } from "@/lib/env/config";
import {
  normalizeInitialTwilioStatus
} from "@/lib/sms/twilio";
export const PLATFORM_SIMULATOR_SOURCE_NUMBER = "+10000000001";

type TwilioEnv = Partial<Record<string, string | undefined>>;

function isE164Phone(value: string) {
  return /^\+[1-9][0-9]{7,14}$/.test(value);
}

function isMessagingServiceSid(value: string) {
  return /^MG[a-zA-Z0-9]{32}$/.test(value);
}

export function usesPlatformSmsSimulator(env: TwilioEnv = process.env) {
  return (
    getSmsProvider(env) === "simulator" || env.ALLOW_REAL_SMS_SENDS !== "true"
  );
}

export function isPlatformSmsConfigured(env: TwilioEnv = process.env) {
  if (usesPlatformSmsSimulator(env)) {
    return true;
  }

  if (!env.TWILIO_ACCOUNT_SID?.trim() || !env.TWILIO_AUTH_TOKEN?.trim()) {
    return false;
  }

  const messagingServiceSid = env.TWILIO_PLATFORM_MESSAGING_SERVICE_SID?.trim();
  const fromNumber = env.TWILIO_PLATFORM_FROM_NUMBER?.trim();

  if (messagingServiceSid) {
    return isMessagingServiceSid(messagingServiceSid);
  }

  return Boolean(fromNumber && isE164Phone(fromNumber));
}

export function getPlatformSmsConfigurationError(
  env: TwilioEnv = process.env
) {
  if (usesPlatformSmsSimulator(env)) {
    return null;
  }

  if (!env.TWILIO_ACCOUNT_SID?.trim() || !env.TWILIO_AUTH_TOKEN?.trim()) {
    return "Twilio credentials are not configured for platform SMS.";
  }

  const messagingServiceSid = env.TWILIO_PLATFORM_MESSAGING_SERVICE_SID?.trim();
  const fromNumber = env.TWILIO_PLATFORM_FROM_NUMBER?.trim();

  if (messagingServiceSid) {
    if (!isMessagingServiceSid(messagingServiceSid)) {
      return "TWILIO_PLATFORM_MESSAGING_SERVICE_SID must be a valid Messaging Service SID.";
    }

    return null;
  }

  if (!fromNumber) {
    return "Configure TWILIO_PLATFORM_MESSAGING_SERVICE_SID or TWILIO_PLATFORM_FROM_NUMBER for platform SMS.";
  }

  if (!isE164Phone(fromNumber)) {
    return "TWILIO_PLATFORM_FROM_NUMBER must be a valid E.164 phone number.";
  }

  return null;
}

export function resolvePlatformTwilioSenderOptions(env: TwilioEnv = process.env) {
  const configError = getPlatformSmsConfigurationError(env);

  if (configError) {
    throw new Error(configError);
  }

  const messagingServiceSid = env.TWILIO_PLATFORM_MESSAGING_SERVICE_SID?.trim();
  const platformFromNumber = env.TWILIO_PLATFORM_FROM_NUMBER?.trim();

  if (messagingServiceSid) {
    const fromNumber =
      platformFromNumber && isE164Phone(platformFromNumber)
        ? platformFromNumber
        : env.TWILIO_SOURCE_NUMBER?.trim();

    if (!fromNumber || !isE164Phone(fromNumber)) {
      throw new Error(
        "TWILIO_PLATFORM_FROM_NUMBER or TWILIO_SOURCE_NUMBER must be configured as valid E.164 for platform SMS sender metadata."
      );
    }

    return {
      messageParams: { messagingServiceSid },
      fromNumber
    };
  }

  if (!platformFromNumber || !isE164Phone(platformFromNumber)) {
    throw new Error("TWILIO_PLATFORM_FROM_NUMBER must be a valid E.164 value.");
  }

  return {
    messageParams: { from: platformFromNumber },
    fromNumber: platformFromNumber
  };
}

export async function sendPlatformTwilioSms({
  to,
  body,
  env = process.env
}: {
  to: string;
  body: string;
  env?: TwilioEnv;
}) {
  if (!isE164Phone(to)) {
    throw new Error("Platform SMS destination number must be a valid E.164 value.");
  }

  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("Platform SMS body is required.");
  }

  if (usesPlatformSmsSimulator(env)) {
    return {
      provider: "simulator" as const,
      providerMessageId: `platform_sim_${Buffer.from(`${to}:${trimmedBody}`).toString("base64url").slice(0, 24)}`,
      status: "simulated" as const,
      fromNumber: PLATFORM_SIMULATOR_SOURCE_NUMBER
    };
  }

  if (env.SMS_PROVIDER !== "twilio") {
    throw new Error("Platform SMS requires SMS_PROVIDER=twilio for real sends.");
  }

  const sender = resolvePlatformTwilioSenderOptions(env);
  const client = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
  const message = await client.messages.create({
    to,
    body: trimmedBody,
    ...sender.messageParams,
    statusCallback: env.TWILIO_STATUS_CALLBACK_URL || undefined
  });

  return {
    provider: "twilio" as const,
    providerMessageId: message.sid,
    status: normalizeInitialTwilioStatus(message.status),
    fromNumber: sender.fromNumber
  };
}

export function getSafePlatformSmsErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Platform SMS provider rejected the send.";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const withoutSecret = twilioToken
    ? rawMessage.replaceAll(twilioToken, "[redacted]")
    : rawMessage;

  return withoutSecret.slice(0, 180);
}
