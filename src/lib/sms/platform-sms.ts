import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getPlatformSmsConfigurationError,
  getSafePlatformSmsErrorMessage,
  sendPlatformTwilioSms
} from "@/lib/sms/platform-config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

export type PlatformSmsMessageType =
  | "book_call_confirmation"
  | "billing_payment_reminder";

export type PlatformSmsRecipientType = "prospect" | "business_contact";

export type SendPlatformSmsInput = {
  to: string;
  body: string;
  messageType: PlatformSmsMessageType;
  recipientType: PlatformSmsRecipientType;
  recipientName?: string | null;
  organizationId?: string | null;
  bookCallRequestId?: string | null;
  billingId?: string | null;
  sentByPlatformAdminId?: string | null;
  metadata?: Record<string, unknown>;
};

export type SendPlatformSmsResult =
  | {
      ok: true;
      messageId: string;
      provider: string;
      providerMessageId: string | null;
      status: string;
    }
  | {
      ok: false;
      error: string;
      messageId?: string;
    };

const successfulStatuses = new Set([
  "accepted",
  "queued",
  "sending",
  "sent",
  "delivered",
  "submitted_to_provider",
  "simulated"
]);

function requireServiceClient() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  return supabase;
}

function isE164Phone(value: string) {
  return /^\+[1-9][0-9]{7,14}$/.test(value);
}

async function hasExistingPlatformSms(
  supabase: SupabaseClient<Database>,
  {
    messageType,
    bookCallRequestId,
    organizationId,
    billingId,
    withinHours
  }: {
    messageType: PlatformSmsMessageType;
    bookCallRequestId?: string | null;
    organizationId?: string | null;
    billingId?: string | null;
    withinHours?: number;
  }
) {
  let query = supabase
    .from("platform_sms_messages")
    .select("id")
    .eq("message_type", messageType)
    .in("status", [...successfulStatuses])
    .limit(1);

  if (bookCallRequestId) {
    query = query.eq("book_call_request_id", bookCallRequestId);
  }

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  if (billingId) {
    query = query.eq("billing_id", billingId);
  }

  if (withinHours) {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", since);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function sendPlatformSms(
  input: SendPlatformSmsInput
): Promise<SendPlatformSmsResult> {
  const supabase = requireServiceClient();
  const configError = getPlatformSmsConfigurationError();

  if (!isE164Phone(input.to)) {
    return {
      ok: false,
      error: "Invalid destination phone number."
    };
  }

  if (configError) {
    return {
      ok: false,
      error: configError
    };
  }

  if (input.messageType === "book_call_confirmation" && input.bookCallRequestId) {
    if (
      await hasExistingPlatformSms(supabase, {
        messageType: input.messageType,
        bookCallRequestId: input.bookCallRequestId
      })
    ) {
      return {
        ok: true,
        messageId: "duplicate_skipped",
        provider: "platform",
        providerMessageId: null,
        status: "duplicate_skipped"
      };
    }
  }

  if (
    input.messageType === "billing_payment_reminder" &&
    input.organizationId &&
    input.billingId
  ) {
    if (
      await hasExistingPlatformSms(supabase, {
        messageType: input.messageType,
        organizationId: input.organizationId,
        billingId: input.billingId,
        withinHours: 24
      })
    ) {
      return {
        ok: false,
        error:
          "Un rappel de paiement a deja ete envoye pour cette facture dans les dernieres 24 heures."
      };
    }
  }

  try {
    const sendResult = await sendPlatformTwilioSms({
      to: input.to,
      body: input.body
    });

    const { data, error } = await supabase
      .from("platform_sms_messages")
      .insert({
        channel: "platform",
        message_type: input.messageType,
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        from_number: sendResult.fromNumber,
        to_number: input.to,
        body: input.body,
        status: sendResult.status,
        organization_id: input.organizationId ?? null,
        book_call_request_id: input.bookCallRequestId ?? null,
        billing_id: input.billingId ?? null,
        recipient_type: input.recipientType,
        recipient_name: input.recipientName ?? null,
        sent_by_platform_admin_id: input.sentByPlatformAdminId ?? null,
        metadata: (input.metadata ?? {}) as Database["public"]["Tables"]["platform_sms_messages"]["Insert"]["metadata"]
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: error?.message ?? "Platform SMS persistence failed."
      };
    }

    return {
      ok: true,
      messageId: data.id,
      provider: sendResult.provider,
      providerMessageId: sendResult.providerMessageId,
      status: sendResult.status
    };
  } catch (error) {
    const safeError = getSafePlatformSmsErrorMessage(error);

    await supabase.from("platform_sms_messages").insert({
      channel: "platform",
      message_type: input.messageType,
      provider: "twilio",
      from_number: "unknown",
      to_number: input.to,
      body: input.body,
      status: "failed",
      error_message: safeError,
      organization_id: input.organizationId ?? null,
      book_call_request_id: input.bookCallRequestId ?? null,
      billing_id: input.billingId ?? null,
      recipient_type: input.recipientType,
      recipient_name: input.recipientName ?? null,
      sent_by_platform_admin_id: input.sentByPlatformAdminId ?? null,
      metadata: (input.metadata ?? {}) as Database["public"]["Tables"]["platform_sms_messages"]["Insert"]["metadata"]
    });

    return {
      ok: false,
      error: safeError
    };
  }
}

export async function getLatestBillingPaymentReminderSentAt(
  organizationId: string,
  billingId: string
) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("platform_sms_messages")
    .select("created_at")
    .eq("organization_id", organizationId)
    .eq("billing_id", billingId)
    .eq("message_type", "billing_payment_reminder")
    .in("status", [...successfulStatuses])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.created_at ?? null;
}
