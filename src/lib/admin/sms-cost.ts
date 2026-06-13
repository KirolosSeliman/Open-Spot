export const DEFAULT_ESTIMATED_SMS_SEGMENT_COST_CENTS = 0.83;

export function estimateSmsCostCents({
  outboundSmsCount,
  segmentsCount
}: {
  outboundSmsCount: number;
  segmentsCount?: number | null;
}) {
  const billableSegments = segmentsCount ?? outboundSmsCount;

  return Number(
    (Math.max(0, billableSegments) * DEFAULT_ESTIMATED_SMS_SEGMENT_COST_CENTS).toFixed(2)
  );
}

export function formatEstimatedSmsCost(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}
