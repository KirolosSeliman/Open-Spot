import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getOrganizationSmsRuntimeProviderName,
  resolveOrganizationSmsFromNumber,
  sendOrganizationSms
} from "@/lib/sms/organization-sms";
import { isOrganizationSmsPaused } from "@/lib/admin/organization-controls";
import type { Database } from "@/types/database";

type ScheduledMessageRow =
  Database["public"]["Tables"]["scheduled_messages"]["Row"];
type SmsConsentStatus = Database["public"]["Enums"]["sms_consent_status"];

export type ScheduledMessageProcessSummary = {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  alreadyClaimed: number;
};

export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  cronSecret: string | undefined
) {
  if (!cronSecret) {
    return false;
  }

  return authorizationHeader === `Bearer ${cronSecret}`;
}

export function getScheduledMessageSkipReason({
  phoneE164,
  consentStatus,
  deletedAt,
  appointmentStatus
}: {
  phoneE164: string | null | undefined;
  consentStatus: SmsConsentStatus | "missing";
  deletedAt?: string | null;
  appointmentStatus?: string | null;
}) {
  if (deletedAt) {
    return "Customer is deleted and cannot receive scheduled SMS.";
  }

  if (consentStatus !== "opted_in") {
    return "Customer is not currently opted in.";
  }

  if (!phoneE164 || !/^\+[1-9][0-9]{7,14}$/.test(phoneE164)) {
    return "Customer phone is not valid E.164.";
  }

  if (
    appointmentStatus &&
    appointmentStatus !== "scheduled" &&
    appointmentStatus !== "confirmed"
  ) {
    return "Appointment is not eligible for reminder delivery.";
  }

  return null;
}

function fillTemplate(
  template: string,
  values: {
    firstName: string;
    businessName: string;
    serviceName: string;
    time: string;
  }
) {
  return template
    .replaceAll("{firstName}", values.firstName)
    .replaceAll("{businessName}", values.businessName)
    .replaceAll("{serviceName}", values.serviceName)
    .replaceAll("{time}", values.time);
}

function defaultSummary(): ScheduledMessageProcessSummary {
  return {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    alreadyClaimed: 0
  };
}

export async function processDueScheduledMessages({
  supabase,
  now = new Date(),
  batchSize = 25
}: {
  supabase: SupabaseClient<Database>;
  now?: Date;
  batchSize?: number;
}): Promise<ScheduledMessageProcessSummary> {
  const summary = defaultSummary();
  const { data: dueMessages, error } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(error.message);
  }

  for (const message of dueMessages ?? []) {
    summary.processed += 1;
    await processOneScheduledMessage({
      supabase,
      message,
      now,
      summary
    });
  }

  return summary;
}

