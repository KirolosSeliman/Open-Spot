import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SmsProviderClient } from "@/lib/sms/provider";
import {
  generateConsentRequestSmsMessage,
  type SmsLanguage
} from "@/lib/sms/message-generator";

export const CONSENT_REQUEST_COOLDOWN_HOURS = 24;
export const CONSENT_REQUEST_MAX_ATTEMPTS = 3;

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type ConsentRequestStatus =
  | "pending"
  | "sent"
  | "accepted"
  | "declined"
  | "failed"
  | "expired";

export type ConsentRequestAttempt = {
  status: ConsentRequestStatus | string;
  created_at: string | null;
  sent_at: string | null;
};

export type ConsentRequestEligibilityInput = {
  consentStatus: "opted_in" | "needs_consent" | "opted_out" | string;
  phoneE164: string;
  deletedAt?: string | null;
  previousRequests: ConsentRequestAttempt[];
  now?: Date;
};

export type ConsentRequestSendResult =
  | {
      status: "sent" | "simulated";
      message: string;
      requestId: string;
    }
  | {
      status: "skipped";
      message: string;
      reason:
        | "not_needs_consent"
        | "opted_in"
        | "opted_out"
        | "invalid_phone"
        | "deleted"
        | "cooldown"
        | "max_attempts"
        | "sms_paused";
    }
  | {
      status: "failed";
      message: string;
      requestId: string | null;
    };

export function getCustomerFirstName(fullName: string | null | undefined) {
  return String(fullName ?? "").trim().split(/\s+/).filter(Boolean)[0] ?? null;
}

export function sanitizeSmsProviderError(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "SMS provider rejected the send.";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const withoutTwilioSecret = twilioToken
    ? rawMessage.replaceAll(twilioToken, "[redacted]")
    : rawMessage;

  return withoutTwilioSecret.replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]").slice(0, 180);
}

export function canSendConsentRequest({
  consentStatus,
  phoneE164,
  deletedAt,
  previousRequests,
  now = new Date()
}: ConsentRequestEligibilityInput):
  | { ok: true }
  | { ok: false; reason: Exclude<ConsentRequestSendResult, { status: "sent" | "simulated" | "failed" }>["reason"]; message: string } {
  if (deletedAt) {
    return {
      ok: false,
      reason: "deleted",
      message: "Client saved, but no consent request was sent because the client is deleted."
    };
  }

  if (consentStatus === "opted_in") {
    return {
      ok: false,
      reason: "opted_in",
      message: "Client saved, but no consent request was sent because the client is already opted in."
    };
  }

  if (consentStatus === "opted_out") {
    return {
      ok: false,
      reason: "opted_out",
      message: "Client saved, but no consent request was sent because the client is opted out."
    };
  }

  if (consentStatus !== "needs_consent") {
    return {
      ok: false,
      reason: "not_needs_consent",
      message: "Client saved, but no consent request was needed."
    };
  }

  if (!/^\+[1-9][0-9]{7,14}$/.test(phoneE164)) {
    return {
      ok: false,
      reason: "invalid_phone",
      message: "Client saved, but consent request SMS was not sent because the phone number is invalid."
    };
  }

  if (previousRequests.length >= CONSENT_REQUEST_MAX_ATTEMPTS) {
    return {
      ok: false,
      reason: "max_attempts",
      message: "Client saved, but consent request SMS was not sent because the maximum number of requests was reached."
    };
  }

  const cooldownMs = CONSENT_REQUEST_COOLDOWN_HOURS * 60 * 60 * 1000;
  const nowTime = now.getTime();
  const hasRecentRequest = previousRequests.some((request) => {
    const value = request.sent_at ?? request.created_at;
    const time = value ? new Date(value).getTime() : Number.NaN;

    return Number.isFinite(time) && nowTime - time < cooldownMs;
  });

  if (hasRecentRequest) {
    return {
      ok: false,
      reason: "cooldown",
      message: "Client saved, but consent request SMS was not sent because a recent request already exists."
    };
  }

  return { ok: true };
}

