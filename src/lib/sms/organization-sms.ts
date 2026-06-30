import twilio from "twilio";

import { canSendSmsWithinLimits } from "@/lib/billing/sms-cost-controls";
import { getSmsProvider } from "@/lib/env/config";
import {
  createSimulatorSmsProvider,
  SIMULATOR_SOURCE_NUMBER
} from "@/lib/sms/simulator";
import {
  assertCanSendSms,
  type SmsConsentStatus
} from "@/lib/sms/provider";
import {
  loadOrganizationSmsSender,
  updateOrganizationSmsSender
} from "@/lib/sms/organization-sender";
import { loadOrganizationSmsReadiness } from "@/lib/sms/organization-gate";
import {
  assertOrganizationSmsSenderReady,
  computeSmsSenderReadiness
} from "@/lib/sms/sms-setup-readiness";
import {
  buildTwilioWebhookUrls,
  resolveOrganizationTwilioSenderOptions
} from "@/lib/sms/twilio-sender-config";
import { normalizeInitialTwilioStatus } from "@/lib/sms/twilio";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type TwilioEnv = Partial<Record<string, string | undefined>>;

export type SendOrganizationSmsInput = {
  organizationId: string;
  to: string;
  body: string;
  messageType?: string | null;
  openingId?: string | null;
  appointmentId?: string | null;
  customerId?: string | null;
  consentStatus?: SmsConsentStatus;
  metadata?: Record<string, string>;
  env?: TwilioEnv;
};

export type SendOrganizationSmsResult = {
  provider: "twilio" | "simulator";
  providerMessageId: string;
  status: string;
  fromNumber: string;
};

function getSafeTwilioErrorMessage(error: unknown, env: TwilioEnv = process.env) {
  const rawMessage =
    error instanceof Error ? error.message : "Organization SMS send failed.";
  const authToken = env.TWILIO_AUTH_TOKEN;

  return authToken ? rawMessage.replaceAll(authToken, "[redacted]") : rawMessage;
}

function usesOrganizationSmsSimulator(env: TwilioEnv = process.env) {
  return getSmsProvider(env) === "simulator" || env.ALLOW_REAL_SMS_SENDS !== "true";
}

export function getOrganizationSmsRuntimeProviderName(env: TwilioEnv = process.env) {
  return usesOrganizationSmsSimulator(env) ? "simulator" : "twilio";
}

export async function resolveOrganizationSmsFromNumber({
  organizationId,
  env = process.env
}: {
  organizationId: string;
  env?: TwilioEnv;
}) {
  if (usesOrganizationSmsSimulator(env)) {
    return SIMULATOR_SOURCE_NUMBER;
  }

  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  return resolveOrganizationTwilioSenderOptions(sender, env).fromNumber;
}

function createOrganizationTwilioClient(
  accountSid: string | null,
  env: TwilioEnv = process.env
) {
  const parentSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();

  if (!parentSid || !authToken) {
    throw new Error("Twilio credentials are not configured.");
  }

  if (accountSid && accountSid !== parentSid) {
    return twilio(parentSid, authToken, { accountSid });
  }

  return twilio(parentSid, authToken);
}

function getUtcDayStart(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  ).toISOString();
}

function getUtcMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString();
}

