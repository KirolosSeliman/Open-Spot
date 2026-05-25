export const DEFAULT_COMMISSION_PERCENT = 10;

export function calculateCommissionEstimate({
  recoveredValueCents,
  commissionPercent = DEFAULT_COMMISSION_PERCENT,
  capCents
}: {
  recoveredValueCents: number;
  commissionPercent?: number;
  capCents?: number;
}) {
  const rawCommission = Math.round(
    recoveredValueCents * (commissionPercent / 100)
  );

  if (typeof capCents === "number") {
    return Math.min(rawCommission, capCents);
  }

  return rawCommission;
}
