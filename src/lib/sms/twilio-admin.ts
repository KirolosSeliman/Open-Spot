import "server-only";

import {
  loadOrganizationSmsSender,
  loadOrganizationSmsSenderBySubaccountSid,
  updateOrganizationSmsSender
} from "@/lib/sms/organization-sender";
import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import {
  evaluateOrganizationSmsActivationReadiness
} from "@/lib/sms/organization-gate";
import { deriveSenderStatusFromConfig } from "@/lib/sms/sms-setup-readiness";
import { buildTwilioWebhookUrls } from "@/lib/sms/twilio-sender-config";
import { DEFAULT_ORGANIZATION_TEST_SMS_BODY } from "@/lib/sms/organization-sms-copy";
import {
  createParentTwilioClient,
  createScopedTwilioClient,
  getOrganizationFriendlyName,
  type TwilioEnv
} from "@/lib/sms/twilio-admin-client";
import { verifyTwilioLiveConfigurationForOrganization } from "@/lib/sms/twilio-live-verification";
import {
  assertTwilioPhoneNumberBelongsToSender,
  verifyStoredTwilioPhoneNumberForSender
} from "@/lib/sms/twilio-phone-verification";
import {
  getSafeTwilioErrorMessage,
  getSafeTwilioUiError,
  isTwilioDuplicateMessagingAttachError
} from "@/lib/sms/twilio-ui-errors";
import {
  validateE164,
  validateTwilioAccountSid,
  validateTwilioMessagingServiceSid
} from "@/lib/sms/twilio-validation";
import { normalizeInitialTwilioStatus } from "@/lib/sms/twilio";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export { createParentTwilioClient, createScopedTwilioClient, type TwilioEnv };

async function persistTwilioFailure({
  organizationId,
  platformAdminId,
  error,
  context
}: {
  organizationId: string;
  platformAdminId?: string | null;
  error: unknown;
  context?: {
    accountSid?: string | null;
    phoneNumberSid?: string | null;
  };
}) {
  const safe = getSafeTwilioUiError(error, context);

  await updateOrganizationSmsSender(
    organizationId,
    {
      last_error: safe.message.slice(0, 500)
    },
    platformAdminId ?? null
  );

  return safe;
}

async function ensureBillingRow(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("organization_billing_settings")
    .select("organization_id, billing_status, sms_status")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return data;
  }

  const { data: created, error: createError } = await supabase
    .from("organization_billing_settings")
    .insert({
      organization_id: organizationId,
      billing_status: "unpaid",
      sms_status: "inactive",
      plan_name: "Founder Pilot",
      base_plan_amount_cents: 14900,
      base_plan_currency: "CAD",
      billing_interval: "monthly",
      payment_method: "manual_external"
    })
    .select("organization_id, billing_status, sms_status")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message ?? "Unable to create billing record.");
  }

  return created;
}

function pickMessagingService(
  services: { sid: string; friendlyName: string }[],
  sender: OrganizationSmsSenderRow,
  organizationName: string
) {
  if (
    sender.twilio_messaging_service_sid &&
    services.some((service) => service.sid === sender.twilio_messaging_service_sid)
  ) {
    return services.find((service) => service.sid === sender.twilio_messaging_service_sid)!;
  }

  const expectedName = getOrganizationFriendlyName(organizationName);

  const byName = services.find((service) => service.friendlyName === expectedName);

  if (byName) {
    return byName;
  }

  if (services.length === 1) {
    return services[0];
  }

  return null;
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
    await persistTwilioFailure({ organizationId, platformAdminId, error });
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
    await persistTwilioFailure({
      organizationId,
      platformAdminId,
      error,
      context: { accountSid: subaccountSid }
    });
    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
}

