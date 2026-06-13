export const DEFAULT_SMS_CURRENCY = "CAD";
export const DEFAULT_TWILIO_OUTBOUND_SEGMENT_COST_CENTS = 0.83;
export const DEFAULT_TWILIO_INBOUND_SEGMENT_COST_CENTS = 0.83;
export const DEFAULT_ESTIMATED_SMS_SEGMENT_COST_CENTS =
  DEFAULT_TWILIO_OUTBOUND_SEGMENT_COST_CENTS;

export type SmsCostInput = {
  id?: string | null;
  provider: string | null;
  direction: "inbound" | "outbound";
  status: string | null;
  segments: number | null;
  actualProviderPriceCents?: number | null;
};

export type SmsCostBreakdown = {
  estimatedSmsCostCents: number;
  actualSmsCostCents: number | null;
  costSource:
    | "actual_provider_price"
    | "estimated_segments"
    | "estimated_messages"
    | "zero_simulator";
  warnings: string[];
};

function roundCents(value: number) {
  return Math.round(value);
}

function getEstimatedSegmentRateCents(input: SmsCostInput) {
  if (input.direction === "inbound") {
    return DEFAULT_TWILIO_INBOUND_SEGMENT_COST_CENTS;
  }

  return DEFAULT_TWILIO_OUTBOUND_SEGMENT_COST_CENTS;
}

export function estimateSmsMessageCostCents(
  input: SmsCostInput
): SmsCostBreakdown {
  const provider = String(input.provider ?? "").toLowerCase();

  if (provider === "simulator") {
    return {
      estimatedSmsCostCents: 0,
      actualSmsCostCents: 0,
      costSource: "zero_simulator",
      warnings: []
    };
  }

  if (
    input.actualProviderPriceCents !== null &&
    input.actualProviderPriceCents !== undefined
  ) {
    const actualSmsCostCents = Math.abs(roundCents(input.actualProviderPriceCents));

    return {
      estimatedSmsCostCents: actualSmsCostCents,
      actualSmsCostCents,
      costSource: "actual_provider_price",
      warnings: []
    };
  }

  const segments =
    input.segments && Number.isFinite(input.segments) && input.segments > 0
      ? Math.ceil(input.segments)
      : 1;
  const warnings =
    input.segments && input.segments > 0
      ? []
      : ["Segment counts are not stored; estimate assumes one segment per message."];

  return {
    estimatedSmsCostCents: Number(
      (segments * getEstimatedSegmentRateCents(input)).toFixed(2)
    ),
    actualSmsCostCents: null,
    costSource: input.segments && input.segments > 0 ? "estimated_segments" : "estimated_messages",
    warnings
  };
}

export function aggregateSmsCost(messages: SmsCostInput[]) {
  const seen = new Set<string>();
  const warnings = new Set<string>();
  let estimatedSmsCostCents = 0;
  let actualSmsCostCents = 0;
  let allActual = true;
  let billableMessageCount = 0;
  let estimatedSegments = 0;

  for (const message of messages) {
    if (message.id) {
      if (seen.has(message.id)) {
        continue;
      }

      seen.add(message.id);
    }

    const breakdown = estimateSmsMessageCostCents(message);
    estimatedSmsCostCents += breakdown.estimatedSmsCostCents;
    billableMessageCount += 1;
    estimatedSegments +=
      message.segments && message.segments > 0 ? Math.ceil(message.segments) : 1;

    if (breakdown.actualSmsCostCents === null) {
      allActual = false;
    } else {
      actualSmsCostCents += breakdown.actualSmsCostCents;
    }

    for (const warning of breakdown.warnings) {
      warnings.add(warning);
    }
  }

  if (!allActual && messages.length > 0) {
    warnings.add("Actual provider prices are not stored for every SMS row; costs are estimates.");
  }

  return {
    estimatedSmsCostCents: Number(estimatedSmsCostCents.toFixed(2)),
    actualSmsCostCents: allActual ? actualSmsCostCents : null,
    billableMessageCount,
    estimatedSegments,
    warnings: [...warnings]
  };
}

export function estimateSmsCostCents({
  outboundSmsCount,
  segmentsCount
}: {
  outboundSmsCount: number;
  segmentsCount?: number | null;
}) {
  const billableSegments = segmentsCount ?? outboundSmsCount;

  return Number(
    (Math.max(0, billableSegments) * DEFAULT_TWILIO_OUTBOUND_SEGMENT_COST_CENTS).toFixed(2)
  );
}

export function formatEstimatedSmsCost(cents: number, currency = DEFAULT_SMS_CURRENCY) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency
  }).format(cents / 100);
}
