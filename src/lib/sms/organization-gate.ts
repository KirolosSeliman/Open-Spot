import type { SupabaseClient } from "@supabase/supabase-js";

import { canBillingStatusSendSms } from "@/lib/billing/manual-billing";
import type { Database } from "@/types/database";

export type OrganizationSmsReadinessInput = {
  billingStatus: string | null;
  smsStatus: string | null;
};

export type OrganizationSmsReadiness = {
  canSendSms: boolean;
  billingStatus: string | null;
  smsStatus: string | null;
  blockingReasons: string[];
};

export function evaluateOrganizationSmsReadiness({
  billingStatus,
  smsStatus
}: OrganizationSmsReadinessInput): OrganizationSmsReadiness {
  const reasons: string[] = [];

  if (!canBillingStatusSendSms(billingStatus)) {
    reasons.push("Billing is not authorized for SMS sending.");
  }

  if (smsStatus !== "active") {
    reasons.push("SMS status is not active for this company.");
  }

  return {
    canSendSms: reasons.length === 0,
    billingStatus,
    smsStatus,
    blockingReasons: reasons
  };
}

export async function loadOrganizationSmsReadiness(
  supabase: SupabaseClient<Database>,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("organization_billing_settings")
    .select("billing_status, sms_status")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return evaluateOrganizationSmsReadiness({
    billingStatus: data?.billing_status ?? null,
    smsStatus: data?.sms_status ?? null
  });
}
