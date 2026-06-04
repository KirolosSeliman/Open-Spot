"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildAppointmentCreateInput,
  buildAppointmentUpdateInput,
  buildCustomerCreateInput,
  buildServiceCreateInput,
  buildServiceUpdateInput,
  buildWaitlistCreateInput
} from "@/lib/dashboard/forms";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import {
  canManageCustomers,
  canManageAppointments,
  canManageServices,
  canValidateBookings
} from "@/lib/organization/permissions";
import { calculateCommissionEstimate } from "@/lib/openings/commission";
import { filterEligibleOpeningRecipients } from "@/lib/openings/eligibility";
import { buildOpeningCreateInput } from "@/lib/openings/forms";
import { createSmsProvider } from "@/lib/sms/factory";
import { generateOpeningSmsMessage } from "@/lib/sms/message-generator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireReadyOrganization({
  canPerform,
  deniedMessage = "You do not have permission to perform this action."
}: {
  canPerform?: (role: "owner" | "manager" | "staff") => boolean;
  deniedMessage?: string;
} = {}) {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    throw new Error("Supabase must be configured before writing dashboard data.");
  }

  if (canPerform && !canPerform(workspace.organization.role)) {
    throw new Error(deniedMessage);
  }

  return workspace.organization;
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function getSafeProviderErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Provider rejected one SMS send.";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const withoutSecret = twilioToken
    ? rawMessage.replaceAll(twilioToken, "[redacted]")
    : rawMessage;

  return withoutSecret.slice(0, 180);
}

function revalidateServiceSurfaces(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/waitlist");
  revalidatePath(`/b/${slug}/waitlist`);
  revalidatePath(`/b/${slug}/waitlist/kiosk`);
}

function revalidateAppointmentSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
}

async function verifyAppointmentReferences({
  supabase,
  organizationId,
  customerId,
  serviceId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  customerId: string;
  serviceId: string | null;
}) {
  const [customerResult, serviceResult, consentResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", customerId)
      .single(),
    serviceId
      ? supabase
          .from("services")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("id", serviceId)
          .eq("active", true)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("sms_consents")
      .select("status")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .maybeSingle()
  ]);

  if (customerResult.error || !customerResult.data) {
    throw new Error(
      customerResult.error?.message ?? "Client not found for this organization."
    );
  }

  if (serviceResult.error) {
    throw new Error(serviceResult.error.message);
  }

  if (serviceId && !serviceResult.data) {
    throw new Error("Selected service is not available for this organization.");
  }

  if (consentResult.error) {
    throw new Error(consentResult.error.message);
  }

  return {
    consent: consentResult.data
  };
}

async function maybeScheduleAppointmentReminder({
  supabase,
  organizationId,
  customerId,
  appointmentId,
  startsAt,
  sendReminder,
  consentStatus
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  customerId: string;
  appointmentId: string;
  startsAt: string;
  sendReminder: boolean;
  consentStatus: string | undefined;
}) {
  const { data: settings, error: settingsError } = await supabase
    .from("organization_settings")
    .select("appointment_reminders_enabled, default_reminder_delay_hours")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (
    !sendReminder ||
    !settings?.appointment_reminders_enabled ||
    consentStatus !== "opted_in"
  ) {
    return;
  }

  const scheduledFor = new Date(startsAt);
  scheduledFor.setHours(
    scheduledFor.getHours() - settings.default_reminder_delay_hours
  );

  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("Appointment reminder time could not be calculated.");
  }

  const { error } = await supabase.from("scheduled_messages").insert({
    organization_id: organizationId,
    customer_id: customerId,
    appointment_id: appointmentId,
    message_type: "appointment_reminder_24h",
    channel: "sms",
    scheduled_for: scheduledFor.toISOString(),
    status: "pending",
    template_key: "appointment_reminder_24h"
  });

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
}

