"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordManagerModeDashboardAction } from "@/lib/admin/manager-mode";
import {
  isOrganizationSmsPaused,
  requireOrganizationSmsNotPaused
} from "@/lib/admin/organization-controls";
import {
  appendCustomerActionMessage,
  buildSafeCustomerReturnPath,
  validateCustomerDeleteForm
} from "@/lib/customers/soft-delete";
import {
  buildAppointmentCreateInput,
  buildAppointmentUpdateInput,
  buildCustomerCreateInput,
  buildCustomerUpdateInput,
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
import { sendConsentRequestSms } from "@/lib/sms/consent-request";
import { createSmsProvider } from "@/lib/sms/factory";
import { generateOpeningSmsMessage } from "@/lib/sms/message-generator";
import { checkSmsDeliveryPersistenceReadiness } from "@/lib/sms/persistence-readiness";
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

function redirectWithNotice(path: string, message: string): never {
  redirect(`${path}?notice=${encodeURIComponent(message)}`);
}

function redirectWithWarning(path: string, message: string): never {
  redirect(`${path}?warning=${encodeURIComponent(message)}`);
}

const genericClientSaveError = "Unable to save client. Please try again.";

function redirectWithCustomerActionMessage(
  path: string,
  key: "error" | "message" | "notice" | "warning",
  message: string
): never {
  redirect(appendCustomerActionMessage(path, key, message));
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

function revalidateCustomerSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/waitlist");
  revalidatePath("/dashboard/new-cancellation");
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/appointments");
}

async function getCurrentOrganizationProfileId({
  supabase,
  organizationId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
}) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("organization_members")
    .select("profile_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return data?.profile_id ?? null;
}

async function ensureCustomerAlertListEntry({
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
  if (serviceId) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", serviceId)
      .eq("active", true)
      .maybeSingle();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      throw new Error("Selected service is not available.");
    }
  }

  const { data: activeEntries, error: activeLookupError } = await supabase
    .from("waitlist_entries")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (activeLookupError) {
    throw new Error(activeLookupError.message);
  }

  const activeEntry = activeEntries?.[0] ?? null;

  if (activeEntry) {
    const { error: updateError } = await supabase
      .from("waitlist_entries")
      .update({ service_id: serviceId })
      .eq("organization_id", organizationId)
      .eq("id", activeEntry.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      id: activeEntry.id,
      created: false,
      reactivated: false
    };
  }

  const { data: inactiveEntries, error: inactiveLookupError } = await supabase
    .from("waitlist_entries")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .neq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (inactiveLookupError) {
    throw new Error(inactiveLookupError.message);
  }

  const inactiveEntry = inactiveEntries?.[0] ?? null;

  if (inactiveEntry) {
    const { error: reactivateError } = await supabase
      .from("waitlist_entries")
      .update({
        service_id: serviceId,
        status: "active"
      })
      .eq("organization_id", organizationId)
      .eq("id", inactiveEntry.id);

    if (reactivateError) {
      throw new Error(reactivateError.message);
    }

    return {
      id: inactiveEntry.id,
      created: false,
      reactivated: true
    };
  }

  const { data: newEntry, error: insertError } = await supabase
    .from("waitlist_entries")
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      service_id: serviceId,
      status: "active"
    })
    .select("id")
    .single();

  if (insertError || !newEntry) {
    throw new Error(insertError?.message ?? "Automatic alert-list setup failed.");
  }

  return {
    id: newEntry.id,
    created: true,
    reactivated: false
  };
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
      .select("id, deleted_at")
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

  if (customerResult.data.deleted_at) {
    throw new Error("Deleted clients cannot be scheduled for appointments.");
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

  const { error } = await supabase.rpc("schedule_appointment_reminder", {
    target_organization_id: organizationId,
    target_appointment_id: appointmentId,
    target_customer_id: customerId,
    target_scheduled_for: scheduledFor.toISOString(),
    target_template_key: "appointment_reminder_24h"
  });

  if (error) {
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
  const { error } = await supabase.rpc("cancel_pending_appointment_reminders", {
    target_organization_id: organizationId,
    target_appointment_id: appointmentId
  });

  if (error) {
    throw new Error(error.message);
  }
}

function deriveAppointmentConfirmationStatus({
  status,
  requestConfirmation
}: {
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  requestConfirmation: boolean;
}) {
  if (status === "cancelled") {
    return "cancelled_by_client" as const;
  }

  if (requestConfirmation && status === "scheduled") {
    return "pending" as const;
  }

  if (!requestConfirmation) {
    return "no_response" as const;
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
    serviceId: formData.get("serviceId")
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
    .is("deleted_at", null)
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

  let alertListEntry: Awaited<ReturnType<typeof ensureCustomerAlertListEntry>>;

  try {
    alertListEntry = await ensureCustomerAlertListEntry({
      supabase,
      organizationId: organization.id,
      customerId: customer.id,
      serviceId: input.value.serviceId
    });
  } catch (error) {
    console.warn("Automatic alert-list setup failed", {
      customerId: customer.id,
      organizationId: organization.id
    });
    const safeAlertListError =
      error instanceof Error && error.message === "Selected service is not available."
        ? error.message
        : "Client saved, but automatic alert-list setup failed. Please retry or contact support.";

    redirectWithError(
      "/dashboard/clients",
      safeAlertListError
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "waitlist.auto_added_from_customer_create",
    entity_type: "waitlist_entries",
    entity_id: alertListEntry.id,
    metadata: {
      customer_id: customer.id,
      waitlist_entry_id: alertListEntry.id,
      service_interest: input.value.serviceId ?? "all_services",
      auto_added: true,
      created: alertListEntry.created,
      reactivated: alertListEntry.reactivated,
      consent_status: input.value.consentStatus
    }
  });

  let consentRequestMessage: string | null = null;
  let consentRequestWarning: string | null = null;

  if (input.value.consentStatus === "needs_consent") {
    try {
      if (await isOrganizationSmsPaused(organization.id)) {
        consentRequestWarning =
          "Client added, but consent request SMS was not sent because SMS sending is paused for this organization.";
      } else {
        const consentRequestResult = await sendConsentRequestSms({
          supabase,
          provider: createSmsProvider(),
          organization: {
            id: organization.id,
            name: organization.name,
            defaultLanguage: organization.defaultLanguage
          },
          customer: {
            id: customer.id,
            fullName: input.value.fullName,
            phoneE164: input.value.phoneE164,
            preferredLanguage: input.value.preferredLanguage,
            consentStatus: input.value.consentStatus,
            deletedAt: null
          }
        });

        if (consentRequestResult.status === "failed") {
          consentRequestWarning = consentRequestResult.message;
        } else if (consentRequestResult.status === "skipped") {
          consentRequestWarning = consentRequestResult.message;
        } else {
          consentRequestMessage = consentRequestResult.message;
        }
      }
    } catch (error) {
      consentRequestWarning = `Client added, but consent request SMS failed: ${getSafeProviderErrorMessage(error)}`;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/waitlist");

  if (consentRequestWarning) {
    redirectWithWarning("/dashboard/clients", consentRequestWarning);
  }

  if (consentRequestMessage) {
    redirectWithNotice("/dashboard/clients", consentRequestMessage);
  }

  redirect("/dashboard/clients");
}

export async function updateCustomerAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const redirectPath = customerId
    ? `/dashboard/clients/${customerId}/edit`
    : "/dashboard/clients";

  if (!customerId) {
    redirectWithError("/dashboard/clients", "Client not found.");
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();

  const [existingCustomerResult, existingConsentResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone_e164, email, preferred_language, notes, deleted_at")
      .eq("organization_id", organization.id)
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("sms_consents")
      .select("status, source, consent_text, consented_at, unsubscribed_at")
      .eq("organization_id", organization.id)
      .eq("customer_id", customerId)
      .maybeSingle()
  ]);

  if (existingCustomerResult.error || existingConsentResult.error) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  const existingCustomer = existingCustomerResult.data;
  const existingConsent = existingConsentResult.data;

  if (!existingCustomer) {
    redirectWithError("/dashboard/clients", "Client not found.");
  }

  if (existingCustomer.deleted_at) {
    redirectWithError(
      redirectPath,
      "Deleted clients must be restored before they can be edited."
    );
  }

  const input = buildCustomerUpdateInput({
    customerId,
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    phoneCountry: formData.get("phoneCountry"),
    phoneNational: formData.get("phoneNational"),
    email: formData.get("email"),
    preferredLanguage: formData.get("preferredLanguage"),
    notes: formData.get("notes"),
    consentStatus: formData.get("consentStatus"),
    hasConsentProof: formData.get("hasConsentProof"),
    existingConsentStatus: existingConsent?.status
  });

  if (!input.ok) {
    redirectWithError(redirectPath, input.errors.join(" "));
  }

  const { data: duplicateCustomer, error: duplicateError } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("phone_e164", input.value.phoneE164)
    .is("deleted_at", null)
    .neq("id", input.value.customerId)
    .maybeSingle();

  if (duplicateError) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  if (duplicateCustomer) {
    redirectWithError(
      redirectPath,
      "Another client already uses this phone number."
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("customers")
    .update({
      full_name: input.value.fullName,
      phone_e164: input.value.phoneE164,
      email: input.value.email,
      preferred_language: input.value.preferredLanguage,
      notes: input.value.notes
    })
    .eq("organization_id", organization.id)
    .eq("id", input.value.customerId);

  if (updateError) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  const consentedAt =
    input.value.consentStatus === "opted_in"
      ? existingConsent?.status === "opted_in" && existingConsent.consented_at
        ? existingConsent.consented_at
        : now
      : null;
  const unsubscribedAt =
    input.value.consentStatus === "opted_out"
      ? existingConsent?.status === "opted_out" &&
        existingConsent.unsubscribed_at
        ? existingConsent.unsubscribed_at
        : now
      : existingConsent?.unsubscribed_at ?? null;

  const consentWrite = {
    organization_id: organization.id,
    customer_id: input.value.customerId,
    phone_e164: input.value.phoneE164,
    status: input.value.consentStatus,
    source: "dashboard_manual_edit",
    consent_text:
      input.value.consentStatus === "opted_in"
        ? existingConsent?.status === "opted_in" && existingConsent.consent_text
          ? existingConsent.consent_text
          : "Manual merchant confirmation of SMS consent during client edit."
        : null,
    consented_at: consentedAt,
    unsubscribed_at: unsubscribedAt
  };

  const { error: consentError } = await supabase.from("sms_consents").upsert(
    consentWrite,
    {
      onConflict: "organization_id,customer_id"
    }
  );

  if (consentError) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "customer.updated",
    entity_type: "customers",
    entity_id: input.value.customerId,
    metadata: {
      phone_changed: existingCustomer.phone_e164 !== input.value.phoneE164,
      old_phone_e164: existingCustomer.phone_e164,
      new_phone_e164: input.value.phoneE164,
      changed_fields: {
        full_name: existingCustomer.full_name !== input.value.fullName,
        phone_e164: existingCustomer.phone_e164 !== input.value.phoneE164,
        email: existingCustomer.email !== input.value.email,
        preferred_language:
          existingCustomer.preferred_language !== input.value.preferredLanguage,
        notes: existingCustomer.notes !== input.value.notes,
        consent_status: true
      }
    }
  });

  if (auditError) {
    console.warn("Customer update audit failed", {
      customerId: input.value.customerId,
      organizationId: organization.id
    });
  }

  await recordManagerModeDashboardAction({
    action: "admin.manager_mode.customer.updated",
    entityType: "customers",
    entityId: input.value.customerId,
    metadata: {
      phone_changed: existingCustomer.phone_e164 !== input.value.phoneE164
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/waitlist");
  revalidatePath("/dashboard/responses");
  redirect("/dashboard/clients");
}

export async function deleteCustomerAction(formData: FormData) {
  const input = validateCustomerDeleteForm({
    customerId: formData.get("customerId"),
    reason: formData.get("reason"),
    confirm: formData.get("confirm"),
    returnTo: formData.get("returnTo")
  });

  if (!input.ok) {
    redirectWithCustomerActionMessage(input.returnTo, "error", input.error);
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();
  const returnTo = input.value.returnTo;
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, phone_e164, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", input.value.customerId)
    .maybeSingle();

  if (customerError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  if (!customer) {
    redirectWithCustomerActionMessage(returnTo, "error", "Client not found.");
  }

  if (customer.deleted_at) {
    redirectWithCustomerActionMessage(
      returnTo,
      "notice",
      "Client is already deleted."
    );
  }

  const [activeWaitlistResult, pendingOffersResult, futureAppointmentsResult] =
    await Promise.all([
      supabase
        .from("waitlist_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("customer_id", customer.id)
        .eq("status", "active"),
      supabase
        .from("opening_offers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("customer_id", customer.id)
        .in("status", ["pending", "sent", "responded"]),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("customer_id", customer.id)
        .gt("starts_at", new Date().toISOString())
        .in("status", ["scheduled", "confirmed"])
    ]);

  if (
    activeWaitlistResult.error ||
    pendingOffersResult.error ||
    futureAppointmentsResult.error
  ) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  const now = new Date().toISOString();
  const actorProfileId = await getCurrentOrganizationProfileId({
    supabase,
    organizationId: organization.id
  });
  const activeWaitlistCount = activeWaitlistResult.count ?? 0;
  const pendingOffersCount = pendingOffersResult.count ?? 0;
  const futureAppointmentsCount = futureAppointmentsResult.count ?? 0;

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      deleted_at: now,
      deleted_by_profile_id: actorProfileId,
      deleted_reason: input.value.reason,
      restored_at: null,
      restored_by_profile_id: null,
      deletion_metadata: {
        had_active_waitlist_entries: activeWaitlistCount > 0,
        active_waitlist_entries_count: activeWaitlistCount,
        had_pending_offers: pendingOffersCount > 0,
        pending_offers_count: pendingOffersCount,
        had_future_appointments: futureAppointmentsCount > 0,
        future_appointments_count: futureAppointmentsCount
      }
    })
    .eq("organization_id", organization.id)
    .eq("id", customer.id)
    .is("deleted_at", null);

  if (updateError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  const [waitlistUpdate, offersUpdate] = await Promise.all([
    supabase
      .from("waitlist_entries")
      .update({ status: "removed" })
      .eq("organization_id", organization.id)
      .eq("customer_id", customer.id)
      .eq("status", "active"),
    supabase
      .from("opening_offers")
      .update({ status: "rejected" })
      .eq("organization_id", organization.id)
      .eq("customer_id", customer.id)
      .in("status", ["pending", "sent", "responded"])
  ]);

  if (waitlistUpdate.error || offersUpdate.error) {
    console.warn("Customer operational cleanup failed after soft delete", {
      customerId: customer.id,
      organizationId: organization.id
    });
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "customer.deleted",
    entity_type: "customers",
    entity_id: customer.id,
    metadata: {
      customer_id: customer.id,
      reason_length: input.value.reason.length,
      had_active_waitlist_entries: activeWaitlistCount > 0,
      active_waitlist_entries_count: activeWaitlistCount,
      pending_offers_count: pendingOffersCount,
      future_appointments_count: futureAppointmentsCount
    }
  });

  await recordManagerModeDashboardAction({
    action: "admin.manager_mode.customer.deleted",
    entityType: "customers",
    entityId: customer.id,
    metadata: {
      pending_offers_count: pendingOffersCount,
      active_waitlist_entries_count: activeWaitlistCount
    }
  });

  revalidateCustomerSurfaces();
  redirectWithCustomerActionMessage(
    "/dashboard/clients?tab=deleted",
    "message",
    "Client deleted."
  );
}

export async function restoreCustomerAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const returnTo = buildSafeCustomerReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/dashboard/clients?tab=deleted"
  );

  if (!customerId) {
    redirectWithCustomerActionMessage(returnTo, "error", "Client not found.");
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, phone_e164, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  if (!customer) {
    redirectWithCustomerActionMessage(returnTo, "error", "Client not found.");
  }

  if (!customer.deleted_at) {
    redirectWithCustomerActionMessage(
      "/dashboard/clients?tab=active",
      "notice",
      "Client is already active."
    );
  }

  const { data: duplicateCustomer, error: duplicateError } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("phone_e164", customer.phone_e164)
    .is("deleted_at", null)
    .neq("id", customer.id)
    .maybeSingle();

  if (duplicateError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  if (duplicateCustomer) {
    await supabase.from("audit_logs").insert({
      organization_id: organization.id,
      action: "customer.restore_blocked",
      entity_type: "customers",
      entity_id: customer.id,
      metadata: {
        customer_id: customer.id,
        reason: "active_phone_conflict",
        conflicting_customer_id: duplicateCustomer.id
      }
    });

    redirectWithCustomerActionMessage(
      returnTo,
      "error",
      "A current active client already uses this phone number. Merge/resolve manually."
    );
  }

  const actorProfileId = await getCurrentOrganizationProfileId({
    supabase,
    organizationId: organization.id
  });
  const { error: restoreError } = await supabase
    .from("customers")
    .update({
      deleted_at: null,
      deleted_by_profile_id: null,
      deleted_reason: null,
      restored_at: new Date().toISOString(),
      restored_by_profile_id: actorProfileId
    })
    .eq("organization_id", organization.id)
    .eq("id", customer.id);

  if (restoreError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "customer.restored",
    entity_type: "customers",
    entity_id: customer.id,
    metadata: {
      customer_id: customer.id
    }
  });

  await recordManagerModeDashboardAction({
    action: "admin.manager_mode.customer.restored",
    entityType: "customers",
    entityId: customer.id
  });

  revalidateCustomerSurfaces();
  redirectWithCustomerActionMessage(
    "/dashboard/clients?tab=active",
    "message",
    "Client restored."
  );
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
    .select("id, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", input.value.customerId)
    .single();

  if (customerError || !customer) {
    redirectWithError(
      "/dashboard/waitlist",
      customerError?.message ?? "Client not found for this organization."
    );
  }

  if (customer.deleted_at) {
    redirectWithError(
      "/dashboard/waitlist",
      "Deleted clients cannot be added to the operational waitlist."
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
        status: "scheduled",
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
      input.value.status !== "completed" &&
      input.value.status !== "no_show" &&
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

    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.appointment.updated",
      entityType: "appointments",
      entityId: input.value.appointmentId,
      metadata: {
        status: input.value.status,
        reminder_requested: input.value.sendReminder,
        confirmation_status: confirmationStatus
      }
    });
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
        .select("id, phone_e164, deleted_at")
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
        alreadyOffered: false,
        deletedAt: customer?.deleted_at ?? null
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
  await requireOrganizationSmsNotPaused(organization.id);

  const smsPersistence = await checkSmsDeliveryPersistenceReadiness();

  if (!smsPersistence.ready) {
    throw new Error(smsPersistence.blockingReasons.join(" "));
  }

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
      .select("id, full_name, phone_e164, preferred_language, deleted_at")
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
        !customer.deleted_at &&
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
        message_type: "opening_alert",
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
    await requireOrganizationSmsNotPaused(organization.id);

    const eligibleRecipientCount = await countEligibleOpeningRecipients({
      supabase,
      organizationId: organization.id,
      serviceId: input.value.serviceId
    });
    const smsPersistence = await checkSmsDeliveryPersistenceReadiness();

    if (eligibleRecipientCount === 0) {
      throw new Error(
        "No opted-in active waitlist recipients are eligible for this opening."
      );
    }

    if (!smsPersistence.ready) {
      throw new Error(smsPersistence.blockingReasons.join(" "));
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
    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.opening.created",
      entityType: "openings",
      entityId: openingId,
      metadata: {
        service_id: input.value.serviceId,
        sms_sent: smsResult.sent,
        sms_failed: smsResult.failed
      }
    });
    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.sms_alert.sent",
      entityType: "openings",
      entityId: openingId,
      metadata: {
        sent_count: smsResult.sent,
        failed_count: smsResult.failed
      }
    });
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

    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.sms_alert.sent",
      entityType: "openings",
      entityId: openingId,
      metadata: {
        sent_count: result.sent,
        failed_count: result.failed
      }
    });
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

  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();
  const { data: offer, error: offerLookupError } = await supabase
    .from("opening_offers")
    .select("id, customer_id, status")
    .eq("organization_id", organization.id)
    .eq("opening_id", openingId)
    .eq("id", offerId)
    .maybeSingle();

  if (offerLookupError || !offer) {
    redirectWithError(
      `/dashboard/cancellations/${openingId}`,
      offerLookupError?.message ?? "Opening offer not found."
    );
  }

  const { data: customer, error: customerLookupError } = await supabase
    .from("customers")
    .select("id, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", offer.customer_id)
    .maybeSingle();

  if (customerLookupError) {
    redirectWithError(`/dashboard/cancellations/${openingId}`, genericClientSaveError);
  }

  if (customer?.deleted_at) {
    await supabase.from("audit_logs").insert({
      organization_id: organization.id,
      action: "customer.deleted_selection_blocked",
      entity_type: "opening_offers",
      entity_id: offer.id,
      metadata: {
        customer_id: offer.customer_id,
        opening_id: openingId
      }
    });

    redirectWithError(
      `/dashboard/cancellations/${openingId}`,
      "This client was deleted and cannot be selected for a recovered spot."
    );
  }

  const { error } = await supabase.rpc("validate_opening_offer", {
    target_opening_id: openingId,
    target_offer_id: offerId,
    recovered_value_cents: recoveredValueCents,
    commission_cents: commissionCents
  });

  if (error) {
    redirectWithError(`/dashboard/cancellations/${openingId}`, error.message);
  }

  await recordManagerModeDashboardAction({
    action: "admin.manager_mode.opening_offer.validated",
    entityType: "opening_offers",
    entityId: offerId,
    metadata: {
      opening_id: openingId,
      recovered_value_cents: recoveredValueCents,
      commission_cents: commissionCents
    }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/cancellations/${openingId}`);
  redirect(`/dashboard/cancellations/${openingId}`);
}
