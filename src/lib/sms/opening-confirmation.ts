import "server-only";

import { requireOrganizationSmsNotPaused } from "@/lib/admin/organization-controls";
import type { ActiveOrganization } from "@/lib/organization/current";
import { createSmsProvider } from "@/lib/sms/factory";
import { generateOpeningConfirmationSmsMessage } from "@/lib/sms/message-generator";
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

    const provider = createSmsProvider();
    const message = generateOpeningConfirmationSmsMessage({
      businessName: organization.name,
      businessAddress,
      serviceName: serviceResult.data?.name ?? opening.title,
      startsAt: opening.start_time,
      endsAt: opening.end_time,
      customerFirstName: customer.full_name?.trim().split(/\s+/)[0] ?? null,
      language: customer.preferred_language ?? organization.defaultLanguage,
      timezone: organization.timezone,
      includeOptOut: true
    });
    const sendResult = await provider.sendSms({
      to: customer.phone_e164,
      body: message.body,
      metadata: {
        openingId,
        organizationId: organization.id,
        customerId: offer.customer_id,
        bookingRequestId
      }
    });
    const { data: smsMessage, error: messageError } = await supabase
      .from("sms_messages")
      .insert({
        organization_id: organization.id,
        customer_id: offer.customer_id,
        opening_id: openingId,
        message_type: "opening_confirmation",
        direction: "outbound",
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        from_number: sendResult.fromNumber,
        to_number: customer.phone_e164,
        body: message.body,
        status: sendResult.status
      })
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
