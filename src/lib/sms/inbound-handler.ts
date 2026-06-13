import { NextResponse } from "next/server";

import { normalizePhoneToE164 } from "@/lib/customers/phone";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { classifyInboundSmsBody } from "@/lib/sms/inbound";
import { createSmsProvider } from "@/lib/sms/factory";
import { getNextResponseRank } from "@/lib/sms/simulation";
import {
  buildSmsBodyPreview,
  recordSmsWebhookEvent
} from "@/lib/sms/webhook-events";
import {
  isSimulatorWebhookAllowed,
  SIMULATOR_WEBHOOK_SECRET_HEADER
} from "@/lib/sms/simulator";
import type { SmsProviderClient } from "@/lib/sms/provider";

type InboundContext = {
  id: string | null;
  organization_id: string | null;
  customer_id: string | null;
  opening_id: string | null;
  appointment_id: string | null;
  message_type: string | null;
};

function getInboundContextType(context: InboundContext | null) {
  if (context?.message_type === "consent_request") {
    return "consent" as const;
  }

  if (context?.appointment_id) {
    return "appointment" as const;
  }

  if (context?.opening_id) {
    return "waitlist" as const;
  }

  return "unknown" as const;
}

export async function handleInboundSmsRequest(
  request: Request,
  provider: SmsProviderClient = createSmsProvider()
) {
  const providerName = provider.getProviderName();

  if (
    !isSimulatorWebhookAllowed({
      providerName,
      requestSecret: request.headers.get(SIMULATOR_WEBHOOK_SECRET_HEADER)
    })
  ) {
    await recordSmsWebhookEvent({
      provider: providerName,
      event_type: providerName === "simulator" ? "simulator_inbound" : "inbound",
      processing_status: "invalid_signature",
      http_status: 401,
      error_message: "Simulator webhook is not authorized."
    });

    return NextResponse.json(
      { error: "Simulator webhook is not authorized." },
      { status: 401 }
    );
  }

  const verified = await provider.verifyWebhookSignature(request);

  if (!verified) {
    await recordSmsWebhookEvent({
      provider: providerName,
      event_type: providerName === "simulator" ? "simulator_inbound" : "inbound",
      processing_status: "invalid_signature",
      http_status: 401,
      error_message: "Invalid SMS webhook signature."
    });

    return NextResponse.json({ error: "Invalid SMS webhook signature." }, { status: 401 });
  }

  const inbound = await provider.parseInboundRequest(request);
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    const classification = classifyInboundSmsBody(inbound.body);

    await recordSmsWebhookEvent({
      provider: providerName,
      event_type: providerName === "simulator" ? "simulator_inbound" : "inbound",
      processing_status: "storage_unavailable",
      provider_message_id: inbound.providerMessageId ?? null,
      from_number: inbound.from,
      to_number: inbound.to,
      classification,
      http_status: 503,
      body_preview: inbound.body
    });

    return NextResponse.json(
      {
        classification,
        status: "storage_unavailable",
        warning: "Supabase service role is not configured."
      },
      { status: 503 }
    );
  }

  const normalizedFrom = normalizePhoneToE164(inbound.from);
  const fromNumber = normalizedFrom.ok ? normalizedFrom.phoneE164 : inbound.from;
  const normalizedTo = normalizePhoneToE164(inbound.to);
  const toNumber = normalizedTo.ok ? normalizedTo.phoneE164 : inbound.to;

  if (inbound.providerMessageId) {
    const { data: existingInbound, error: existingInboundError } = await supabase
      .from("sms_messages")
      .select("id, organization_id, customer_id, opening_id, appointment_id, message_type, body")
      .eq("provider", providerName)
      .eq("direction", "inbound")
      .eq("provider_message_id", inbound.providerMessageId)
      .maybeSingle();

    if (existingInboundError) {
      return NextResponse.json(
        { error: "Inbound idempotency lookup failed." },
        { status: 500 }
      );
    }

    if (existingInbound) {
      const existingClassification = classifyInboundSmsBody(
        existingInbound.body,
        existingInbound.message_type === "consent_reply"
          ? "consent"
          : existingInbound.appointment_id
            ? "appointment"
            : existingInbound.opening_id
              ? "waitlist"
              : "unknown"
      );
      const existingLinked =
        existingInbound.opening_id ||
        existingInbound.appointment_id ||
        existingInbound.message_type === "consent_reply";

      await recordSmsWebhookEvent({
        provider: providerName,
        event_type: providerName === "simulator" ? "simulator_inbound" : "inbound",
        processing_status:
          existingLinked
            ? "received_linked"
            : "received_unlinked",
        organization_id: existingInbound.organization_id,
        customer_id: existingInbound.customer_id,
        opening_id: existingInbound.opening_id,
        appointment_id: existingInbound.appointment_id,
        sms_message_id: existingInbound.id,
        provider_message_id: inbound.providerMessageId,
        from_number: fromNumber,
        to_number: toNumber,
        classification: existingClassification,
        body_preview: existingInbound.body,
        payload_summary: {
          idempotent: true
        }
      });

      return NextResponse.json({
        classification: existingClassification,
        status:
          existingLinked
            ? "received_linked"
            : "received_unlinked",
        idempotent: true,
        organizationId: existingInbound.organization_id,
        customerId: existingInbound.customer_id,
        openingId: existingInbound.opening_id,
        appointmentId: existingInbound.appointment_id,
        messageId: existingInbound.id
      });
    }
  }

  const { data: contextRows, error: contextError } = await supabase
    .from("sms_messages")
    .select("id, organization_id, customer_id, opening_id, appointment_id, message_type")
    .eq("provider", providerName)
    .eq("direction", "outbound")
    .eq("to_number", fromNumber)
    .eq("from_number", toNumber)
    .not("customer_id", "is", null)
    .or("opening_id.not.is.null,appointment_id.not.is.null,message_type.eq.consent_request")
    .order("created_at", { ascending: false })
    .limit(1);

  if (contextError) {
    return NextResponse.json(
      { error: "Inbound context lookup failed." },
      { status: 500 }
    );
  }

  const context = contextRows?.[0] ?? null;
  const contextType = getInboundContextType(context);
  const classification = classifyInboundSmsBody(inbound.body, contextType);

  if (!context?.organization_id || !context.customer_id) {
    await recordSmsWebhookEvent({
      provider: providerName,
      event_type: providerName === "simulator" ? "simulator_inbound" : "inbound",
      processing_status: "received_unlinked",
      provider_message_id: inbound.providerMessageId ?? null,
      from_number: fromNumber,
      to_number: toNumber,
      classification,
      http_status: 202,
      body_preview: buildSmsBodyPreview(inbound.body),
      payload_summary: {
        reason: "No prior outbound message context matched this sender."
      }
    });

    return NextResponse.json(
      {
        classification,
        status: "received_unlinked",
        warning: "No prior outbound message context matched this sender."
      },
      { status: 202 }
    );
  }

  const now = new Date().toISOString();
  const { data: inboundMessage, error: messageError } = await supabase
    .from("sms_messages")
    .insert({
      organization_id: context.organization_id,
      customer_id: context.customer_id,
      opening_id: context.opening_id,
      appointment_id: context.appointment_id,
      message_type: contextType === "consent" ? "consent_reply" : null,
      direction: "inbound",
      provider: providerName,
      provider_message_id: inbound.providerMessageId ?? null,
      from_number: fromNumber,
      to_number: toNumber,
      body: inbound.body,
      status: "received"
    })
    .select("id")
    .single();

  if (messageError || !inboundMessage) {
    await recordSmsWebhookEvent({
      provider: providerName,
      event_type: providerName === "simulator" ? "simulator_inbound" : "inbound",
      processing_status: "persistence_failed",
      organization_id: context.organization_id,
      customer_id: context.customer_id,
      opening_id: context.opening_id,
      appointment_id: context.appointment_id,
      provider_message_id: inbound.providerMessageId ?? null,
      from_number: fromNumber,
      to_number: toNumber,
      classification,
      http_status: 500,
      error_message: messageError?.message ?? "Inbound message persistence failed.",
      body_preview: inbound.body
    });

    return NextResponse.json(
      { error: "Inbound message persistence failed." },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: context.organization_id,
    action: "sms.inbound.linked",
    entity_type: "sms_messages",
    entity_id: inboundMessage.id,
    metadata: {
      customer_id: context.customer_id,
      opening_id: context.opening_id,
      appointment_id: context.appointment_id,
      classification
    }
  });

  const activeConsentRequest =
    contextType === "consent" && context.id
      ? await supabase
          .from("sms_consent_requests")
          .select("id, status")
          .eq("organization_id", context.organization_id)
          .eq("customer_id", context.customer_id)
          .eq("outbound_sms_message_id", context.id)
          .in("status", ["pending", "sent"])
          .maybeSingle()
      : { data: null, error: null };

  if (activeConsentRequest.error) {
    return NextResponse.json(
      { error: "Consent request lookup failed." },
      { status: 500 }
    );
  }

  const { data: linkedCustomer, error: linkedCustomerError } = await supabase
    .from("customers")
    .select("deleted_at")
    .eq("organization_id", context.organization_id)
    .eq("id", context.customer_id)
    .maybeSingle();

  if (linkedCustomerError) {
    return NextResponse.json(
      { error: "Linked customer lookup failed." },
      { status: 500 }
    );
  }

  const isDeletedCustomer = Boolean(linkedCustomer?.deleted_at);

  await recordSmsWebhookEvent({
    provider: providerName,
    event_type: providerName === "simulator" ? "simulator_inbound" : "inbound",
    processing_status: "received_linked",
    organization_id: context.organization_id,
    customer_id: context.customer_id,
    opening_id: context.opening_id,
    appointment_id: context.appointment_id,
    sms_message_id: inboundMessage.id,
    provider_message_id: inbound.providerMessageId ?? null,
    from_number: fromNumber,
    to_number: toNumber,
    classification,
    http_status: 200,
    body_preview: inbound.body
  });

  if (classification === "opt_out") {
    const { error: consentError } = await supabase
      .from("sms_consents")
      .upsert({
        organization_id: context.organization_id,
        customer_id: context.customer_id,
        phone_e164: fromNumber,
        status: "opted_out",
        source: "sms_opt_out_reply",
        consent_text: null,
        consented_at: null,
        unsubscribed_at: now
      }, {
        onConflict: "organization_id,customer_id"
      });

    if (consentError) {
      return NextResponse.json({ error: "Consent update failed." }, { status: 500 });
    }

    if (contextType === "consent" && activeConsentRequest.data) {
      await supabase
        .from("sms_consent_requests")
        .update({
          status: "declined",
          inbound_sms_message_id: inboundMessage.id,
          responded_at: now,
          declined_at: now
        })
        .eq("organization_id", context.organization_id)
        .eq("id", activeConsentRequest.data.id);
    }

    await supabase.from("audit_logs").insert({
      organization_id: context.organization_id,
      action: "sms.opt_out.received",
      entity_type: "sms_messages",
      entity_id: inboundMessage.id,
      metadata: {
        customer_id: context.customer_id,
        phone_e164: fromNumber
      }
    });

    return NextResponse.json({
      classification,
      status: "received_linked",
      action: contextType === "consent" ? "consent_opted_out" : "opted_out",
      organizationId: context.organization_id,
      customerId: context.customer_id,
      openingId: context.opening_id,
      appointmentId: context.appointment_id,
      messageId: inboundMessage.id
    });
  }

  if (isDeletedCustomer) {
    await supabase.from("audit_logs").insert({
      organization_id: context.organization_id,
      action: "sms.deleted_customer_reply_ignored",
      entity_type: "sms_messages",
      entity_id: inboundMessage.id,
      metadata: {
        customer_id: context.customer_id,
        opening_id: context.opening_id,
        appointment_id: context.appointment_id,
        classification
      }
    });

    return NextResponse.json({
      classification,
      status: "received_linked",
      action: "ignored_deleted_customer",
      organizationId: context.organization_id,
      customerId: context.customer_id,
      openingId: context.opening_id,
      appointmentId: context.appointment_id,
      messageId: inboundMessage.id
    });
  }

  if (contextType === "consent" && classification === "consent_opt_in") {
    const { error: consentError } = await supabase.from("sms_consents").upsert(
      {
        organization_id: context.organization_id,
        customer_id: context.customer_id,
        phone_e164: fromNumber,
        status: "opted_in",
        source: "sms_consent_request_reply",
        consent_text: inbound.body.trim().slice(0, 240),
        consented_at: now,
        unsubscribed_at: null
      },
      {
        onConflict: "organization_id,customer_id"
      }
    );

    if (consentError) {
      return NextResponse.json({ error: "Consent update failed." }, { status: 500 });
    }

    if (activeConsentRequest.data) {
      const { error: requestUpdateError } = await supabase
        .from("sms_consent_requests")
        .update({
          status: "accepted",
          inbound_sms_message_id: inboundMessage.id,
          responded_at: now,
          accepted_at: now
        })
        .eq("organization_id", context.organization_id)
        .eq("id", activeConsentRequest.data.id);

      if (requestUpdateError) {
        return NextResponse.json(
          { error: "Consent request update failed." },
          { status: 500 }
        );
      }
    }

    await supabase.from("audit_logs").insert({
      organization_id: context.organization_id,
      action: "sms.consent.opted_in_by_reply",
      entity_type: "customers",
      entity_id: context.customer_id,
      metadata: {
        consent_request_id: activeConsentRequest.data?.id ?? null,
        sms_message_id: inboundMessage.id,
        phone_last4: fromNumber.slice(-4)
      }
    });

    return NextResponse.json({
      classification,
      status: "received_linked",
      action: "consent_opted_in",
      organizationId: context.organization_id,
      customerId: context.customer_id,
      openingId: null,
      appointmentId: null,
      messageId: inboundMessage.id
    });
  }

  if (contextType === "consent" && classification === "consent_decline") {
    if (activeConsentRequest.data) {
      const { error: requestUpdateError } = await supabase
        .from("sms_consent_requests")
        .update({
          status: "declined",
          inbound_sms_message_id: inboundMessage.id,
          responded_at: now,
          declined_at: now
        })
        .eq("organization_id", context.organization_id)
        .eq("id", activeConsentRequest.data.id);

      if (requestUpdateError) {
        return NextResponse.json(
          { error: "Consent request update failed." },
          { status: 500 }
        );
      }
    }

    await supabase.from("audit_logs").insert({
      organization_id: context.organization_id,
      action: "sms.consent.declined_by_reply",
      entity_type: "customers",
      entity_id: context.customer_id,
      metadata: {
        consent_request_id: activeConsentRequest.data?.id ?? null,
        sms_message_id: inboundMessage.id,
        phone_last4: fromNumber.slice(-4)
      }
    });

    return NextResponse.json({
      classification,
      status: "received_linked",
      action: "consent_declined",
      organizationId: context.organization_id,
      customerId: context.customer_id,
      openingId: null,
      appointmentId: null,
      messageId: inboundMessage.id
    });
  }

  if (
    (classification === "appointment_confirm" ||
      classification === "appointment_cancel") &&
    context.appointment_id
  ) {
    const appointmentUpdate =
      classification === "appointment_confirm"
        ? {
            status: "scheduled",
            confirmation_status: "confirmed_by_client"
          }
        : {
            status: "cancelled",
            confirmation_status: "cancelled_by_client"
          };
    const eventType =
      classification === "appointment_confirm"
        ? "appointment.sms_confirmed"
        : "appointment.sms_cancelled";
    const { error: appointmentError } = await supabase
      .from("appointments")
      .update(appointmentUpdate)
      .eq("organization_id", context.organization_id)
      .eq("id", context.appointment_id);

    if (appointmentError) {
      return NextResponse.json({ error: "Appointment update failed." }, { status: 500 });
    }

    if (classification === "appointment_cancel") {
      await supabase
        .from("scheduled_messages")
        .update({ status: "cancelled" })
        .eq("organization_id", context.organization_id)
        .eq("appointment_id", context.appointment_id)
        .eq("status", "pending");
    }

    await supabase.from("appointment_events").insert({
      organization_id: context.organization_id,
      appointment_id: context.appointment_id,
      event_type: eventType,
      metadata: {
        customer_id: context.customer_id,
        sms_message_id: inboundMessage.id,
        raw_body: inbound.body
      }
    });

    await supabase.from("audit_logs").insert({
      organization_id: context.organization_id,
      action: eventType,
      entity_type: "appointments",
      entity_id: context.appointment_id,
      metadata: {
        customer_id: context.customer_id,
        sms_message_id: inboundMessage.id
      }
    });

    if (classification === "appointment_cancel") {
      await maybeCreateRecoveryOpeningFromAppointment({
        supabase,
        organizationId: context.organization_id,
        appointmentId: context.appointment_id,
        cancelledCustomerId: context.customer_id,
        smsMessageId: inboundMessage.id,
        now
      });
    }
  }

  if (classification === "waitlist_positive" && context.opening_id) {
    const { data: offer, error: offerError } = await supabase
      .from("opening_offers")
      .select("id, status")
      .eq("organization_id", context.organization_id)
      .eq("opening_id", context.opening_id)
      .eq("customer_id", context.customer_id)
      .maybeSingle();

    if (offerError) {
      return NextResponse.json({ error: "Opening offer lookup failed." }, { status: 500 });
    }

    if (offer) {
      const { data: ranks, error: ranksError } = await supabase
        .from("opening_offers")
        .select("response_rank")
        .eq("organization_id", context.organization_id)
        .eq("opening_id", context.opening_id)
        .not("response_rank", "is", null);

      if (ranksError) {
        return NextResponse.json({ error: "Response rank lookup failed." }, { status: 500 });
      }

      const rank = getNextResponseRank((ranks ?? []).map((row) => row.response_rank));
      const { error: offerUpdateError } = await supabase
        .from("opening_offers")
        .update({
          status: "responded",
          response_text: inbound.body.trim().slice(0, 240),
          response_rank: rank,
          responded_at: now
        })
        .eq("organization_id", context.organization_id)
        .eq("id", offer.id)
        .in("status", ["pending", "sent", "responded"]);

      if (offerUpdateError) {
        return NextResponse.json({ error: "Opening offer response update failed." }, { status: 500 });
      }

      const { data: existingRequest, error: requestLookupError } = await supabase
        .from("booking_requests")
        .select("id, status")
        .eq("organization_id", context.organization_id)
        .eq("opening_id", context.opening_id)
        .eq("customer_id", context.customer_id)
        .maybeSingle();

      if (requestLookupError) {
        return NextResponse.json(
          { error: "Booking request lookup failed." },
          { status: 500 }
        );
      }

      if (!existingRequest) {
        const { error: requestError } = await supabase
          .from("booking_requests")
          .insert({
            organization_id: context.organization_id,
            opening_id: context.opening_id,
            selected_offer_id: offer.id,
            customer_id: context.customer_id,
            status: "pending_merchant_validation"
          });

        if (requestError) {
          return NextResponse.json({ error: "Booking request creation failed." }, { status: 500 });
        }
      }

      await supabase
        .from("openings")
        .update({ status: "awaiting_validation" })
        .eq("organization_id", context.organization_id)
        .eq("id", context.opening_id);

      await supabase.from("audit_logs").insert({
        organization_id: context.organization_id,
        action: "sms.positive_reply.received",
        entity_type: "opening_offers",
        entity_id: offer.id,
        metadata: {
          customer_id: context.customer_id,
          opening_id: context.opening_id,
          sms_message_id: inboundMessage.id
        }
      });
    }
  }

  return NextResponse.json({
    classification,
    status: "received_linked",
    organizationId: context.organization_id,
    customerId: context.customer_id,
    openingId: context.opening_id,
    appointmentId: context.appointment_id,
    messageId: inboundMessage.id
  });
}

