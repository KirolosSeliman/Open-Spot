import "server-only";

import { getAdminOrganizationAccessLevel } from "@/lib/admin/access";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

type BillingRow = Database["public"]["Tables"]["organization_billing_settings"]["Row"];
type BillingEventRow = Database["public"]["Tables"]["billing_events"]["Row"];

export type ManualBillingSummary = {
  id: string;
  organizationId: string;
  billingStatus: string;
  planName: string;
  monthlyPriceCents: number;
  currency: string;
  billingInterval: string;
  paymentMethod: string;
  externalPaymentUrl: string | null;
  externalCustomerReference: string | null;
  lastPaymentAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextPaymentDueAt: string | null;
  cancelledAt: string | null;
  internalNotes: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePaymentLinkId: string | null;
  stripeInvoiceId: string | null;
  smsStatus: string | null;
  updatedAt: string;
};

export type BillingEvent = {
  id: string;
  eventType: string;
  oldStatus: string | null;
  newStatus: string | null;
  amountCents: number | null;
  currency: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};

function requireServiceClient() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  return supabase;
}

function toSummary(row: BillingRow): ManualBillingSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    billingStatus: row.billing_status,
    planName: row.plan_name ?? "Founder Pilot",
    monthlyPriceCents: row.base_plan_amount_cents,
    currency: row.base_plan_currency,
    billingInterval: row.billing_interval ?? "monthly",
    paymentMethod: row.payment_method ?? "manual_external",
    externalPaymentUrl: row.external_payment_url,
    externalCustomerReference: row.external_customer_reference,
    lastPaymentAt: row.last_payment_at,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    nextPaymentDueAt: row.next_payment_due_at,
    cancelledAt: row.cancelled_at,
    internalNotes: row.internal_notes,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePaymentLinkId: row.stripe_payment_link_id,
    stripeInvoiceId: row.stripe_invoice_id,
    smsStatus: row.sms_status,
    updatedAt: row.updated_at
  };
}

function toEvent(row: BillingEventRow): BillingEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    oldStatus: row.old_status,
    newStatus: row.new_status,
    amountCents: row.amount_cents,
    currency: row.currency,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

export async function ensureManualBillingRecord(organizationId: string) {
  const supabase = requireServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("organization_billing_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return toSummary(existing);
  }

  const { data, error } = await supabase
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

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create billing record.");
  }

  await supabase.from("billing_events").insert({
    organization_id: organizationId,
    billing_id: data.id,
    event_type: "billing_created",
    new_status: data.billing_status,
    amount_cents: data.base_plan_amount_cents,
    currency: data.base_plan_currency,
    note: "Manual billing record created."
  });

  return toSummary(data);
}

export async function loadManualBillingForAdmin({
  organizationId,
  admin
}: {
  organizationId: string;
  admin: AuthorizedPlatformAdmin;
}) {
  const accessLevel = await getAdminOrganizationAccessLevel({
    admin,
    organizationId
  });

  if (!accessLevel) {
    return null;
  }

  const billing = await ensureManualBillingRecord(organizationId);
  const supabase = requireServiceClient();
  const [{ data: eventsData, error }, { data: organization, error: organizationError }] =
    await Promise.all([
      supabase
        .from("billing_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("organizations")
        .select("id, name")
        .eq("id", organizationId)
        .maybeSingle()
    ]);

  if (error) {
    throw new Error(error.message);
  }

  if (organizationError) {
    throw new Error(organizationError.message);
  }

  return {
    billing,
    events: (eventsData ?? []).map(toEvent),
    accessLevel,
    organizationName: organization?.name ?? "Company"
  };
}

export async function loadManualBillingForOrganization(organizationId: string) {
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_billing_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toSummary(data) : null;
}
