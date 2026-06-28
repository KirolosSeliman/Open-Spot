import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type {
  OrganizationSmsSenderRow,
  SafeOrganizationSmsSenderView
} from "@/lib/sms/organization-sender-types";
import {
  formatPhoneForDisplay,
  maskTwilioSid
} from "@/lib/sms/twilio-validation";

function mapSenderRow(row: Record<string, unknown>): OrganizationSmsSenderRow {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    provider: String(row.provider),
    sender_model: row.sender_model as OrganizationSmsSenderRow["sender_model"],
    twilio_subaccount_sid: (row.twilio_subaccount_sid as string | null) ?? null,
    twilio_subaccount_friendly_name:
      (row.twilio_subaccount_friendly_name as string | null) ?? null,
    twilio_subaccount_status: (row.twilio_subaccount_status as string | null) ?? null,
    twilio_messaging_service_sid:
      (row.twilio_messaging_service_sid as string | null) ?? null,
    twilio_phone_number_sid: (row.twilio_phone_number_sid as string | null) ?? null,
    phone_e164: (row.phone_e164 as string | null) ?? null,
    sender_status: row.sender_status as OrganizationSmsSenderRow["sender_status"],
    compliance_status:
      row.compliance_status as OrganizationSmsSenderRow["compliance_status"],
    consent_strategy: String(row.consent_strategy),
    stop_help_status: String(row.stop_help_status),
    inbound_webhook_url: (row.inbound_webhook_url as string | null) ?? null,
    status_callback_url: (row.status_callback_url as string | null) ?? null,
    last_synced_at: (row.last_synced_at as string | null) ?? null,
    last_test_sms_sent_at: (row.last_test_sms_sent_at as string | null) ?? null,
    last_inbound_test_at: (row.last_inbound_test_at as string | null) ?? null,
    last_status_callback_at: (row.last_status_callback_at as string | null) ?? null,
    activated_at: (row.activated_at as string | null) ?? null,
    paused_at: (row.paused_at as string | null) ?? null,
    blocked_at: (row.blocked_at as string | null) ?? null,
    last_error: (row.last_error as string | null) ?? null,
    provider_payload: (row.provider_payload as Record<string, unknown>) ?? {},
    created_by_platform_admin_id:
      (row.created_by_platform_admin_id as string | null) ?? null,
    updated_by_platform_admin_id:
      (row.updated_by_platform_admin_id as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at)
  };
}

function requireServiceClient() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  return supabase;
}

export async function loadOrganizationSmsSender(organizationId: string) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_sms_senders")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSenderRow(data) : null;
}

export async function loadOrganizationSmsSenderByPhoneE164(phoneE164: string) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_sms_senders")
    .select("*")
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSenderRow(data) : null;
}

export async function loadOrganizationSmsSenderByMessagingServiceSid(
  messagingServiceSid: string
) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_sms_senders")
    .select("*")
    .eq("twilio_messaging_service_sid", messagingServiceSid)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSenderRow(data) : null;
}

export async function loadOrganizationSmsSenderBySubaccountSid(subaccountSid: string) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_sms_senders")
    .select("*")
    .eq("twilio_subaccount_sid", subaccountSid)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSenderRow(data) : null;
}

export async function getOrCreateOrganizationSmsSender({
  organizationId,
  createdByPlatformAdminId
}: {
  organizationId: string;
  createdByPlatformAdminId?: string | null;
}) {
  const existing = await loadOrganizationSmsSender(organizationId);

  if (existing) {
    return existing;
  }

  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_sms_senders")
    .insert({
      organization_id: organizationId,
      created_by_platform_admin_id: createdByPlatformAdminId ?? null,
      updated_by_platform_admin_id: createdByPlatformAdminId ?? null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create organization SMS sender.");
  }

  return mapSenderRow(data);
}

export function toSafeOrganizationSmsSenderView(
  sender: OrganizationSmsSenderRow | null
): SafeOrganizationSmsSenderView | null {
  if (!sender) {
    return null;
  }

  const providerPayload = sender.provider_payload ?? {};
  const isTrialAccount = providerPayload.is_trial_account === true;
  const liveVerification =
    providerPayload.live_verification &&
    typeof providerPayload.live_verification === "object"
      ? (providerPayload.live_verification as {
          verifiedAt?: string;
          phoneOk?: boolean;
          inboundWebhookOk?: boolean;
          statusCallbackOk?: boolean;
          messagingServiceOk?: boolean;
        })
      : null;

  return {
    id: sender.id,
    organizationId: sender.organization_id,
    provider: sender.provider,
    senderModel: sender.sender_model,
    phoneE164: sender.phone_e164,
    phoneDisplay: formatPhoneForDisplay(sender.phone_e164),
    twilioSubaccountSidMasked: maskTwilioSid(sender.twilio_subaccount_sid),
    twilioMessagingServiceSidMasked: maskTwilioSid(sender.twilio_messaging_service_sid),
    twilioPhoneNumberSidMasked: maskTwilioSid(sender.twilio_phone_number_sid),
    senderStatus: sender.sender_status,
    complianceStatus: sender.compliance_status,
    consentStrategy: sender.consent_strategy,
    stopHelpStatus: sender.stop_help_status,
    inboundWebhookConfigured: Boolean(sender.inbound_webhook_url),
    statusCallbackConfigured: Boolean(sender.status_callback_url),
    inboundWebhookUrl: sender.inbound_webhook_url,
    statusCallbackUrl: sender.status_callback_url,
    lastSyncedAt: sender.last_synced_at,
    lastTestSmsSentAt: sender.last_test_sms_sent_at,
    lastInboundTestAt: sender.last_inbound_test_at,
    lastStatusCallbackAt: sender.last_status_callback_at,
    activatedAt: sender.activated_at,
    pausedAt: sender.paused_at,
    blockedAt: sender.blocked_at,
    lastError: sender.last_error,
    subaccountFriendlyName: sender.twilio_subaccount_friendly_name,
    subaccountStatus: sender.twilio_subaccount_status,
    isTrialAccount,
    livePhoneOk: liveVerification?.phoneOk ?? null,
    liveWebhookOk: liveVerification?.inboundWebhookOk ?? null,
    liveStatusCallbackOk: liveVerification?.statusCallbackOk ?? null,
    liveMessagingServiceOk: liveVerification?.messagingServiceOk ?? null,
    liveVerifiedAt: liveVerification?.verifiedAt ?? null
  };
}

export async function updateOrganizationSmsSender(
  organizationId: string,
  patch: Record<string, unknown>,
  updatedByPlatformAdminId?: string | null
) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_sms_senders")
    .update({
      ...patch,
      updated_by_platform_admin_id: updatedByPlatformAdminId ?? null
    })
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update organization SMS sender.");
  }

  return mapSenderRow(data);
}

export async function touchOrganizationSmsSenderStatusCallback(organizationId: string) {
  const supabase = requireServiceClient();
  const now = new Date().toISOString();

  await supabase
    .from("organization_sms_senders")
    .update({ last_status_callback_at: now })
    .eq("organization_id", organizationId);
}
