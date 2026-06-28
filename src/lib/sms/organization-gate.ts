import type { SupabaseClient } from "@supabase/supabase-js";

import { canBillingStatusSendSms } from "@/lib/billing/manual-billing";
import type { Database } from "@/types/database";

const clientSubmissionStatuses = [
  "not_started",
  "in_progress",
  "submitted",
  "changes_requested",
  "ready_for_sms_setup",
  "completed"
] as const;

type ClientSubmissionStatus = (typeof clientSubmissionStatuses)[number];

function isClientSubmissionStatus(
  value: string | null | undefined
): value is ClientSubmissionStatus {
  return clientSubmissionStatuses.includes(value as ClientSubmissionStatus);
}

export type OrganizationSmsReadinessInput = {
  onboardingStatus: string | null;
  billingStatus: string | null;
  smsStatus: string | null;
};

export type OrganizationSmsReadiness = {
  canSendSms: boolean;
  onboardingStatus: string | null;
  billingStatus: string | null;
  smsStatus: string | null;
  blockingReasons: string[];
};

export function evaluateOrganizationSmsReadiness({
  onboardingStatus,
  billingStatus,
  smsStatus
}: OrganizationSmsReadinessInput): OrganizationSmsReadiness {
  const normalizedOnboardingStatus = isClientSubmissionStatus(onboardingStatus)
    ? onboardingStatus
    : null;
  const reasons: string[] = [];

  if (normalizedOnboardingStatus !== "completed") {
    reasons.push("Client onboarding is not completed.");
  }

  if (!canBillingStatusSendSms(billingStatus)) {
    reasons.push("Billing status is not paid.");
  }

  if (smsStatus !== "active") {
    reasons.push("SMS status is not active.");
  }

  return {
    canSendSms: reasons.length === 0,
    onboardingStatus: normalizedOnboardingStatus,
    billingStatus,
    smsStatus,
    blockingReasons: reasons
  };
}

export async function loadOrganizationSmsReadiness(
  supabase: SupabaseClient<Database>,
  organizationId: string
) {
  const [onboardingResult, billingResult] = await Promise.all([
    supabase
      .from("organization_onboarding_submissions")
      .select("status")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_billing_settings")
      .select("billing_status, sms_status")
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  if (onboardingResult.error) {
    throw new Error(onboardingResult.error.message);
  }

  if (billingResult.error) {
    throw new Error(billingResult.error.message);
  }

  return evaluateOrganizationSmsReadiness({
    onboardingStatus: onboardingResult.data?.status ?? null,
    billingStatus: billingResult.data?.billing_status ?? null,
    smsStatus: billingResult.data?.sms_status ?? null
  });
}