async function assertSmsWithinOrganizationLimits({
  organizationId,
  supabase
}: {
  organizationId: string;
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
}) {
  const { data: settings, error: settingsError } = await supabase
    .from("organization_billing_settings")
    .select("sms_daily_limit, sms_monthly_limit")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const dailyLimit = settings?.sms_daily_limit ?? 100;
  const monthlyLimit = settings?.sms_monthly_limit ?? 1000;
  const billableStatuses = [
    "accepted",
    "queued",
    "sending",
    "sent",
    "delivered",
    "submitted_to_provider"
  ];

  const [{ count: dailySent, error: dailyError }, { count: monthlySent, error: monthlyError }] =
    await Promise.all([
      supabase
        .from("sms_messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("direction", "outbound")
        .in("status", billableStatuses)
        .gte("created_at", getUtcDayStart()),
      supabase
        .from("sms_messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("direction", "outbound")
        .in("status", billableStatuses)
        .gte("created_at", getUtcMonthStart())
    ]);

  if (dailyError) {
    throw new Error(dailyError.message);
  }

  if (monthlyError) {
    throw new Error(monthlyError.message);
  }

  const limitCheck = canSendSmsWithinLimits({
    dailySent: dailySent ?? 0,
    dailyLimit,
    monthlySent: monthlySent ?? 0,
    monthlyLimit
  });

  if (!limitCheck.ok) {
    throw new Error(limitCheck.reason ?? "SMS sending limit reached.");
  }
}

export async function sendOrganizationSms(
  input: SendOrganizationSmsInput
): Promise<SendOrganizationSmsResult> {
  const env = input.env ?? process.env;
  const trimmedBody = input.body.trim();

  if (!trimmedBody) {
    throw new Error("SMS body is required.");
  }

  if (input.consentStatus) {
    if (
      input.messageType === "consent_request" &&
      input.consentStatus === "needs_consent"
    ) {
      if (!/^\+[1-9][0-9]{7,14}$/.test(input.to)) {
        throw new Error("SMS phone must be valid E.164.");
      }
    } else {
      assertCanSendSms({
        phoneE164: input.to,
        consentStatus: input.consentStatus
      });
    }
  }

  const supabase = createSupabaseServiceClient();

  if (supabase) {
    await assertSmsWithinOrganizationLimits({
      organizationId: input.organizationId,
      supabase
    });
  }

  if (usesOrganizationSmsSimulator(env)) {
    const provider = createSimulatorSmsProvider();
    const sendResult = await provider.sendSms({
      to: input.to,
      body: trimmedBody,
      metadata: input.metadata
    });

    return {
      provider: "simulator",
      providerMessageId: sendResult.providerMessageId,
      status: sendResult.status,
      fromNumber: sendResult.fromNumber
    };
  }

  if (env.SMS_PROVIDER !== "twilio") {
    throw new Error("Organization SMS requires SMS_PROVIDER=twilio for real sends.");
  }

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const [sender, organizationReadiness] = await Promise.all([
    loadOrganizationSmsSender(input.organizationId),
    loadOrganizationSmsReadiness(supabase, input.organizationId)
  ]);

  assertOrganizationSmsSenderReady(sender, organizationReadiness);

  const readiness = computeSmsSenderReadiness({
    sender,
    organizationReadiness,
    env
  });

  if (!readiness.isReady) {
    throw new Error(readiness.blockingReasons[0] ?? "Organization SMS sender is not ready.");
  }

  const senderOptions = resolveOrganizationTwilioSenderOptions(sender!, env);
  const webhookUrls = buildTwilioWebhookUrls(env);
  const accountSid =
    sender!.sender_model === "dedicated_subaccount"
      ? sender!.twilio_subaccount_sid
      : env.TWILIO_ACCOUNT_SID?.trim() ?? null;
  const client = createOrganizationTwilioClient(accountSid, env);

  try {
    const message = await client.messages.create({
      to: input.to,
      body: trimmedBody,
      ...senderOptions.messageParams,
      statusCallback: webhookUrls.statusCallbackUrl || undefined
    });

    return {
      provider: "twilio",
      providerMessageId: message.sid,
      status: normalizeInitialTwilioStatus(message.status),
      fromNumber: senderOptions.fromNumber
    };
  } catch (error) {
    await updateOrganizationSmsSender(input.organizationId, {
      last_error: getSafeTwilioErrorMessage(error, env).slice(0, 500)
    });

    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
}

export async function canOrganizationSendRealSms(organizationId: string) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return {
      canSend: false,
      reasons: ["Supabase service client is not configured."]
    };
  }

  if (usesOrganizationSmsSimulator()) {
    return { canSend: true, reasons: [] as string[] };
  }

  const [sender, organizationReadiness] = await Promise.all([
    loadOrganizationSmsSender(organizationId),
    loadOrganizationSmsReadiness(supabase, organizationId)
  ]);
  const readiness = computeSmsSenderReadiness({
    sender,
    organizationReadiness
  });

  return {
    canSend: readiness.isReady,
    reasons: readiness.blockingReasons
  };
}
