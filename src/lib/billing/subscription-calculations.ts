import {
  aggregateFilledSpotFees,
  type BillingTerms,
  type FilledSpotForBilling
} from "@/lib/admin/billing-terms";

export type SubscriptionTotals = {
  monthlyFixedFeeCents: number;
  recoveredReservationsCount: number;
  unitCommissionCents: number;
  totalCommissionCents: number;
  monthlyTotalCents: number;
  commissionFormula: string | null;
  usesPercentageCommission: boolean;
  warnings: string[];
};

export function calculateSubscriptionTotals({
  terms,
  recoveredReservationsCount,
  filledSpots,
  formatMoney
}: {
  terms: BillingTerms;
  recoveredReservationsCount: number;
  filledSpots: FilledSpotForBilling[];
  formatMoney: (cents: number) => string;
}): SubscriptionTotals {
  const monthlyFixedFeeCents = terms.monthlySubscriptionCents;
  const unitCommissionCents = terms.filledSpotFixedFeeCents;
  const warnings: string[] = [];
  const usesPercentageCommission =
    terms.filledSpotFeeMode === "percentage" ||
    terms.filledSpotFeeMode === "fixed_plus_percentage";

  let totalCommissionCents = 0;
  let commissionFormula: string | null = null;

  if (terms.filledSpotFeeMode === "none") {
    totalCommissionCents = 0;
  } else if (terms.filledSpotFeeMode === "fixed") {
    totalCommissionCents = recoveredReservationsCount * unitCommissionCents;
    commissionFormula =
      recoveredReservationsCount > 0 && unitCommissionCents > 0
        ? `${recoveredReservationsCount} × ${formatMoney(unitCommissionCents)}`
        : null;
  } else {
    const aggregated = aggregateFilledSpotFees({ terms, filledSpots });
    totalCommissionCents = aggregated.totalFeeCents;
    warnings.push(...aggregated.warnings);

    if (terms.filledSpotFeeMode === "fixed_plus_percentage") {
      commissionFormula =
        recoveredReservationsCount > 0 && unitCommissionCents > 0
          ? `${recoveredReservationsCount} × ${formatMoney(unitCommissionCents)} + pourcentage`
          : formatMoney(totalCommissionCents);
    } else {
      commissionFormula = `${terms.filledSpotPercentageBps / 100} % du revenu récupéré`;
    }
  }

  const monthlyTotalCents = monthlyFixedFeeCents + totalCommissionCents;

  return {
    monthlyFixedFeeCents,
    recoveredReservationsCount,
    unitCommissionCents,
    totalCommissionCents,
    monthlyTotalCents,
    commissionFormula,
    usesPercentageCommission,
    warnings
  };
}
