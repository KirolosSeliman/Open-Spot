import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import { resolveTwilioSenderOptions } from "@/lib/sms/twilio";
import { validateE164, validateTwilioMessagingServiceSid } from "@/lib/sms/twilio-validation";

type TwilioEnv = Partial<Record<string, string | undefined>>;

function getAppBaseUrl(env: TwilioEnv = process.env) {
  return env.APP_BASE_URL?.replace(/\/$/, "") ?? null;
}

export function buildTwilioWebhookUrls(env: TwilioEnv = process.env) {
  const baseUrl = getAppBaseUrl(env);

  if (!baseUrl) {
    return {
      inboundWebhookUrl: null,
      statusCallbackUrl: null
    };
  }

  return {
    inboundWebhookUrl: `${baseUrl}/api/webhooks/twilio/inbound`,
    statusCallbackUrl:
      env.TWILIO_STATUS_CALLBACK_URL?.trim() ||
      `${baseUrl}/api/webhooks/twilio/status`
  };
}

export function resolveOrganizationTwilioSenderOptions(
  sender: OrganizationSmsSenderRow,
  env: TwilioEnv = process.env
) {
  if (!sender.phone_e164 || !validateE164(sender.phone_e164)) {
    throw new Error("Organization sender phone number is not configured.");
  }

  if (sender.twilio_messaging_service_sid) {
    if (!validateTwilioMessagingServiceSid(sender.twilio_messaging_service_sid)) {
      throw new Error("Organization Messaging Service SID is invalid.");
    }

    return {
      messageParams: { messagingServiceSid: sender.twilio_messaging_service_sid },
      fromNumber: sender.phone_e164,
      accountSid:
        sender.sender_model === "dedicated_subaccount"
          ? sender.twilio_subaccount_sid
          : env.TWILIO_ACCOUNT_SID?.trim() ?? null
    };
  }

  return resolveTwilioSenderOptions(env, { from: sender.phone_e164 });
}