export async function sendConsentRequestSms({
  supabase,
  provider,
  organization,
  customer
}: {
  supabase: SupabaseServerClient;
  provider: SmsProviderClient;
  organization: {
    id: string;
    name: string;
    defaultLanguage: SmsLanguage;
  };
  customer: {
    id: string;
    fullName: string;
    phoneE164: string;
    preferredLanguage: SmsLanguage;
    consentStatus: "opted_in" | "needs_consent" | "opted_out";
    deletedAt?: string | null;
  };
}): Promise<ConsentRequestSendResult> {
  const { data: previousRequests, error: previousRequestsError } = await supabase
    .from("sms_consent_requests")
    .select("status, created_at, sent_at")
    .eq("organization_id", organization.id)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (previousRequestsError) {
    return {
      status: "failed",
      requestId: null,
      message: `Client saved, but consent request SMS failed: ${sanitizeSmsProviderError(previousRequestsError)}`
    };
  }

  const eligibility = canSendConsentRequest({
    consentStatus: customer.consentStatus,
    phoneE164: customer.phoneE164,
    deletedAt: customer.deletedAt,
    previousRequests: previousRequests ?? []
  });

  if (!eligibility.ok) {
    return {
      status: "skipped",
      reason: eligibility.reason,
      message: eligibility.message
    };
  }

  const language = customer.preferredLanguage ?? organization.defaultLanguage;
  const message = generateConsentRequestSmsMessage({
    businessName: organization.name,
    customerFirstName: getCustomerFirstName(customer.fullName),
    language
  });
  const now = new Date().toISOString();
  const { data: requestRow, error: requestError } = await supabase
    .from("sms_consent_requests")
    .insert({
      organization_id: organization.id,
      customer_id: customer.id,
      status: "pending",
      phone_e164: customer.phoneE164,
      language,
      message_body: message.body
    })
    .select("id")
    .single();

  if (requestError || !requestRow) {
    return {
      status: "failed",
      requestId: null,
      message: `Client saved, but consent request SMS failed: ${sanitizeSmsProviderError(requestError)}`
    };
  }

  try {
    const sendResult = await provider.sendSms({
      to: customer.phoneE164,
      body: message.body,
      metadata: {
        organizationId: organization.id,
        customerId: customer.id,
        consentRequestId: requestRow.id
      }
    });
    const { data: smsMessage, error: smsMessageError } = await supabase
      .from("sms_messages")
      .insert({
        organization_id: organization.id,
        customer_id: customer.id,
        message_type: "consent_request",
        direction: "outbound",
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        from_number: sendResult.fromNumber,
        to_number: customer.phoneE164,
        body: message.body,
        status: sendResult.status,
        created_at: now
      })
      .select("id")
      .single();

    if (smsMessageError || !smsMessage) {
      throw smsMessageError ?? new Error("Consent request SMS persistence failed.");
    }

    await supabase
      .from("sms_consent_requests")
      .update({
        status: "sent",
        outbound_sms_message_id: smsMessage.id,
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        sent_at: now
      })
      .eq("organization_id", organization.id)
      .eq("id", requestRow.id);

    await supabase.from("audit_logs").insert({
      organization_id: organization.id,
      action: "sms.consent_request.sent",
      entity_type: "customers",
      entity_id: customer.id,
      metadata: {
        consent_request_id: requestRow.id,
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        phone_last4: customer.phoneE164.slice(-4)
      }
    });

    return {
      status: sendResult.provider === "simulator" ? "simulated" : "sent",
      requestId: requestRow.id,
      message:
        sendResult.provider === "simulator"
          ? "Client added. Consent request simulated."
          : "Client added. Consent request SMS sent."
    };
  } catch (error) {
    const safeMessage = sanitizeSmsProviderError(error);

    await supabase
      .from("sms_consent_requests")
      .update({
        status: "failed",
        error_message: safeMessage
      })
      .eq("organization_id", organization.id)
      .eq("id", requestRow.id);

    return {
      status: "failed",
      requestId: requestRow.id,
      message: `Client added, but consent request SMS failed: ${safeMessage}`
    };
  }
}
