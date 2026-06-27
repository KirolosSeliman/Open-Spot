"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminOrganizationAccessLevel } from "@/lib/admin/access";
import { canPerformPlatformAdminAction } from "@/lib/admin/action-permissions";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import {
  type BillingEventType,
  type ManualBillingStatus,
  isManualBillingStatus,
  normalizeManualBillingInput
} from "@/lib/billing/manual-billing";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function clean(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function billingPath(organizationId: string, query?: string) {
  return `/admin/organizations/${organizationId}/billing${query ? `?${query}` : ""}`;
}

function redirectWithBillingError(organizationId: string, message: string): never {
  redirect(billingPath(organizationId, `error=${encodeURIComponent(message)}`));
}

async function requireManualBillingAdmin(organizationId: string) {
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    throw new Error("Platform admin access is required.");
  }

  const accessLevel = await getAdminOrganizationAccessLevel({
    admin: access.admin,
    organizationId
  });

  if (
    !canPerformPlatformAdminAction({
      adminRole: access.admin.role,
      accessLevel,
      action: "organization.manage_manual_billing"
    })
  ) {
    throw new Error("Only an authorized platform admin can update billing.");
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  return {
    admin: access.admin,
    supabase
  };
}

async function loadBillingRow(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("organization_billing_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return data;
  }

  const { data: created, error: createError } = await supabase
    .from("organization_billing_settings")
    .insert({
      organization_id: organizationId,
      billing_status: "unpaid",
      plan_name: "Founder Pilot",
      base_plan_amount_cents: 14900,
      base_plan_currency: "CAD",
      billing_interval: "monthly",
      payment_method: "manual_external"
    })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(createError?.message ?? "Unable to create billing record.");
  }

  return created;
}

async function readBillingRow(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("organization_billing_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function insertBillingEvent({
  supabase,
  organizationId,
  billingId,
  adminId,
  eventType,
  oldStatus,
  newStatus,
  amountCents,
  currency,
  note
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  organizationId: string;
  billingId: string;
  adminId: string;
  eventType: BillingEventType;
  oldStatus: string | null;
  newStatus: string | null;
  amountCents: number | null;
  currency: string;
  note: string | null;
}) {
  const { error } = await supabase.from("billing_events").insert({
    organization_id: organizationId,
    billing_id: billingId,
    event_type: eventType,
    old_status: oldStatus,
    new_status: newStatus,
    amount_cents: amountCents,
    currency,
    note,
    created_by: adminId
  });

  if (error) {
    throw new Error(error.message);
  }
}

