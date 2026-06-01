import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  parseTwilioStatusRequest,
  validateTwilioWebhookRequest
} from "@/lib/sms/twilio";

export const runtime = "nodejs";

function mapTwilioDeliveryStatus(status: string) {
  const normalized = status.trim().toLowerCase();

  if (["delivered", "sent", "queued", "sending", "accepted"].includes(normalized)) {
    return normalized;
  }

  if (["failed", "undelivered"].includes(normalized)) {
    return normalized;
  }

  return normalized || "status_callback_received";
}

export async function POST(request: Request) {
  const body = await request.clone().text();
  const params = Object.fromEntries(new URLSearchParams(body));

  if (!validateTwilioWebhookRequest(request, params)) {
    return NextResponse.json(
      { error: "Invalid Twilio webhook signature." },
      { status: 401 }
    );
  }

  const status = await parseTwilioStatusRequest(request);
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      {
        status: "storage_unavailable",
        warning: "Supabase service role is not configured."
      },
      { status: 503 }
    );
  }

  if (!status.providerMessageId) {
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
    return NextResponse.json(
      { error: "Twilio status lookup failed." },
      { status: 500 }
    );
  }

  if (!message) {
    return NextResponse.json(
      {
        status: "received_unlinked",
        providerMessageId: status.providerMessageId
      },
      { status: 202 }
    );
  }

  const deliveryStatus = mapTwilioDeliveryStatus(status.messageStatus);
  const { error: updateError } = await supabase
    .from("sms_messages")
    .update({ status: deliveryStatus })
    .eq("id", message.id)
    .eq("organization_id", message.organization_id);

  if (updateError) {
    return NextResponse.json(
      { error: "Twilio status update failed." },
      { status: 500 }
    );
  }

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

  return NextResponse.json({
    status: "received_linked",
    providerMessageId: status.providerMessageId,
    messageId: message.id,
    deliveryStatus
  });
}