async function cancelPendingAppointmentReminders({
  supabase,
  organizationId,
  appointmentId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  appointmentId: string;
}) {
  const { error } = await supabase
    .from("scheduled_messages")
    .update({ status: "cancelled" })
    .eq("organization_id", organizationId)
    .eq("appointment_id", appointmentId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}

function deriveAppointmentConfirmationStatus({
  status,
  requestConfirmation
}: {
  status: "scheduled" | "cancelled" | "not_yet_confirmed";
  requestConfirmation: boolean;
}) {
  if (!requestConfirmation) {
    return "no_response" as const;
  }

  if (status === "not_yet_confirmed") {
    return "pending" as const;
  }

  if (status === "cancelled") {
    return "cancelled_by_client" as const;
  }

  return "confirmed_by_client" as const;
}

export async function createServiceAction(formData: FormData) {
  const input = buildServiceCreateInput({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    normalPrice: formData.get("normalPrice"),
    active: formData.get("active")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/services", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageServices
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").insert({
    organization_id: organization.id,
    name: input.value.name,
    description: input.value.description,
    duration_minutes: input.value.durationMinutes,
    normal_price_cents: input.value.normalPriceCents,
    active: input.value.active
  });

  if (error) {
    redirectWithError("/dashboard/services", error.message);
  }

  revalidateServiceSurfaces(organization.slug);
  redirect("/dashboard/services");
}

export async function updateServiceAction(formData: FormData) {
  const input = buildServiceUpdateInput({
    serviceId: formData.get("serviceId"),
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    normalPrice: formData.get("normalPrice"),
    active: formData.get("active")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/services", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageServices
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: input.value.name,
      description: input.value.description,
      duration_minutes: input.value.durationMinutes,
      normal_price_cents: input.value.normalPriceCents,
      active: input.value.active
    })
    .eq("organization_id", organization.id)
    .eq("id", input.value.serviceId);

  if (error) {
    redirectWithError("/dashboard/services", error.message);
  }

  revalidateServiceSurfaces(organization.slug);
  redirect("/dashboard/services");
}

export async function toggleServiceActiveAction(formData: FormData) {
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const active = formData.get("active") === "true";

  if (!serviceId) {
    redirectWithError("/dashboard/services", "Service id is required.");
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageServices
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({ active })
    .eq("organization_id", organization.id)
    .eq("id", serviceId);

  if (error) {
    redirectWithError("/dashboard/services", error.message);
  }

  revalidateServiceSurfaces(organization.slug);
  redirect("/dashboard/services");
}

export async function createCustomerAction(formData: FormData) {
  const input = buildCustomerCreateInput({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    phoneCountry: formData.get("phoneCountry"),
    phoneNational: formData.get("phoneNational"),
    email: formData.get("email"),
    preferredLanguage: formData.get("preferredLanguage"),
    notes: formData.get("notes"),
    consentStatus: formData.get("consentStatus"),
    hasConsentProof: formData.get("hasConsentProof"),
    serviceId: formData.get("serviceId"),
    addToWaitlist: formData.get("addToWaitlist")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/clients", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();
  const { data: existingCustomer, error: existingCustomerError } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("phone_e164", input.value.phoneE164)
    .maybeSingle();

  if (existingCustomerError) {
    redirectWithError("/dashboard/clients", existingCustomerError.message);
  }

  if (existingCustomer) {
    redirectWithError(
      "/dashboard/clients",
      "A client with this phone number already exists. Edit the existing client instead of creating a new one."
    );
  }

  const customerWrite = await supabase
    .from("customers")
    .insert({
      organization_id: organization.id,
      full_name: input.value.fullName,
      phone_e164: input.value.phoneE164,
      email: input.value.email,
      preferred_language: input.value.preferredLanguage,
      notes: input.value.notes,
      source: "manual"
    })
    .select("id")
    .single();

  const { data: customer, error: customerError } = customerWrite;

  if (customerError || !customer) {
    redirectWithError(
      "/dashboard/clients",
      customerError?.message ?? "Client creation failed."
    );
  }

  const now = new Date().toISOString();
  const { error: consentError } = await supabase.from("sms_consents").upsert(
    {
      organization_id: organization.id,
      customer_id: customer.id,
      phone_e164: input.value.phoneE164,
      status: input.value.consentStatus,
      source: "dashboard_manual",
      consent_text:
        input.value.consentStatus === "opted_in"
          ? "Manual merchant confirmation of SMS consent."
          : null,
      consented_at: input.value.consentStatus === "opted_in" ? now : null,
      unsubscribed_at: input.value.consentStatus === "opted_out" ? now : null
    },
    {
      onConflict: "organization_id,customer_id"
    }
  );

  if (consentError) {
    redirectWithError("/dashboard/clients", consentError.message);
  }

  if (input.value.addToWaitlist) {
    const waitlistQuery = supabase
      .from("waitlist_entries")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("customer_id", customer.id);
    const scopedWaitlistQuery = input.value.serviceId
      ? waitlistQuery.eq("service_id", input.value.serviceId)
      : waitlistQuery.is("service_id", null);
    const { data: existingWaitlist, error: existingWaitlistError } =
      await scopedWaitlistQuery.maybeSingle();

    if (existingWaitlistError) {
      redirectWithError("/dashboard/clients", existingWaitlistError.message);
    }

    if (!existingWaitlist) {
      const { error: waitlistError } = await supabase
        .from("waitlist_entries")
        .insert({
          organization_id: organization.id,
          customer_id: customer.id,
          service_id: input.value.serviceId,
          status: "active",
          source: "manual"
        });

      if (waitlistError) {
        redirectWithError("/dashboard/clients", waitlistError.message);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/waitlist");
  redirect("/dashboard/clients");
}

export async function createWaitlistEntryAction(formData: FormData) {
  const input = buildWaitlistCreateInput({
    customerId: formData.get("customerId"),
    serviceId: formData.get("serviceId"),
    status: formData.get("status"),
    preferredDays: formData.getAll("preferredDays"),
    preferredTimeWindows: formData.getAll("preferredTimeWindows"),
    discountInterest: formData.get("discountInterest"),
    notes: formData.get("notes")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/waitlist", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("id", input.value.customerId)
    .single();

  if (customerError || !customer) {
    redirectWithError(
      "/dashboard/waitlist",
      customerError?.message ?? "Client not found for this organization."
    );
  }

  const { data: consent, error: consentError } = await supabase
    .from("sms_consents")
    .select("status")
    .eq("organization_id", organization.id)
    .eq("customer_id", input.value.customerId)
    .maybeSingle();

  if (consentError) {
    redirectWithError("/dashboard/waitlist", consentError.message);
  }

  if (consent?.status !== "opted_in") {
    redirectWithError(
      "/dashboard/waitlist",
      "Only clients with opted-in SMS consent can be added to the operational waitlist."
    );
  }

  if (input.value.serviceId) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("organization_id", organization.id)
      .eq("id", input.value.serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) {
      redirectWithError(
        "/dashboard/waitlist",
        serviceError?.message ?? "Selected service is not available."
      );
    }
  }

  const duplicateQuery = supabase
    .from("waitlist_entries")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("customer_id", input.value.customerId)
    .eq("status", "active");
  const scopedDuplicateQuery = input.value.serviceId
    ? duplicateQuery.eq("service_id", input.value.serviceId)
    : duplicateQuery.is("service_id", null);
  const { data: existingEntry, error: duplicateError } =
    await scopedDuplicateQuery.limit(1);

  if (duplicateError) {
    redirectWithError("/dashboard/waitlist", duplicateError.message);
  }

  if (existingEntry && existingEntry.length > 0) {
    redirectWithError(
      "/dashboard/waitlist",
      "This client is already active on the waitlist for that service."
    );
  }

  const { error } = await supabase.from("waitlist_entries").insert({
    organization_id: organization.id,
    customer_id: input.value.customerId,
    service_id: input.value.serviceId,
    status: input.value.status,
    preferred_days: input.value.preferredDays,
    preferred_time_windows: input.value.preferredTimeWindows,
    discount_interest: input.value.discountInterest,
    notes: input.value.notes
  });

  if (error) {
    redirectWithError("/dashboard/waitlist", error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/waitlist");
  redirect("/dashboard/waitlist");
}

export async function createAppointmentAction(formData: FormData) {
  const input = buildAppointmentCreateInput({
    customerId: formData.get("customerId"),
    serviceId: formData.get("serviceId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    timezone: formData.get("timezone"),
    notes: formData.get("notes"),
    sendReminder: formData.get("sendReminder"),
    requestConfirmation: formData.get("requestConfirmation")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/appointments", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageAppointments
  });
  const supabase = await createSupabaseServerClient();

  try {
    const { consent } = await verifyAppointmentReferences({
      supabase,
      organizationId: organization.id,
      customerId: input.value.customerId,
      serviceId: input.value.serviceId
    });

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        organization_id: organization.id,
        customer_id: input.value.customerId,
        service_id: input.value.serviceId,
        starts_at: input.value.startsAt,
        ends_at: input.value.endsAt,
        timezone: input.value.timezone || organization.timezone,
        status: input.value.requestConfirmation
          ? "not_yet_confirmed"
          : "scheduled",
        reminder_status:
          input.value.sendReminder && consent?.status === "opted_in"
            ? "scheduled"
            : "not_scheduled",
        confirmation_status: input.value.requestConfirmation
          ? "pending"
          : "no_response",
        reminder_24h_enabled: input.value.sendReminder,
        confirmation_request_enabled: input.value.requestConfirmation,
        source: "manual",
        notes: input.value.notes
      })
      .select("id")
      .single();

    if (error || !appointment) {
      throw new Error(error?.message ?? "Appointment creation failed.");
    }

    await supabase.from("appointment_events").insert({
      organization_id: organization.id,
      appointment_id: appointment.id,
      event_type: "appointment.created",
      metadata: {
        source: "dashboard",
        reminder_requested: input.value.sendReminder,
        confirmation_requested: input.value.requestConfirmation
      }
    });

    await maybeScheduleAppointmentReminder({
      supabase,
      organizationId: organization.id,
      customerId: input.value.customerId,
      appointmentId: appointment.id,
      startsAt: input.value.startsAt,
      sendReminder: input.value.sendReminder,
      consentStatus: consent?.status
    });
  } catch (error) {
    redirectWithError(
      "/dashboard/appointments",
      error instanceof Error ? error.message : "Appointment creation failed."
    );
  }

  revalidateAppointmentSurfaces();
  redirect("/dashboard/appointments");
}

export async function updateAppointmentAction(formData: FormData) {
  const input = buildAppointmentUpdateInput({
    appointmentId: formData.get("appointmentId"),
    customerId: formData.get("customerId"),
    serviceId: formData.get("serviceId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    timezone: formData.get("timezone"),
    notes: formData.get("notes"),
    status: formData.get("status"),
    confirmationStatus: formData.get("confirmationStatus"),
    sendReminder: formData.get("sendReminder"),
    requestConfirmation: formData.get("requestConfirmation")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/appointments", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageAppointments
  });
  const supabase = await createSupabaseServerClient();

  try {
    const { consent } = await verifyAppointmentReferences({
      supabase,
      organizationId: organization.id,
      customerId: input.value.customerId,
      serviceId: input.value.serviceId
    });

    const reminderStatus =
      input.value.sendReminder &&
      input.value.status !== "cancelled" &&
      consent?.status === "opted_in"
        ? "scheduled"
        : "not_scheduled";
    const confirmationStatus = deriveAppointmentConfirmationStatus({
      status: input.value.status,
      requestConfirmation: input.value.requestConfirmation
    });

    const { error } = await supabase
      .from("appointments")
      .update({
        customer_id: input.value.customerId,
        service_id: input.value.serviceId,
        starts_at: input.value.startsAt,
        ends_at: input.value.endsAt,
        timezone: input.value.timezone || organization.timezone,
        status: input.value.status,
        reminder_status: reminderStatus,
        confirmation_status: confirmationStatus,
        reminder_24h_enabled: input.value.sendReminder,
        confirmation_request_enabled: input.value.requestConfirmation,
        notes: input.value.notes
      })
      .eq("organization_id", organization.id)
      .eq("id", input.value.appointmentId);

    if (error) {
      throw new Error(error.message);
    }

    await supabase.from("appointment_events").insert({
      organization_id: organization.id,
      appointment_id: input.value.appointmentId,
      event_type: "appointment.updated",
      metadata: {
        status: input.value.status,
        reminder_requested: input.value.sendReminder,
        confirmation_status: confirmationStatus,
        confirmation_requested: input.value.requestConfirmation
      }
    });

    if (!input.value.sendReminder || input.value.status === "cancelled") {
      await cancelPendingAppointmentReminders({
        supabase,
        organizationId: organization.id,
        appointmentId: input.value.appointmentId
      });
    } else {
      await maybeScheduleAppointmentReminder({
        supabase,
        organizationId: organization.id,
        customerId: input.value.customerId,
        appointmentId: input.value.appointmentId,
        startsAt: input.value.startsAt,
        sendReminder: input.value.sendReminder,
        consentStatus: consent?.status
      });
    }
  } catch (error) {
    redirectWithError(
      "/dashboard/appointments",
      error instanceof Error ? error.message : "Appointment update failed."
    );
  }

  revalidateAppointmentSurfaces();
  redirect("/dashboard/appointments");
}

async function countEligibleOpeningRecipients({
  supabase,
  organizationId,
  serviceId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  serviceId: string | null;
}) {
  const { data: waitlistEntries, error: waitlistError } = await supabase
    .from("waitlist_entries")
    .select("id, customer_id, service_id, status")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (waitlistError) {
    throw new Error(waitlistError.message);
  }

  const entries = waitlistEntries ?? [];

  if (entries.length === 0) {
    return 0;
  }

  const waitlistEntryIds = entries.map((entry) => entry.id);
  const customerIds = [...new Set(entries.map((entry) => entry.customer_id))];
  const [customersResult, consentsResult, serviceInterestsResult] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, phone_e164")
        .eq("organization_id", organizationId)
        .in("id", customerIds),
      supabase
        .from("sms_consents")
        .select("customer_id, status")
        .eq("organization_id", organizationId)
        .in("customer_id", customerIds),
      supabase
        .from("waitlist_entry_services")
        .select("waitlist_entry_id, service_id")
        .eq("organization_id", organizationId)
        .in("waitlist_entry_id", waitlistEntryIds)
    ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (consentsResult.error) {
    throw new Error(consentsResult.error.message);
  }

  if (serviceInterestsResult.error) {
    throw new Error(serviceInterestsResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const consentByCustomer = new Map(
    (consentsResult.data ?? []).map((consent) => [
      consent.customer_id,
      consent.status
    ])
  );
  const serviceInterestsByEntry = new Map<string, string[]>();

  for (const interest of serviceInterestsResult.data ?? []) {
    const existing = serviceInterestsByEntry.get(interest.waitlist_entry_id) ?? [];
    existing.push(interest.service_id);
    serviceInterestsByEntry.set(interest.waitlist_entry_id, existing);
  }

  return filterEligibleOpeningRecipients(
    entries.map((entry) => {
      const customer = customerById.get(entry.customer_id);

      return {
        customerId: entry.customer_id,
        phoneE164: customer?.phone_e164 ?? "",
        consentStatus:
          (consentByCustomer.get(entry.customer_id) ?? "needs_consent") as
            | "opted_in"
            | "needs_consent"
            | "opted_out",
        waitlistStatus: entry.status as "active",
        serviceId: entry.service_id,
        serviceInterestIds: serviceInterestsByEntry.get(entry.id) ?? [],
        alreadyOffered: false
      };
    }),
    serviceId
  ).length;
}

async function sendOpeningSmsAlerts({
  supabase,
  organization,
  openingId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organization: Awaited<ReturnType<typeof requireReadyOrganization>>;
  openingId: string;
}) {
  const [openingResult, offersResult] = await Promise.all([
    supabase
      .from("openings")
      .select("id, title, service_id, start_time, end_time, offer_label")
      .eq("organization_id", organization.id)
      .eq("id", openingId)
      .single(),
    supabase
      .from("opening_offers")
      .select("id, customer_id")
      .eq("organization_id", organization.id)
      .eq("opening_id", openingId)
      .eq("status", "pending")
  ]);

  if (openingResult.error || !openingResult.data) {
    throw new Error(openingResult.error?.message ?? "Opening not found.");
  }

  if (offersResult.error) {
    throw new Error(offersResult.error.message);
  }

  const opening = openingResult.data;
  const offers = offersResult.data ?? [];

  if (offers.length === 0) {
    return {
      sent: 0
    };
  }

  const customerIds = offers.map((offer) => offer.customer_id);
  const [serviceResult, customersResult, consentsResult] = await Promise.all([
    opening.service_id
      ? supabase
          .from("services")
          .select("id, name")
          .eq("organization_id", organization.id)
          .eq("id", opening.service_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("customers")
      .select("id, full_name, phone_e164, preferred_language")
      .eq("organization_id", organization.id)
      .in("id", customerIds),
    supabase
      .from("sms_consents")
      .select("customer_id, status")
      .eq("organization_id", organization.id)
      .in("customer_id", customerIds)
  ]);

  if (serviceResult.error) {
    throw new Error(serviceResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (consentsResult.error) {
    throw new Error(consentsResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const consentByCustomer = new Map(
    (consentsResult.data ?? []).map((consent) => [
      consent.customer_id,
      consent.status
    ])
  );
  const sendableOffers = offers.filter((offer) => {
    const customer = customerById.get(offer.customer_id);

    return Boolean(
      customer?.phone_e164 &&
        /^\+[1-9][0-9]{7,14}$/.test(customer.phone_e164) &&
        consentByCustomer.get(offer.customer_id) === "opted_in"
    );
  });

  if (sendableOffers.length === 0) {
    return {
      sent: 0
    };
  }

  const provider = createSmsProvider();
  const now = new Date().toISOString();
  const successfulOfferIds: string[] = [];
  const failedReasons: string[] = [];
  const messageRecords = [];

  for (const offer of sendableOffers) {
    const customer = customerById.get(offer.customer_id);

    if (!customer?.phone_e164) {
      continue;
    }

    const message = generateOpeningSmsMessage({
      businessName: organization.name,
      serviceName: serviceResult.data?.name ?? opening.title,
      startsAt: opening.start_time,
      endsAt: opening.end_time,
      offerLabel: opening.offer_label,
      customerFirstName: customer.full_name?.trim().split(/\s+/)[0] ?? null,
      language: customer.preferred_language ?? organization.defaultLanguage,
      includeOptOut: true
    });

    try {
      const sendResult = await provider.sendSms({
        to: customer.phone_e164,
        body: message.body,
        metadata: {
          openingId,
          organizationId: organization.id,
          customerId: offer.customer_id
        }
      });

      successfulOfferIds.push(offer.id);
      messageRecords.push({
        organization_id: organization.id,
        customer_id: offer.customer_id,
        opening_id: openingId,
        direction: "outbound" as const,
        provider: sendResult.provider,
        provider_message_id: sendResult.providerMessageId,
        from_number: sendResult.fromNumber,
        to_number: customer.phone_e164,
        body: message.body,
        status: sendResult.status
      });
    } catch (error) {
      failedReasons.push(getSafeProviderErrorMessage(error));
    }
  }

  if (messageRecords.length === 0) {
    const reason = failedReasons[0] ?? "No opted-in pending offers are available to send.";
    throw new Error(reason);
  }

  const { error: messagesError } = await supabase
    .from("sms_messages")
    .insert(messageRecords);

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const { error: updateError } = await supabase
    .from("opening_offers")
    .update({
      status: "sent",
      sent_at: now
    })
    .eq("organization_id", organization.id)
    .eq("opening_id", openingId)
    .eq("status", "pending")
    .in(
      "id",
      successfulOfferIds
    );

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: openingError } = await supabase
    .from("openings")
    .update({ status: "broadcasting" })
    .eq("organization_id", organization.id)
    .eq("id", openingId);

  if (openingError) {
    throw new Error(openingError.message);
  }

  await supabase.rpc("record_opening_broadcast_audit", {
    target_opening_id: openingId,
    provider_name: provider.getProviderName(),
    sent_count: messageRecords.length,
    failed_count: failedReasons.length,
    failure_reasons: [...new Set(failedReasons)].slice(0, 5)
  });

  return {
    sent: messageRecords.length,
    failed: failedReasons.length,
    failureMessage:
      failedReasons.length > 0
        ? `${failedReasons.length} SMS send(s) failed and remain pending.`
        : null
  };
}

export async function createOpeningAction(formData: FormData) {
  const input = buildOpeningCreateInput({
    title: formData.get("title"),
    serviceId: formData.get("serviceId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    offerLabel: formData.get("offerLabel"),
    internalNote: formData.get("internalNote")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/new-cancellation", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();
  let createdOpeningId: string | null = null;
  let redirectError: string | null = null;

  try {
    const eligibleRecipientCount = await countEligibleOpeningRecipients({
      supabase,
      organizationId: organization.id,
      serviceId: input.value.serviceId
    });

    if (eligibleRecipientCount === 0) {
      throw new Error(
        "No opted-in active waitlist recipients are eligible for this opening."
      );
    }

    const { data: openingId, error } = await supabase.rpc(
      "create_opening_with_offers",
      {
        target_organization_id: organization.id,
        target_service_id: input.value.serviceId,
        opening_title: input.value.title,
        opening_start_time: input.value.startTime,
        opening_end_time: input.value.endTime,
        opening_offer_label: input.value.offerLabel
      }
    );

    if (error || !openingId) {
      throw new Error(error?.message ?? "Opening creation failed.");
    }

    const smsResult = await sendOpeningSmsAlerts({
      supabase,
      organization,
      openingId
    });

    if (smsResult.sent === 0) {
      throw new Error(
        "Opening was created, but no SMS could be sent to opted-in recipients."
      );
    }

    if (smsResult.failureMessage) {
      redirectError = smsResult.failureMessage;
    }

    createdOpeningId = openingId;
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cancellations");
    revalidatePath("/dashboard/responses");
  } catch (error) {
    redirectWithError(
      "/dashboard/new-cancellation",
      error instanceof Error ? error.message : "Opening creation failed."
    );
  }

  redirect(
    redirectError
      ? `/dashboard/cancellations/${createdOpeningId}?error=${encodeURIComponent(redirectError)}`
      : `/dashboard/cancellations/${createdOpeningId}`
  );
}

export async function sendOpeningAlertsAction(formData: FormData) {
  const openingId = String(formData.get("openingId") ?? "");
  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();
  try {
    const result = await sendOpeningSmsAlerts({
      supabase,
      organization,
      openingId
    });

    if (result.sent === 0) {
      throw new Error("No opted-in pending offers are available to send.");
    }

    if (result.failureMessage) {
      redirectWithError(`/dashboard/cancellations/${openingId}`, result.failureMessage);
    }
  } catch (error) {
    redirectWithError(
      `/dashboard/cancellations/${openingId}`,
      error instanceof Error ? error.message : "Opening SMS send failed."
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/cancellations/${openingId}`);
  revalidatePath("/dashboard/responses");
  redirect(`/dashboard/cancellations/${openingId}`);
}

export async function validateOpeningOfferAction(formData: FormData) {
  const openingId = String(formData.get("openingId") ?? "");
  const offerId = String(formData.get("offerId") ?? "");
  const recoveredValueCents = Number(formData.get("recoveredValueCents") ?? 0);
  const commissionCents = calculateCommissionEstimate({ recoveredValueCents });

  if (!openingId || !offerId || !Number.isFinite(recoveredValueCents)) {
    redirectWithError(
      `/dashboard/cancellations/${openingId}`,
      "Opening, offer, and recovered value are required."
    );
  }

  await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("validate_opening_offer", {
    target_opening_id: openingId,
    target_offer_id: offerId,
    recovered_value_cents: recoveredValueCents,
    commission_cents: commissionCents
  });

  if (error) {
    redirectWithError(`/dashboard/cancellations/${openingId}`, error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/cancellations/${openingId}`);
  redirect(`/dashboard/cancellations/${openingId}`);
}