export async function syncTwilioSubaccountForOrganization({
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

  if (!sender?.twilio_subaccount_sid) {
    throw new Error("No Twilio subaccount is linked to this organization.");
  }

  try {
    const parentClient = createParentTwilioClient(env);
    const account = await parentClient.api.accounts(sender.twilio_subaccount_sid).fetch();
    const scopedClient = createScopedTwilioClient(sender, env);
    const messagingServices = await scopedClient.messaging.v1.services.list({ limit: 20 });
    const messagingService = pickMessagingService(
      messagingServices.map((service) => ({
        sid: service.sid,
        friendlyName: service.friendlyName
      })),
      sender,
      organizationName
    );

    let twilioPhoneNumberSid = sender.twilio_phone_number_sid;
    let phoneE164 = sender.phone_e164;

    if (twilioPhoneNumberSid) {
      const verified = await verifyStoredTwilioPhoneNumberForSender({
        client: scopedClient,
        sender
      });

      if (!verified.ok) {
        twilioPhoneNumberSid = null;
        phoneE164 = null;
        await updateOrganizationSmsSender(
          organizationId,
          {
            twilio_phone_number_sid: null,
            phone_e164: null,
            last_error: verified.reason.slice(0, 500)
          },
          platformAdminId
        );
      } else {
        twilioPhoneNumberSid = verified.phone.sid;
        phoneE164 = verified.phone.phoneE164;
      }
    } else {
      const availableNumbers = (await scopedClient.incomingPhoneNumbers.list({ limit: 50 }))
        .filter((number) => number.capabilities?.sms)
        .map((number) => ({
          sid: number.sid,
          phoneE164: number.phoneNumber
        }));

      if (availableNumbers.length === 1) {
        twilioPhoneNumberSid = availableNumbers[0].sid;
        phoneE164 = availableNumbers[0].phoneE164;
      }
    }

    const webhookUrls = buildTwilioWebhookUrls(env);
    const liveVerification = await verifyTwilioLiveConfigurationForOrganization({
      organizationId,
      sender: {
        ...sender,
        twilio_messaging_service_sid:
          messagingService?.sid ?? sender.twilio_messaging_service_sid,
        twilio_phone_number_sid: twilioPhoneNumberSid,
        phone_e164: phoneE164
      },
      env
    });

    const nextSender = {
      twilio_subaccount_friendly_name: account.friendlyName,
      twilio_subaccount_status: account.status,
      twilio_messaging_service_sid:
        messagingService?.sid ?? sender.twilio_messaging_service_sid,
      twilio_phone_number_sid: twilioPhoneNumberSid,
      phone_e164: phoneE164,
      inbound_webhook_url: webhookUrls.inboundWebhookUrl,
      status_callback_url: webhookUrls.statusCallbackUrl,
      last_synced_at: new Date().toISOString(),
      last_error: liveVerification.issues.length > 0 ? liveVerification.issues[0] : null,
      provider_payload: {
        ...(sender.provider_payload ?? {}),
        is_trial_account: account.type === "Trial",
        messaging_service_count: messagingServices.length,
        live_verification: liveVerification
      }
    };

    return updateOrganizationSmsSender(
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
  } catch (error) {
    await persistTwilioFailure({
      organizationId,
      platformAdminId,
      error,
      context: {
        accountSid: sender.twilio_subaccount_sid,
        phoneNumberSid: sender.twilio_phone_number_sid
      }
    });
    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
}

export async function verifyTwilioConfigurationForOrganization({
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
  return syncTwilioSubaccountForOrganization({
    organizationId,
    organizationName,
    platformAdminId,
    env
  });
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
  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  const client = createScopedTwilioClient(sender, env);

  try {
    const verified = await assertTwilioPhoneNumberBelongsToSender({
      client,
      sender,
      phoneNumberSid
    });

    return updateOrganizationSmsSender(
      organizationId,
      {
        twilio_phone_number_sid: verified.sid,
        phone_e164: verified.phoneE164,
        last_error: null,
        last_synced_at: new Date().toISOString(),
        sender_status: deriveSenderStatusFromConfig({
          ...sender,
          twilio_phone_number_sid: verified.sid,
          phone_e164: verified.phoneE164
        })
      },
      platformAdminId
    );
  } catch (error) {
    await persistTwilioFailure({
      organizationId,
      platformAdminId,
      error,
      context: {
        accountSid: sender.twilio_subaccount_sid,
        phoneNumberSid
      }
    });
    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
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

  if (sender.twilio_phone_number_sid) {
    await assertTwilioPhoneNumberBelongsToSender({
      client,
      sender,
      phoneNumberSid: sender.twilio_phone_number_sid
    });
  }

  let serviceSid = sender.twilio_messaging_service_sid;

  try {
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
      } catch (error) {
        if (!isTwilioDuplicateMessagingAttachError(error)) {
          await persistTwilioFailure({
            organizationId,
            platformAdminId,
            error,
            context: {
              accountSid: sender.twilio_subaccount_sid,
              phoneNumberSid: sender.twilio_phone_number_sid
            }
          });
          throw new Error(getSafeTwilioErrorMessage(error, env));
        }
      }
    }

    return updateOrganizationSmsSender(
      organizationId,
      {
        twilio_messaging_service_sid: serviceSid,
        inbound_webhook_url: webhookUrls.inboundWebhookUrl,
        status_callback_url: webhookUrls.statusCallbackUrl,
        stop_help_status: "active",
        last_error: null,
        last_synced_at: new Date().toISOString(),
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
  } catch (error) {
    await persistTwilioFailure({
      organizationId,
      platformAdminId,
      error,
      context: {
        accountSid: sender.twilio_subaccount_sid,
        phoneNumberSid: sender.twilio_phone_number_sid
      }
    });
    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
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

  try {
    if (sender.twilio_phone_number_sid) {
      await assertTwilioPhoneNumberBelongsToSender({
        client,
        sender,
        phoneNumberSid: sender.twilio_phone_number_sid
      });
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

    const liveVerification = await verifyTwilioLiveConfigurationForOrganization({
      organizationId,
      sender: {
        ...sender,
        inbound_webhook_url: webhookUrls.inboundWebhookUrl,
        status_callback_url: webhookUrls.statusCallbackUrl
      },
      env
    });

    return updateOrganizationSmsSender(
      organizationId,
      {
        inbound_webhook_url: webhookUrls.inboundWebhookUrl,
        status_callback_url: webhookUrls.statusCallbackUrl,
        stop_help_status: liveVerification.inboundWebhookOk ? "active" : sender.stop_help_status,
        last_synced_at: new Date().toISOString(),
        last_error: liveVerification.issues[0] ?? null,
        provider_payload: {
          ...(sender.provider_payload ?? {}),
          live_verification: liveVerification
        },
        sender_status: deriveSenderStatusFromConfig({
          ...sender,
          inbound_webhook_url: webhookUrls.inboundWebhookUrl,
          status_callback_url: webhookUrls.statusCallbackUrl,
          stop_help_status: liveVerification.inboundWebhookOk ? "active" : sender.stop_help_status
        })
      },
      platformAdminId
    );
  } catch (error) {
    await persistTwilioFailure({
      organizationId,
      platformAdminId,
      error,
      context: {
        accountSid: sender.twilio_subaccount_sid,
        phoneNumberSid: sender.twilio_phone_number_sid
      }
    });
    throw new Error(getSafeTwilioErrorMessage(error, env));
  }
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

  if (sender.twilio_phone_number_sid) {
    const client = createScopedTwilioClient(sender, env);
    await assertTwilioPhoneNumberBelongsToSender({
      client,
      sender,
      phoneNumberSid: sender.twilio_phone_number_sid
    });
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
  platformAdminId,
  env = process.env
}: {
  organizationId: string;
  platformAdminId: string;
  env?: TwilioEnv;
}) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const sender = await loadOrganizationSmsSender(organizationId);

  if (!sender) {
    throw new Error("Organization SMS sender is not configured.");
  }

  const billing = await ensureBillingRow(supabase, organizationId);
  const activationReadiness = evaluateOrganizationSmsActivationReadiness({
    billingStatus: billing.billing_status,
    smsStatus: billing.sms_status
  });

  if (!activationReadiness.canActivateSms) {
    throw new Error(activationReadiness.blockingReasons.join(" · "));
  }

  const liveVerification = await verifyTwilioLiveConfigurationForOrganization({
    organizationId,
    sender,
    env
  });

  if (
    !liveVerification.phoneOk ||
    !liveVerification.messagingServiceOk ||
    !liveVerification.inboundWebhookOk ||
    !liveVerification.statusCallbackOk
  ) {
    throw new Error(liveVerification.issues[0] ?? "Configuration Twilio live invalide.");
  }

  const now = new Date().toISOString();
  const { error: billingError } = await supabase
    .from("organization_billing_settings")
    .update({ sms_status: "active" })
    .eq("organization_id", organizationId);

  if (billingError) {
    throw new Error(billingError.message);
  }

  return updateOrganizationSmsSender(
    organizationId,
    {
      sender_status: "ready",
      activated_at: now,
      paused_at: null,
      blocked_at: null,
      last_error: null,
      last_synced_at: now,
      provider_payload: {
        ...(sender.provider_payload ?? {}),
        live_verification: liveVerification
      }
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