import { calculateCommissionEstimate } from "@/lib/openings/commission";

export type CommissionRecordInput = {
  recoveredValueCents: number;
  discountAmountCents: number;
  commissionPercent: number;
  commissionCapCents: number | null;
  currency: "CAD";
};

export function createCommissionRecord(input: CommissionRecordInput) {
  return {
    ...input,
    commissionAmountCents: calculateCommissionEstimate({
      recoveredValueCents: input.recoveredValueCents,
      commissionPercent: input.commissionPercent,
      capCents: input.commissionCapCents ?? undefined
    }),
    calculatedAt: new Date().toISOString()
  };
}
