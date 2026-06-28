import "server-only";

import twilio from "twilio";

import {
  loadOrganizationSmsSender,
  loadOrganizationSmsSenderBySubaccountSid,
  updateOrganizationSmsSender
} from "@/lib/sms/organization-sender";
import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import { deriveSenderStatusFromConfig } from "@/lib/sms/sms-setup-readiness";
import { buildTwilioWebhookUrls } from "@/lib/sms/twilio-sender-config";
import { DEFAULT_ORGANIZATION_TEST_SMS_BODY } from "@/lib/sms/organization-sms-copy";
import {
  validateE164,
  validateTwilioAccountSid,
  validateTwilioMessagingServiceSid,
  validateTwilioPhoneNumberSid
} from "@/lib/sms/twilio-validation";
import {
  normalizeInitialTwilioStatus
} from "@/lib/sms/twilio";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type TwilioEnv = Partial<Record<string, string | undefined>>;

function requireTwilioParentCredentials(env: TwilioEnv = process.env) {
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    throw new Error("Twilio parent credentials are not configured.");
  }

  if (!validateTwilioAccountSid(accountSid)) {
    throw new Error("TWILIO_ACCOUNT_SID is invalid.");
  }

  return { accountSid, authToken };
}

function createParentTwilioClient(env: TwilioEnv = process.env) {
  const { accountSid, authToken } = requireTwilioParentCredentials(env);

  return twilio(accountSid, authToken);
}

function createScopedTwilioClient(
  sender: OrganizationSmsSenderRow,
  env: TwilioEnv = process.env
) {
  const { accountSid, authToken } = requireTwilioParentCredentials(env);

  if (
    sender.sender_model === "dedicated_subaccount" &&
    sender.twilio_subaccount_sid
  ) {
    return twilio(accountSid, authToken, {
      accountSid: sender.twilio_subaccount_sid
    });
  }

  return twilio(accountSid, authToken);
}

function getSafeTwilioErrorMessage(error: unknown, env: TwilioEnv = process.env) {
  const rawMessage =
    error instanceof Error ? error.message : "Twilio request failed.";
  const authToken = env.TWILIO_AUTH_TOKEN;

  return authToken ? rawMessage.replaceAll(authToken, "[redacted]") : rawMessage;
}

function getOrganizationFriendlyName(organizationName: string) {
  return `Open Spot - ${organizationName}`.slice(0, 64);
}

export async function resolveTwilioAuthTokenForAccountSid(
  accountSid: string,
  env: TwilioEnv = process.env
): Promise<string | null> {
  const parentSid = env.TWILIO_ACCOUNT_SID?.trim();

  if (!parentSid) {
    return null;
  }

  if (accountSid === parentSid) {
    return env.TWILIO_AUTH_TOKEN?.trim() ?? null;
  }

  const knownSender = await loadOrganizationSmsSenderBySubaccountSid(accountSid);

  if (!knownSender) {
    return null;
  }

  try {
    const client = createParentTwilioClient(env);
    const account = await client.api.accounts(accountSid).fetch();

    return account.authToken ?? null;
  } catch {
    return null;
  }
}

