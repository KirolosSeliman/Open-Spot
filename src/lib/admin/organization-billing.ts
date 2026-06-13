import {
  aggregateFilledSpotFees,
  defaultBillingTerms,
  type BillingTerms,
  type FilledSpotForBilling
} from "@/lib/admin/billing-terms";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

type BillingTermsRow =
  Database["public"]["Tables"]["platform_organization_billing_terms"]["Row"];

export function mapBillingTermsRow(row: BillingTermsRow | null): BillingTerms {
  if (!row) {
    return defaultBillingTerms;
  }

  return {
    currency: row.currency,
    monthlySubscriptionCents: row.monthly_subscription_cents,
    filledSpotFeeMode: row.filled_spot_fee_mode,
    filledSpotFixedFeeCents: row.filled_spot_fixed_fee_cents,
    filledSpotPercentageBps: row.filled_spot_percentage_bps
  };
}

export async function loadOrganizationBillingTerms(organizationId: string) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const { data, error } = await supabase
    .from("platform_organization_billing_terms")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    row: data,
    terms: mapBillingTermsRow(data)
  };
}

export function calculateBillingPreview({
  terms,
  filledSpots,
  estimatedSmsCostCents
}: {
  terms: BillingTerms;
  filledSpots: FilledSpotForBilling[];
  estimatedSmsCostCents: number;
}) {
  const filledSpotFees = aggregateFilledSpotFees({ terms, filledSpots });

  return {
    filledSpotFeesInRangeCents: filledSpotFees.totalFeeCents,
    estimatedSmsCostInRangeCents: estimatedSmsCostCents,
    estimatedContributionInRangeCents:
      filledSpotFees.totalFeeCents - estimatedSmsCostCents,
    warnings: filledSpotFees.warnings
  };
}
