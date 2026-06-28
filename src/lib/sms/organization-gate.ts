import { canBillingStatusSendSms } from "@/lib/billing/manual-billing";

export type OrganizationSmsReadinessInput = {
  billingStatus: string | null;
  smsStatus: string | null;
};

export type OrganizationSmsActivationReadiness = {
  canActivateSms: boolean;
  billingStatus: string | null;
  smsStatus: string | null;
  blockingReasons: string[];
};

export type OrganizationSmsReadiness = OrganizationSmsActivationReadiness & {
  canSendSms: boolean;
};

export function evaluateOrganizationSmsActivationReadiness({
  billingStatus,
  smsStatus
}: OrganizationSmsReadinessInput): OrganizationSmsActivationReadiness {
  const reasons: string[] = [];

  if (!canBillingStatusSendSms(billingStatus)) {
    reasons.push("Le statut de facturation ne permet pas l'envoi SMS.");
  }

  return {
    canActivateSms: reasons.length === 0,
    billingStatus,
    smsStatus,
    blockingReasons: reasons
  };
}

export function evaluateOrganizationSmsReadiness({
  billingStatus,
  smsStatus
}: OrganizationSmsReadinessInput): OrganizationSmsReadiness {
  const activation = evaluateOrganizationSmsActivationReadiness({
    billingStatus,
    smsStatus
  });
  const reasons = [...activation.blockingReasons];

  if (smsStatus !== "active") {
    reasons.push("SMS status is not active.");
  }

  return {
    ...activation,
    canSendSms: reasons.length === 0,
    blockingReasons: reasons
  };
}

export async function loadOrganizationSmsReadiness(
  supabase: import("@supabase/supabase-js").SupabaseClient<
    import("@/types/database").Database
  >,
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

export function organizationReadinessBlocksActivation(
  readiness: OrganizationSmsReadiness
) {
  return readiness.blockingReasons.filter(
    (reason) => reason !== "SMS status is not active."
  );
}