async function processOneScheduledMessage({
  supabase,
  message,
  now,
  summary
}: {
  supabase: SupabaseClient<Database>;
  message: ScheduledMessageRow;
  now: Date;
  summary: ScheduledMessageProcessSummary;
}) {
  const { data: claimed, error: claimError } = await supabase
    .from("scheduled_messages")
    .update({ status: "processing" })
    .eq("id", message.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimError) {
    summary.failed += 1;
    return;
  }

  if (!claimed) {
    summary.alreadyClaimed += 1;
    return;
  }

  try {
    const [customerResult, consentResult, appointmentResult, organizationResult] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id, full_name, phone_e164, preferred_language, deleted_at")
          .eq("organization_id", claimed.organization_id)
          .eq("id", claimed.customer_id)
          .single(),
        supabase
          .from("sms_consents")
          .select("status")
          .eq("organization_id", claimed.organization_id)
          .eq("customer_id", claimed.customer_id)
          .maybeSingle(),
        claimed.appointment_id
          ? supabase
              .from("appointments")
              .select("id, starts_at, status, service_id")
              .eq("organization_id", claimed.organization_id)
              .eq("id", claimed.appointment_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("organizations")
          .select("id, name")
          .eq("id", claimed.organization_id)
          .single()
      ]);

    if (customerResult.error || !customerResult.data) {
      throw new Error(customerResult.error?.message ?? "Customer not found.");
    }

    if (consentResult.error) {
      throw new Error(consentResult.error.message);
    }

    if (appointmentResult.error) {
      throw new Error(appointmentResult.error.message);
    }

    if (organizationResult.error || !organizationResult.data) {
      throw new Error(
        organizationResult.error?.message ?? "Organization not found."
      );
    }

    const customer = customerResult.data;
    const appointment = appointmentResult.data;
    const organizationSmsPaused = await isOrganizationSmsPaused(
      claimed.organization_id
    );

    if (organizationSmsPaused) {
      await markMessageSkipped({
        supabase,
        message: claimed,
        reason: "SMS sending is paused for this organization by platform admin."
      });
      summary.skipped += 1;
      return;
    }

    const skipReason = getScheduledMessageSkipReason({
      phoneE164: customer.phone_e164,
      consentStatus: consentResult.data?.status ?? "missing",
      deletedAt: customer.deleted_at,
      appointmentStatus: appointment?.status ?? null
    });

    if (skipReason) {
      await markMessageSkipped({
        supabase,
        message: claimed,
        reason: skipReason
      });
      summary.skipped += 1;
      return;
    }

    const serviceResult = appointment?.service_id
      ? await supabase
          .from("services")
          .select("name")
          .eq("organization_id", claimed.organization_id)
          .eq("id", appointment.service_id)
          .maybeSingle()
      : { data: null, error: null };

    if (serviceResult.error) {
      throw new Error(serviceResult.error.message);
    }

    const templateResult = await supabase
      .from("sms_templates")
      .select("organization_id, body")
      .eq("template_key", claimed.template_key)
      .eq("language", customer.preferred_language)
      .eq("is_active", true)
      .or(`organization_id.is.null,organization_id.eq.${claimed.organization_id}`)
      .limit(2);

    if (templateResult.error) {
      throw new Error(templateResult.error.message);
    }

    const template =
      templateResult.data?.find(
        (candidate) => candidate.organization_id === claimed.organization_id
      ) ?? templateResult.data?.[0];

    if (!template && !claimed.body_snapshot) {
      throw new Error("No active SMS template is available.");
    }

    const body =
      claimed.body_snapshot ??
      fillTemplate(template?.body ?? "", {
        firstName: customer.full_name.trim().split(/\s+/)[0] ?? "",
        businessName: organizationResult.data.name,
        serviceName: serviceResult.data?.name ?? "votre rendez-vous",
        time: appointment?.starts_at
          ? new Intl.DateTimeFormat(
              customer.preferred_language === "fr" ? "fr-CA" : "en-CA",
              {
                dateStyle: "medium",
                timeStyle: "short"
              }
            ).format(new Date(appointment.starts_at))
          : ""
      });

    const messageType = claimed.appointment_id
      ? "appointment_reminder"
      : claimed.opening_id
        ? "opening_alert"
        : "system";
    const outboundProvider = getOrganizationSmsRuntimeProviderName();
    const outboundFromNumber = await resolveOrganizationSmsFromNumber({
      organizationId: claimed.organization_id
    });
    const { data: pendingSmsMessage, error: pendingSmsMessageError } = await supabase
      .from("sms_messages")
      .insert({
      organization_id: claimed.organization_id,
      customer_id: claimed.customer_id,
      opening_id: claimed.opening_id,
      appointment_id: claimed.appointment_id,
      message_type: messageType,
      direction: "outbound",
      provider: outboundProvider,
      provider_message_id: null,
      from_number: outboundFromNumber,
      to_number: customer.phone_e164,
      body,
      status: "pending_send"
      })
      .select("id")
      .single();

    if (pendingSmsMessageError || !pendingSmsMessage) {
      throw (
        pendingSmsMessageError ??
        new Error("Scheduled SMS outbox persistence failed.")
      );
    }

    let sendResult;

    try {
      sendResult = await sendOrganizationSms({
        organizationId: claimed.organization_id,
        to: customer.phone_e164,
        body,
        messageType,
        openingId: claimed.opening_id,
        appointmentId: claimed.appointment_id,
        customerId: claimed.customer_id,
        consentStatus: "opted_in",
        metadata: {
          scheduledMessageId: claimed.id,
          organizationId: claimed.organization_id
        }
      });
    } catch (error) {
      await supabase
        .from("sms_messages")
        .update({
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Scheduled SMS send failed."
        })
        .eq("organization_id", claimed.organization_id)
        .eq("id", pendingSmsMessage.id);

      throw error;
    }

    await supabase
      .from("sms_messages")
      .update({
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        from_number: sendResult.fromNumber,
        status: sendResult.status
      })
      .eq("organization_id", claimed.organization_id)
      .eq("id", pendingSmsMessage.id);

    await supabase
      .from("scheduled_messages")
      .update({
        status: "sent",
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        body_snapshot: body,
        sent_at: now.toISOString()
      })
      .eq("id", claimed.id);

    if (claimed.appointment_id) {
      await supabase
        .from("appointments")
        .update({ reminder_status: "sent" })
        .eq("organization_id", claimed.organization_id)
        .eq("id", claimed.appointment_id);
    }

    summary.sent += 1;
  } catch (error) {
    await supabase
      .from("scheduled_messages")
      .update({
        status: "failed",
        failed_at: now.toISOString(),
        error_message:
          error instanceof Error ? error.message : "Scheduled message failed."
      })
      .eq("id", message.id);
    summary.failed += 1;
  }
}

async function markMessageSkipped({
  supabase,
  message,
  reason
}: {
  supabase: SupabaseClient<Database>;
  message: ScheduledMessageRow;
  reason: string;
}) {
  await supabase
    .from("scheduled_messages")
    .update({
      status: "skipped",
      error_message: reason
    })
    .eq("id", message.id);

  if (message.appointment_id) {
    await supabase
      .from("appointments")
      .update({ reminder_status: "skipped" })
      .eq("organization_id", message.organization_id)
      .eq("id", message.appointment_id);
  }
}