async function maybeCreateRecoveryOpeningFromAppointment({
  supabase,
  organizationId,
  appointmentId,
  cancelledCustomerId,
  smsMessageId,
  now
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  organizationId: string;
  appointmentId: string;
  cancelledCustomerId: string;
  smsMessageId: string;
  now: string;
}) {
  const { data: settings, error: settingsError } = await supabase
    .from("organization_settings")
    .select("auto_create_opening_on_sms_cancellation")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (settingsError || !settings?.auto_create_opening_on_sms_cancellation) {
    return;
  }

  const { data: existingOpening } = await supabase
    .from("openings")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("source_appointment_id", appointmentId)
    .maybeSingle();

  if (existingOpening) {
    return;
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, service_id, starts_at, ends_at")
    .eq("organization_id", organizationId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return;
  }

  if (new Date(appointment.starts_at) <= new Date(now)) {
    return;
  }

  const { data: service } = appointment.service_id
    ? await supabase
        .from("services")
        .select("id, name, normal_price_cents")
        .eq("organization_id", organizationId)
        .eq("id", appointment.service_id)
        .maybeSingle()
    : { data: null };

  const { data: opening, error: openingError } = await supabase
    .from("openings")
    .insert({
      organization_id: organizationId,
      service_id: appointment.service_id,
      title: service?.name
        ? `Annulation SMS - ${service.name}`
        : "Annulation SMS",
      start_time: appointment.starts_at,
      end_time: appointment.ends_at ?? appointment.starts_at,
      normal_price_cents: service?.normal_price_cents ?? null,
      discount_type: "none",
      discount_value: null,
      offer_label: null,
      status: "draft",
      expires_at: null,
      source: "appointment_cancellation",
      source_appointment_id: appointmentId
    })
    .select("id")
    .single();

  if (openingError || !opening) {
    return;
  }

  let waitlistQuery = supabase
    .from("waitlist_entries")
    .select("customer_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .neq("customer_id", cancelledCustomerId)
    .limit(50);

  if (appointment.service_id) {
    waitlistQuery = waitlistQuery.eq("service_id", appointment.service_id);
  }

  const { data: waitlistRows } = await waitlistQuery;
  const customerIds = [...new Set((waitlistRows ?? []).map((row) => row.customer_id))];

  if (customerIds.length > 0) {
    const { data: consents } = await supabase
      .from("sms_consents")
      .select("customer_id, status")
      .eq("organization_id", organizationId)
      .in("customer_id", customerIds);
    const optedInIds = new Set(
      (consents ?? [])
        .filter((consent) => consent.status === "opted_in")
        .map((consent) => consent.customer_id)
    );
    const offerRows = customerIds
      .filter((customerId) => optedInIds.has(customerId))
      .map((customerId) => ({
        organization_id: organizationId,
        opening_id: opening.id,
        customer_id: customerId,
        status: "pending" as const
      }));

    if (offerRows.length > 0) {
      await supabase.from("opening_offers").insert(offerRows);
    }
  }

  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    action: "opening.created_from_sms_cancellation",
    entity_type: "openings",
    entity_id: opening.id,
    metadata: {
      appointment_id: appointmentId,
      cancelled_customer_id: cancelledCustomerId,
      sms_message_id: smsMessageId
    }
  });
}
