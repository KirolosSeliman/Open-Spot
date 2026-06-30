import "server-only";

import { requireOrganizationSmsNotPaused } from "@/lib/admin/organization-controls";
import type { ActiveOrganization } from "@/lib/organization/current";
import { getOpeningSmsDateTimeLabels } from "@/lib/sms/message-generator";
import {
  getOrganizationSmsRuntimeProviderName,
  resolveOrganizationSmsFromNumber,
  sendOrganizationSms
} from "@/lib/sms/organization-sms";
import { resolveOpeningConfirmationSmsBody } from "@/lib/sms/organization-templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeProviderErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Provider rejected one SMS send.";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const withoutSecret = twilioToken
    ? rawMessage.replaceAll(twilioToken, "[redacted]")
    : rawMessage;

  return withoutSecret.slice(0, 180);
}

async function loadBusinessAddress(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("organization_onboarding_submissions")
    .select("business_address")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.business_address?.trim() ?? "";
}

async function hasExistingConfirmationSms(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  {
    organizationId,
    openingId,
    customerId
  }: {
    organizationId: string;
    openingId: string;
    customerId: string;
  }
) {
  const { data, error } = await supabase
    .from("sms_messages")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("opening_id", openingId)
    .eq("customer_id", customerId)
    .eq("message_type", "opening_confirmation")
    .eq("direction", "outbound")
    .in("status", [
      "accepted",
      "queued",
      "sending",
      "sent",
      "delivered",
      "submitted_to_provider",
      "simulated"
    ])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function sendOpeningConfirmationSmsAfterValidation({
  supabase,
  organization,
  openingId,
  offerId,
  bookingRequestId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organization: ActiveOrganization;
  openingId: string;
  offerId: string;
  bookingRequestId: string;
}): Promise<string | null> {
  try {
    await requireOrganizationSmsNotPaused(organization.id);

    const [openingResult, offerResult] = await Promise.all([
      supabase
        .from("openings")
        .select("id, title, service_id, start_time, end_time, status")
        .eq("organization_id", organization.id)
        .eq("id", openingId)
        .maybeSingle(),
      supabase
        .from("opening_offers")
        .select("id, customer_id, status")
        .eq("organization_id", organization.id)
        .eq("opening_id", openingId)
        .eq("id", offerId)
        .maybeSingle()
    ]);

    if (openingResult.error || !openingResult.data) {
      return (
        openingResult.error?.message ??
        "Client confirmé, mais le SMS de confirmation n'a pas pu être envoyé."
      );
    }

    if (offerResult.error || !offerResult.data) {
      return (
        offerResult.error?.message ??
        "Client confirmé, mais le SMS de confirmation n'a pas pu être envoyé."
      );
    }

    const opening = openingResult.data;
    const offer = offerResult.data;

    if (opening.status !== "filled" || offer.status !== "selected") {
      return "Client confirmé, mais le SMS de confirmation n'a pas été envoyé, car l'état sélectionné n'a pas pu être vérifié.";
    }

    if (
      await hasExistingConfirmationSms(supabase, {
        organizationId: organization.id,
        openingId,
        customerId: offer.customer_id
      })
    ) {
      return null;
    }

    const [customerResult, consentResult, serviceResult, businessAddress] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id, full_name, phone_e164, preferred_language, deleted_at")
          .eq("organization_id", organization.id)
          .eq("id", offer.customer_id)
          .maybeSingle(),
        supabase
          .from("sms_consents")
          .select("customer_id, status")
          .eq("organization_id", organization.id)
          .eq("customer_id", offer.customer_id)
          .maybeSingle(),
        opening.service_id
          ? supabase
              .from("services")
              .select("id, name")
              .eq("organization_id", organization.id)
              .eq("id", opening.service_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        loadBusinessAddress(supabase, organization.id)
      ]);

    if (customerResult.error || !customerResult.data) {
      return (
        customerResult.error?.message ??
        "Client confirmé, mais le SMS de confirmation n'a pas pu être envoyé."
      );
    }

    if (consentResult.error) {
      return consentResult.error.message;
    }

    if (serviceResult.error) {
      return serviceResult.error.message;
    }

    const customer = customerResult.data;

    if (customer.deleted_at) {
      return "Client confirmé, mais aucun SMS n'a été envoyé, car le client sélectionné est supprimé.";
    }

    if (consentResult.data?.status !== "opted_in") {
      return "Client confirmé, mais aucun SMS n'a été envoyé, car le consentement SMS n'est pas actif.";
    }

    if (!/^\+[1-9][0-9]{7,14}$/.test(customer.phone_e164)) {
      return "Client confirmé, mais le SMS de confirmation n'a pas pu être envoyé, car le numéro de téléphone est invalide.";
    }

    if (!businessAddress) {
      return "Client confirmé, mais le SMS de confirmation n'a pas été envoyé, car l'adresse du commerce est manquante.";
    }

    const language = customer.preferred_language ?? organization.defaultLanguage;
    const { dateLabel, timeLabel } = getOpeningSmsDateTimeLabels(
      opening.start_time,
      language,
      organization.timezone
    );
    const messageBody = await resolveOpeningConfirmationSmsBody(supabase, {
      organizationId: organization.id,
      language,
      context: {
        businessName: organization.name,
        serviceName: serviceResult.data?.name ?? opening.title,
        appointmentDate: dateLabel,
        appointmentTime: timeLabel,
        clientName: customer.full_name?.trim().split(/\s+/)[0] ?? null,
        businessAddress
      },
      fallbackInput: {
        businessName: organization.name,
        businessAddress,
        serviceName: serviceResult.data?.name ?? opening.title,
        startsAt: opening.start_time,
        endsAt: opening.end_time,
        customerFirstName: customer.full_name?.trim().split(/\s+/)[0] ?? null,
        language,
        timezone: organization.timezone,
        includeOptOut: true
      }
    });
    const outboundProvider = getOrganizationSmsRuntimeProviderName();
    const outboundFromNumber = await resolveOrganizationSmsFromNumber({
      organizationId: organization.id
    });
    const { data: pendingSmsMessage, error: pendingMessageError } = await supabase
      .from("sms_messages")
      .insert({
        organization_id: organization.id,
        customer_id: offer.customer_id,
        opening_id: openingId,
        message_type: "opening_confirmation",
        direction: "outbound",
        provider: outboundProvider,
        provider_message_id: null,
        from_number: outboundFromNumber,
        to_number: customer.phone_e164,
        body: messageBody,
        status: "pending_send"
      })
      .select("id")
      .single();

    if (pendingMessageError || !pendingSmsMessage) {
      return (
        pendingMessageError?.message ??
        "Client confirmé, mais le SMS de confirmation n'a pas pu être préparé."
      );
    }

    let sendResult;

    try {
      sendResult = await sendOrganizationSms({
        organizationId: organization.id,
        to: customer.phone_e164,
        body: messageBody,
        messageType: "opening_confirmation",
        openingId,
        customerId: offer.customer_id,
        consentStatus: "opted_in",
        metadata: {
          openingId,
          organizationId: organization.id,
          customerId: offer.customer_id,
          bookingRequestId
        }
      });
    } catch (error) {
      const safeError = getSafeProviderErrorMessage(error);

      await supabase
        .from("sms_messages")
        .update({
          status: "failed",
          error_message: safeError
        })
        .eq("organization_id", organization.id)
        .eq("id", pendingSmsMessage.id);

      return safeError;
    }

    const { data: smsMessage, error: messageError } = await supabase
      .from("sms_messages")
      .update({
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        from_number: sendResult.fromNumber,
        status: sendResult.status
      })
      .eq("organization_id", organization.id)
      .eq("id", pendingSmsMessage.id)
      .select("id")
      .single();

    if (messageError || !smsMessage) {
      return (
        messageError?.message ??
        "Client confirmé, mais le SMS de confirmation n'a pas pu être envoyé."
      );
    }

    const { error: auditError } = await supabase.rpc(
      "record_opening_confirmation_audit",
      {
        target_opening_id: openingId,
        target_offer_id: offerId,
        target_booking_request_id: bookingRequestId,
        target_sms_message_id: smsMessage.id,
        provider_name: sendResult.provider
      }
    );

    if (auditError) {
      console.warn("Opening confirmation SMS audit failed", {
        openingId,
        offerId,
        bookingRequestId,
        smsMessageId: smsMessage.id,
        error: auditError.message
      });
    }

    return null;
  } catch (error) {
    return getSafeProviderErrorMessage(error);
  }
}