export async function createTwilioSubaccountForOrganization({
  organizationId,
  organizationName,
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  organizationName: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  const sender = await loadOrganizationSmsSender(organizationId);
  const client = createParentTwilioClient(env);
  const friendlyName = getOrganizationFriendlyName(organizationName);

  try {
    const account = await client.api.accounts.create({ friendlyName });

    return updateOrganizationSmsSender(
      organizationId,
      {
        sender_model: "dedicated_subaccount",
        twilio_subaccount_sid: account.sid,
        twilio_subaccount_friendly_name: account.friendlyName,
        twilio_subaccount_status: account.status,
        sender_status: "connected",
        last_synced_at: new Date().toISOString(),
        last_error: null,
        provider_payload: {
          ...(sender?.provider_payload ?? {}),
          is_trial_account: account.type === "Trial"
        }
      },
      platformAdminId
    );
  } catch (error) {
    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
}

export async function connectTwilioSubaccountForOrganization({
  organizationId,
  subaccountSid,
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  subaccountSid: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  if (!validateTwilioAccountSid(subaccountSid)) {
    throw new Error("Twilio subaccount SID is invalid.");
  }

  const sender = await loadOrganizationSmsSender(organizationId);
  const client = createParentTwilioClient(env);

  try {
    const account = await client.api.accounts(subaccountSid).fetch();

    return updateOrganizationSmsSender(
      organizationId,
      {
        sender_model: "dedicated_subaccount",
        twilio_subaccount_sid: account.sid,
        twilio_subaccount_friendly_name: account.friendlyName,
        twilio_subaccount_status: account.status,
        sender_status: "connected",
        last_synced_at: new Date().toISOString(),
        last_error: null,
        provider_payload: {
          ...(sender?.provider_payload ?? {}),
          is_trial_account: account.type === "Trial"
        }
      },
      platformAdminId
    );
  } catch (error) {
    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
}

export async function syncTwilioSubaccountForOrganization({
  organizationId,
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender?.twilio_subaccount_sid) {
    throw new Error("No Twilio subaccount is linked to this organization.");
  }

  const client = createParentTwilioClient(env);

  try {
    const account = await client.api.accounts(sender.twilio_subaccount_sid).fetch();
    const scopedClient = createScopedTwilioClient(sender, env);
    const messagingServices = await scopedClient.messaging.v1.services.list({
      limit: 20
    });
    const messagingService = messagingServices[0] ?? null;
    const phoneNumbers = messagingService
      ? await scopedClient.messaging.v1
          .services(messagingService.sid)
          .phoneNumbers.list({ limit: 20 })
      : await scopedClient.incomingPhoneNumbers.list({ limit: 20 });
    const primaryNumber = phoneNumbers[0] ?? null;
    const webhookUrls = buildTwilioWebhookUrls(env);
    const nextSender = {
      twilio_subaccount_friendly_name: account.friendlyName,
      twilio_subaccount_status: account.status,
      twilio_messaging_service_sid: messagingService?.sid ?? sender.twilio_messaging_service_sid,
      twilio_phone_number_sid: primaryNumber?.sid ?? sender.twilio_phone_number_sid,
      phone_e164: primaryNumber?.phoneNumber ?? sender.phone_e164,
      inbound_webhook_url:
        messagingService?.inboundRequestUrl ??
        (primaryNumber as { smsUrl?: string } | null)?.smsUrl ??
        sender.inbound_webhook_url,
      status_callback_url:
        messagingService?.statusCallback ??
        webhookUrls.statusCallbackUrl ??
        sender.status_callback_url,
      last_synced_at: new Date().toISOString(),
      last_error: null,
      provider_payload: {
        ...(sender.provider_payload ?? {}),
        is_trial_account: account.type === "Trial",
        messaging_service_count: messagingServices.length,
        phone_number_count: phoneNumbers.length
      }
    };
    const updated = await updateOrganizationSmsSender(
      organizationId,
      {
        ...nextSender,
        sender_status: deriveSenderStatusFromConfig({
          ...sender,
          ...nextSender
        } as OrganizationSmsSenderRow)
      },
      platformAdminId
    );

    return updated;
  } catch (error) {
    await updateOrganizationSmsSender(
      organizationId,
      {
        last_error: getSafeTwilioErrorMessage(error, env).slice(0, 500)
      },
      platformAdminId
    );

    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
}

export async function listTwilioNumbersForOrganization({
  organizationId,
  env = process.env
}: {
  organizationId: string;
  env?: TwilioEnv;
}) {
  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  const client = createScopedTwilioClient(sender, env);
  const numbers = await client.incomingPhoneNumbers.list({ limit: 50 });

  return numbers.map((number) => ({
    sid: number.sid,
    phoneE164: number.phoneNumber,
    friendlyName: number.friendlyName,
    smsCapable: Boolean(number.capabilities?.sms),
    smsUrl: number.smsUrl ?? null,
    statusCallback: number.statusCallback ?? null
  }));
}

export async function assignTwilioNumberToOrganization({
  organizationId,
  phoneNumberSid,
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  phoneNumberSid: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  if (!validateTwilioPhoneNumberSid(phoneNumberSid)) {
    throw new Error("Twilio phone number SID is invalid.");
  }

  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  const client = createScopedTwilioClient(sender, env);
  const number = await client.incomingPhoneNumbers(phoneNumberSid).fetch();

  return updateOrganizationSmsSender(
    organizationId,
    {
      twilio_phone_number_sid: number.sid,
      phone_e164: number.phoneNumber,
      sender_status: deriveSenderStatusFromConfig({
        ...sender,
        twilio_phone_number_sid: number.sid,
        phone_e164: number.phoneNumber
      })
    },
    platformAdminId
  );
}

export async function createOrUpdateTwilioMessagingServiceForOrganization({
  organizationId,
  organizationName,
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  organizationName: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  const client = createScopedTwilioClient(sender, env);
  const webhookUrls = buildTwilioWebhookUrls(env);
  const friendlyName = getOrganizationFriendlyName(organizationName);

  let serviceSid = sender.twilio_messaging_service_sid;

  if (serviceSid && validateTwilioMessagingServiceSid(serviceSid)) {
    await client.messaging.v1.services(serviceSid).update({
      friendlyName,
      inboundRequestUrl: webhookUrls.inboundWebhookUrl ?? undefined,
      statusCallback: webhookUrls.statusCallbackUrl ?? undefined
    });
  } else {
    const created = await client.messaging.v1.services.create({
      friendlyName,
      inboundRequestUrl: webhookUrls.inboundWebhookUrl ?? undefined,
      statusCallback: webhookUrls.statusCallbackUrl ?? undefined
    });
    serviceSid = created.sid;
  }

  if (sender.twilio_phone_number_sid && serviceSid) {
    try {
      await client.messaging.v1
        .services(serviceSid)
        .phoneNumbers.create({ phoneNumberSid: sender.twilio_phone_number_sid });
    } catch {
      // Number may already be attached to the service.
    }
  }

  return updateOrganizationSmsSender(
    organizationId,
    {
      twilio_messaging_service_sid: serviceSid,
      inbound_webhook_url: webhookUrls.inboundWebhookUrl,
      status_callback_url: webhookUrls.statusCallbackUrl,
      stop_help_status: "active",
      sender_status: deriveSenderStatusFromConfig({
        ...sender,
        twilio_messaging_service_sid: serviceSid,
        inbound_webhook_url: webhookUrls.inboundWebhookUrl,
        status_callback_url: webhookUrls.statusCallbackUrl,
        stop_help_status: "active"
      })
    },
    platformAdminId
  );
}

export async function configureTwilioWebhooksForOrganization({
  organizationId,
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  const client = createScopedTwilioClient(sender, env);
  const webhookUrls = buildTwilioWebhookUrls(env);

  if (!webhookUrls.inboundWebhookUrl || !webhookUrls.statusCallbackUrl) {
    throw new Error("APP_BASE_URL must be configured to build webhook URLs.");
  }

  if (sender.twilio_messaging_service_sid) {
    await client.messaging.v1.services(sender.twilio_messaging_service_sid).update({
      inboundRequestUrl: webhookUrls.inboundWebhookUrl,
      statusCallback: webhookUrls.statusCallbackUrl
    });
  }

  if (sender.twilio_phone_number_sid) {
    await client.incomingPhoneNumbers(sender.twilio_phone_number_sid).update({
      smsUrl: webhookUrls.inboundWebhookUrl,
      smsMethod: "POST",
      statusCallback: webhookUrls.statusCallbackUrl,
      statusCallbackMethod: "POST"
    });
  }

  return updateOrganizationSmsSender(
    organizationId,
    {
      inbound_webhook_url: webhookUrls.inboundWebhookUrl,
      status_callback_url: webhookUrls.statusCallbackUrl,
      stop_help_status: "active",
      sender_status: deriveSenderStatusFromConfig({
        ...sender,
        inbound_webhook_url: webhookUrls.inboundWebhookUrl,
        status_callback_url: webhookUrls.statusCallbackUrl,
        stop_help_status: "active"
      })
    },
    platformAdminId
  );
}

export async function sendOrganizationTestSms({
  organizationId,
  testPhoneE164,
  testMessageBody = DEFAULT_ORGANIZATION_TEST_SMS_BODY,
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  testPhoneE164: string;
  testMessageBody?: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  if (!validateE164(testPhoneE164)) {
    throw new Error("Test phone number must be valid E.164.");
  }

  if (env.ALLOW_REAL_SMS_SENDS !== "true") {
    throw new Error("Real SMS sends are disabled.");
  }

  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender?.phone_e164 || !sender.twilio_messaging_service_sid) {
    throw new Error("Organization SMS sender is not ready for test sends.");
  }

  const client = createScopedTwilioClient(sender, env);
  const webhookUrls = buildTwilioWebhookUrls(env);
  const message = await client.messages.create({
    to: testPhoneE164,
    body: testMessageBody,
    messagingServiceSid: sender.twilio_messaging_service_sid,
    statusCallback: webhookUrls.statusCallbackUrl || undefined
  });
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const now = new Date().toISOString();
  const { data: smsMessage, error } = await supabase
    .from("sms_messages")
    .insert({
      organization_id: organizationId,
      message_type: "system",
      direction: "outbound",
      provider: "twilio",
      provider_message_id: message.sid,
      from_number: sender.phone_e164,
      to_number: testPhoneE164,
      body: testMessageBody,
      status: normalizeInitialTwilioStatus(message.status)
    })
    .select("id")
    .single();

  if (error || !smsMessage) {
    throw new Error(error?.message ?? "Test SMS persistence failed.");
  }

  await supabase.from("sms_setup_test_runs").insert({
    organization_id: organizationId,
    sender_id: sender.id,
    test_phone_e164: testPhoneE164,
    test_message_body: testMessageBody,
    status: "sent",
    outbound_sms_message_id: smsMessage.id,
    created_by_platform_admin_id: platformAdminId
  });

  return updateOrganizationSmsSender(
    organizationId,
    {
      last_test_sms_sent_at: now,
      sender_status: deriveSenderStatusFromConfig({
        ...sender,
        last_test_sms_sent_at: now
      })
    },
    platformAdminId
  );
}

export async function activateOrganizationSmsSender({
  organizationId,
  platformAdminId
}: {
  organizationId: string;
  platformAdminId: string;
}) {
  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  const now = new Date().toISOString();

  return updateOrganizationSmsSender(
    organizationId,
    {
      sender_status: "ready",
      activated_at: now,
      paused_at: null,
      blocked_at: null,
      last_error: null
    },
    platformAdminId
  );
}

export async function pauseOrganizationSmsSender({
  organizationId,
  platformAdminId
}: {
  organizationId: string;
  platformAdminId: string;
}) {
  return updateOrganizationSmsSender(
    organizationId,
    {
      sender_status: "paused",
      paused_at: new Date().toISOString()
    },
    platformAdminId
  );
}

export async function blockOrganizationSmsSender({
  organizationId,
  platformAdminId
}: {
  organizationId: string;
  platformAdminId: string;
}) {
  return updateOrganizationSmsSender(
    organizationId,
    {
      sender_status: "blocked",
      blocked_at: new Date().toISOString()
    },
    platformAdminId
  );
}
