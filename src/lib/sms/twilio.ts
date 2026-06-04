import twilio from "twilio";

import type { SmsProviderClient } from "@/lib/sms/provider";

type TwilioEnv = Partial<Record<string, string | undefined>>;
const knownTwilioDeliveryStatuses = new Set([
  "accepted",
  "queued",
  "sending",
  "sent",
  "delivered",
  "undelivered",
  "failed"
]);

function getTwilioWebhookUrl(request: Request, env: TwilioEnv = process.env) {
  const configuredBaseUrl = env.APP_BASE_URL?.replace(/\/$/, "");

  if (!configuredBaseUrl) {
    return request.url;
  }

  return `${configuredBaseUrl}${new URL(request.url).pathname}`;
}

function isE164Phone(value: string) {
  return /^\+[1-9][0-9]{7,14}$/.test(value);
}

function isMessagingServiceSid(value: string) {
  return /^MG[a-zA-Z0-9]{32}$/.test(value);
}

export function normalizeTwilioDeliveryStatus(status: string | null | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (knownTwilioDeliveryStatuses.has(normalized)) {
    return normalized as
      | "accepted"
      | "queued"
      | "sending"
      | "sent"
      | "delivered"
      | "undelivered"
      | "failed";
  }

  return "submitted_to_provider" as const;
}

export function normalizeInitialTwilioStatus(status: string | null | undefined) {
  return normalizeTwilioDeliveryStatus(status);
}

export function resolveTwilioSenderOptions(
  env: TwilioEnv = process.env,
  metadata: Record<string, string> | undefined = undefined
) {
  const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const fromNumber = metadata?.from ?? env.TWILIO_SOURCE_NUMBER;

  if (messagingServiceSid) {
    if (!isMessagingServiceSid(messagingServiceSid)) {
      throw new Error("Twilio Messaging Service SID must start with MG and be a valid SID.");
    }

    if (!fromNumber || !isE164Phone(fromNumber)) {
      throw new Error(
        "Twilio source number must be configured as valid E.164 for inbound reply linking."
      );
    }

    return {
      messageParams: { messagingServiceSid },
      fromNumber
    };
  }

  if (!fromNumber) {
    throw new Error("Twilio source number or Messaging Service SID is not configured.");
  }

  if (!isE164Phone(fromNumber)) {
    throw new Error("Twilio source number must be a valid E.164 value.");
  }

  return {
    messageParams: { from: fromNumber },
    fromNumber
  };
}

async function readTwilioFormParams(request: Request) {
  const body = await request.clone().text();

  return Object.fromEntries(new URLSearchParams(body));
}

export function validateTwilioWebhookRequest(
  request: Request,
  params: Record<string, string>,
  env: TwilioEnv = process.env
) {
  const authToken = env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature");

  if (!authToken || !signature) {
    return false;
  }

  return twilio.validateRequest(
    authToken,
    signature,
    getTwilioWebhookUrl(request, env),
    params
  );
}

export async function parseTwilioInboundRequest(request: Request) {
  const formData = await request.formData();

  return {
    from: String(formData.get("From") ?? ""),
    to: String(formData.get("To") ?? ""),
    body: String(formData.get("Body") ?? ""),
    providerMessageId: String(
      formData.get("MessageSid") ??
        formData.get("SmsMessageSid") ??
        formData.get("SmsSid") ??
        ""
    ),
    smsSid: String(formData.get("SmsSid") ?? ""),
    accountSid: String(formData.get("AccountSid") ?? ""),
    messagingServiceSid: String(formData.get("MessagingServiceSid") ?? "")
  };
}

export async function parseTwilioStatusRequest(request: Request) {
  const formData = await request.formData();

  return {
    providerMessageId: String(
      formData.get("MessageSid") ??
        formData.get("SmsMessageSid") ??
        formData.get("SmsSid") ??
        ""
    ),
    smsSid: String(formData.get("SmsSid") ?? ""),
    accountSid: String(formData.get("AccountSid") ?? ""),
    messagingServiceSid: String(formData.get("MessagingServiceSid") ?? ""),
    messageStatus: String(
      formData.get("MessageStatus") ?? formData.get("SmsStatus") ?? ""
    ),
    errorCode: formData.get("ErrorCode")
      ? String(formData.get("ErrorCode"))
      : null,
    errorMessage: formData.get("ErrorMessage")
      ? String(formData.get("ErrorMessage"))
      : null,
    to: String(formData.get("To") ?? ""),
    from: String(formData.get("From") ?? "")
  };
}

export function createTwilioSmsProvider(
  env: TwilioEnv = process.env
): SmsProviderClient {
  return {
    getProviderName() {
      return "twilio";
    },
    async sendSms(input) {
      if (env.SMS_PROVIDER !== "twilio" || env.ALLOW_REAL_SMS_SENDS !== "true") {
        throw new Error("Twilio real SMS sending is disabled.");
      }

      const body = input.body.trim();
      if (!body) {
        throw new Error("Twilio SMS body is required.");
      }

      if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
        throw new Error("Twilio sending is not configured.");
      }

      if (!isE164Phone(input.to)) {
        throw new Error("Twilio destination number must be a valid E.164 value.");
      }

      const sender = resolveTwilioSenderOptions(env, input.metadata);
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({
        to: input.to,
        body,
        ...sender.messageParams,
        statusCallback: env.TWILIO_STATUS_CALLBACK_URL || undefined
      });

      return {
        provider: "twilio",
        providerMessageId: message.sid,
        status: normalizeInitialTwilioStatus(message.status),
        fromNumber: sender.fromNumber
      };
    },
    async verifyWebhookSignature(request) {
      const params = await readTwilioFormParams(request);

      return validateTwilioWebhookRequest(request, params, env);
    },
    async parseInboundRequest(request) {
      const parsed = await parseTwilioInboundRequest(request);

      return {
        ...parsed,
        providerMessageId: parsed.providerMessageId || undefined,
        smsSid: parsed.smsSid || undefined,
        accountSid: parsed.accountSid || undefined,
        messagingServiceSid: parsed.messagingServiceSid || undefined
      };
    }
  };
}