function refreshBillingViews(organizationId: string) {
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath(`/admin/organizations/${organizationId}/billing`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
}

export async function updateManualBillingPlanAction(formData: FormData) {
  const organizationId = clean(formData, "organizationId");
  const parsed = normalizeManualBillingInput(formData);

  if (!parsed.ok) {
    redirectWithBillingError(organizationId, parsed.errors.join(" "));
  }

  const { admin, supabase } = await requireManualBillingAdmin(organizationId);
  const { data: billingId, error } = await supabase.rpc(
    "admin_update_manual_billing_plan",
    {
      target_organization_id: organizationId,
      target_admin_id: admin.id,
      target_plan_name: parsed.value.planName,
      target_amount_cents: parsed.value.monthlyPriceCents,
      target_currency: parsed.value.currency,
      target_billing_interval: parsed.value.billingInterval,
      target_payment_method: parsed.value.paymentMethod,
      target_external_payment_url: parsed.value.externalPaymentUrl,
      target_external_customer_reference: parsed.value.externalCustomerReference,
      target_internal_notes: parsed.value.internalNotes,
      target_stripe_customer_id: parsed.value.stripeCustomerId,
      target_stripe_subscription_id: parsed.value.stripeSubscriptionId,
      target_stripe_payment_link_id: parsed.value.stripePaymentLinkId,
      target_stripe_invoice_id: parsed.value.stripeInvoiceId
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "admin.organization.manual_billing_plan_updated",
    entityType: "organization_billing_settings",
    entityId: billingId,
    metadata: {
      plan_name: parsed.value.planName,
      amount_cents: parsed.value.monthlyPriceCents,
      currency: parsed.value.currency,
      payment_method: parsed.value.paymentMethod
    }
  });
  refreshBillingViews(organizationId);
  redirect(billingPath(organizationId, "saved=plan"));
}

async function updateBillingStatus({
  formData,
  status,
  eventType
}: {
  formData: FormData;
  status: ManualBillingStatus;
  eventType: BillingEventType;
}) {
  const organizationId = clean(formData, "organizationId");
  const note = clean(formData, "note").slice(0, 1000) || null;

  if (!isManualBillingStatus(status)) {
    redirectWithBillingError(organizationId, "Invalid billing status.");
  }

  const { admin, supabase } = await requireManualBillingAdmin(organizationId);
  const existing = await readBillingRow(supabase, organizationId);
  const { data: billingId, error } = await supabase.rpc(
    "admin_update_manual_billing_status",
    {
      target_organization_id: organizationId,
      target_billing_status: status,
      target_event_type: eventType,
      target_admin_id: admin.id,
      target_note: note
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: `admin.organization.billing_${status}`,
    entityType: "organization_billing_settings",
    entityId: billingId,
    metadata: {
      old_status: existing?.billing_status ?? null,
      new_status: status,
      note_length: note?.length ?? 0
    }
  });
  refreshBillingViews(organizationId);
  redirect(billingPath(organizationId, `saved=${status}`));
}

async function updateOrganizationSmsStatus({
  formData,
  smsStatus
}: {
  formData: FormData;
  smsStatus: "active" | "inactive";
}) {
  const organizationId = clean(formData, "organizationId");
  const note = clean(formData, "note").slice(0, 1000) || null;
  const { admin, supabase } = await requireManualBillingAdmin(organizationId);
  const existing = await loadBillingRow(supabase, organizationId);
  const previousStatus = existing.sms_status;

  const { error } = await supabase
    .from("organization_billing_settings")
    .update({
      sms_status: smsStatus,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  await insertBillingEvent({
    supabase,
    organizationId,
    billingId: existing.id,
    adminId: admin.id,
    eventType: "status_changed",
    oldStatus: previousStatus,
    newStatus: smsStatus,
    amountCents: null,
    currency: existing.base_plan_currency,
    note:
      note ??
      (smsStatus === "active"
        ? "SMS status activated by platform admin."
        : "SMS status deactivated by platform admin.")
  });

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action:
      smsStatus === "active"
        ? "admin.organization.sms_status_activated"
        : "admin.organization.sms_status_deactivated",
    entityType: "organization_billing_settings",
    entityId: existing.id,
    metadata: {
      old_sms_status: previousStatus,
      new_sms_status: smsStatus,
      note_length: note?.length ?? 0
    }
  });
  refreshBillingViews(organizationId);
  redirect(billingPath(organizationId, `saved=sms_${smsStatus}`));
}

export async function activateOrganizationSmsStatusAction(formData: FormData) {
  await updateOrganizationSmsStatus({ formData, smsStatus: "active" });
}

export async function deactivateOrganizationSmsStatusAction(formData: FormData) {
  await updateOrganizationSmsStatus({ formData, smsStatus: "inactive" });
}

export async function markBillingUnpaidAction(formData: FormData) {
  await updateBillingStatus({
    formData,
    status: "unpaid",
    eventType: "status_changed"
  });
}

export async function markPaymentLinkSentAction(formData: FormData) {
  await updateBillingStatus({
    formData,
    status: "payment_link_sent",
    eventType: "payment_link_sent"
  });
}

export async function markBillingPaidAction(formData: FormData) {
  await updateBillingStatus({
    formData,
    status: "paid",
    eventType: "marked_paid"
  });
}

export async function markBillingTrialAction(formData: FormData) {
  await updateBillingStatus({
    formData,
    status: "trial",
    eventType: "status_changed"
  });
}

export async function markBillingCompedAction(formData: FormData) {
  await updateBillingStatus({
    formData,
    status: "comped",
    eventType: "status_changed"
  });
}

export async function markBillingPastDueAction(formData: FormData) {
  await updateBillingStatus({
    formData,
    status: "past_due",
    eventType: "marked_past_due"
  });
}

export async function cancelManualBillingAction(formData: FormData) {
  const organizationId = clean(formData, "organizationId");

  if (clean(formData, "confirmCancel") !== "on") {
    redirectWithBillingError(
      organizationId,
      "Cancellation must be confirmed before billing can be cancelled."
    );
  }

  await updateBillingStatus({
    formData,
    status: "cancelled",
    eventType: "cancelled"
  });
}

export async function addManualBillingNoteAction(formData: FormData) {
  const organizationId = clean(formData, "organizationId");
  const note = clean(formData, "note").slice(0, 1000);

  if (note.length < 2) {
    redirectWithBillingError(organizationId, "A billing note is required.");
  }

  const { admin, supabase } = await requireManualBillingAdmin(organizationId);
  const existing = await loadBillingRow(supabase, organizationId);

  await insertBillingEvent({
    supabase,
    organizationId,
    billingId: existing.id,
    adminId: admin.id,
    eventType: "note_added",
    oldStatus: existing.billing_status,
    newStatus: existing.billing_status,
    amountCents: null,
    currency: existing.base_plan_currency,
    note
  });
  refreshBillingViews(organizationId);
  redirect(billingPath(organizationId, "saved=note"));
}
