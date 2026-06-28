import { NextResponse } from "next/server";

import { touchOrganizationSmsSenderStatusCallback } from "@/lib/sms/organization-sender";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getMonotonicTwilioDeliveryStatus,
  normalizeTwilioDeliveryStatus,
  parseTwilioStatusRequest,
  validateTwilioWebhookRequest
} from "@/lib/sms/twilio";
import { recordSmsWebhookEvent } from "@/lib/sms/webhook-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.clone().text();
  const params = Object.fromEntries(new URLSearchParams(body));

  if (!validateTwilioWebhookRequest(request, params)) {
    await recordSmsWebhookEvent({
      provider: "twilio",
      event_type: "status_callback",
      processing_status: "invalid_signature",
      http_status: 401,
      error_message: "Invalid Twilio webhook signature."
    });

    return NextResponse.json(
      { error: "Invalid Twilio webhook signature." },
      { status: 401 }
    );
  }

  const status = await parseTwilioStatusRequest(request);
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    await recordSmsWebhookEvent({
      provider: "twilio",
      event_type: "status_callback",
      processing_status: "storage_unavailable",
      provider_message_id: status.providerMessageId,
      from_number: status.from,
      to_number: status.to,
      http_status: 503,
      payload_summary: {
        message_status: status.messageStatus
      }
    });

    return NextResponse.json(
      {
        status: "storage_unavailable",
        warning: "Supabase service role is not configured."
      },
      { status: 503 }
    );
  }

  if (!status.providerMessageId) {
    await recordSmsWebhookEvent({
      provider: "twilio",
      event_type: "status_callback",
      processing_status: "ignored",
      from_number: status.from,
      to_number: status.to,
      http_status: 202,
      error_message: "Twilio status callback did not include MessageSid or SmsSid.",
      payload_summary: {
        message_status: status.messageStatus
      }
    });

    return NextResponse.json(
      {
        status: "ignored",
        warning: "Twilio status callback did not include MessageSid or SmsSid."
      },
      { status: 202 }
    );
  }

  const { data: message, error: lookupError } = await supabase
    .from("sms_messages")
    .select("id, organization_id, status")
    .eq("provider", "twilio")
    .eq("provider_message_id", status.providerMessageId)
    .eq("direction", "outbound")
    .maybeSingle();

  if (lookupError) {
    await recordSmsWebhookEvent({
      provider: "twilio",
      event_type: "status_callback",
      processing_status: "error",
      provider_message_id: status.providerMessageId,
      from_number: status.from,
      to_number: status.to,
      http_status: 500,
      error_message: "Twilio status lookup failed.",
      payload_summary: {
        message_status: status.messageStatus
      }
    });

    return NextResponse.json(
      { error: "Twilio status lookup failed." },
      { status: 500 }
    );
  }

  if (!message) {
    await recordSmsWebhookEvent({
      provider: "twilio",
      event_type: "status_callback",
      processing_status: "status_unmatched",
      provider_message_id: status.providerMessageId,
      from_number: status.from,
      to_number: status.to,
      http_status: 202,
      error_code: status.errorCode,
      error_message: status.errorMessage,
      payload_summary: {
        message_status: status.messageStatus
      }
    });

    return NextResponse.json(
      {
        status: "received_unlinked",
        providerMessageId: status.providerMessageId
      },
      { status: 202 }
    );
  }

  const callbackStatus = normalizeTwilioDeliveryStatus(status.messageStatus);
  const deliveryStatus = getMonotonicTwilioDeliveryStatus({
    currentStatus: message.status,
    nextStatus: callbackStatus
  });
  const now = new Date().toISOString();
  const statusUpdate = {
    status: deliveryStatus,
    status_callback_received_at: now,
    provider_status_payload: {
      message_sid: status.providerMessageId,
      sms_sid: status.smsSid,
      account_sid: status.accountSid,
      messaging_service_sid: status.messagingServiceSid,
      message_status: status.messageStatus,
      error_code: status.errorCode,
      error_message: status.errorMessage,
      from: status.from,
      to: status.to
    },
    ...(status.errorCode ? { error_code: status.errorCode } : {}),
    ...(status.errorMessage ? { error_message: status.errorMessage } : {}),
    ...(callbackStatus === "delivered" ? { delivered_at: now } : {}),
    ...(callbackStatus === "failed" || callbackStatus === "undelivered"
      ? { failed_at: now }
      : {})
  };
  const { error: updateError } = await supabase
    .from("sms_messages")
    .update(statusUpdate)
    .eq("id", message.id)
    .eq("organization_id", message.organization_id);

  if (updateError) {
    await recordSmsWebhookEvent({
      provider: "twilio",
      event_type: "status_callback",
      processing_status: "error",
      organization_id: message.organization_id,
      sms_message_id: message.id,
      provider_message_id: status.providerMessageId,
      from_number: status.from,
      to_number: status.to,
      http_status: 500,
      error_message: "Twilio status update failed.",
      payload_summary: {
        message_status: status.messageStatus
      }
    });

    return NextResponse.json(
      { error: "Twilio status update failed." },
      { status: 500 }
    );
  }

  await touchOrganizationSmsSenderStatusCallback(message.organization_id);

  await supabase.from("audit_logs").insert({
    organization_id: message.organization_id,
    action: "sms.twilio_status.received",
    entity_type: "sms_messages",
    entity_id: message.id,
    metadata: {
      provider_message_id: status.providerMessageId,
      message_status: status.messageStatus,
      error_code: status.errorCode,
      error_message: status.errorMessage
    }
  });

  await recordSmsWebhookEvent({
    provider: "twilio",
    event_type: "status_callback",
    processing_status: "status_updated",
    organization_id: message.organization_id,
    sms_message_id: message.id,
    provider_message_id: status.providerMessageId,
    from_number: status.from,
    to_number: status.to,
    http_status: 200,
    error_code: status.errorCode,
    error_message: status.errorMessage,
    payload_summary: {
      message_status: status.messageStatus,
      delivery_status: deliveryStatus
    }
  });

  return NextResponse.json({
    status: "received_linked",
    providerMessageId: status.providerMessageId,
    messageId: message.id,
    deliveryStatus
  });
}
