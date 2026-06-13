export type FilledSpotFeeMode =
  | "none"
  | "fixed"
  | "percentage"
  | "fixed_plus_percentage";

export type BillingTerms = {
  monthlySubscriptionCents: number;
  filledSpotFeeMode: FilledSpotFeeMode;
  filledSpotFixedFeeCents: number;
  filledSpotPercentageBps: number;
  currency: string;
};

export type FilledSpotForBilling = {
  id: string;
  recoveredValueCents: number | null;
};

export type BillingTermsInput = {
  currency: string;
  monthlySubscription: string;
  filledSpotFeeMode: string;
  fixedFee: string;
  percentage: string;
  notes: string;
};

export const defaultBillingTerms: BillingTerms = {
  monthlySubscriptionCents: 0,
  filledSpotFeeMode: "none",
  filledSpotFixedFeeCents: 0,
  filledSpotPercentageBps: 0,
  currency: "CAD"
};

function parseMoneyToCents(value: string, fieldName: string) {
  const cleaned = value.trim().replace(",", ".");

  if (!cleaned) {
    return 0;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`${fieldName} must be a positive amount with up to 2 decimals.`);
  }

  return Math.round(Number(cleaned) * 100);
}

function normalizeMode(value: string): FilledSpotFeeMode {
  if (
    value === "none" ||
    value === "fixed" ||
    value === "percentage" ||
    value === "fixed_plus_percentage"
  ) {
    return value;
  }

  throw new Error("Filled spot fee mode is invalid.");
}

export function normalizeBillingTermsInput(input: BillingTermsInput) {
  const currency = input.currency.trim().toUpperCase() || "CAD";

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Currency must be a 3-letter code.");
  }

  const filledSpotFeeMode = normalizeMode(input.filledSpotFeeMode);
  const monthlySubscriptionCents = parseMoneyToCents(
    input.monthlySubscription,
    "Monthly subscription"
  );
  let filledSpotFixedFeeCents = parseMoneyToCents(
    input.fixedFee,
    "Fixed filled spot fee"
  );
  let filledSpotPercentageBps = Math.round(
    Number((input.percentage.trim() || "0").replace(",", ".")) * 100
  );

  if (
    !Number.isFinite(filledSpotPercentageBps) ||
    filledSpotPercentageBps < 0 ||
    filledSpotPercentageBps > 10000
  ) {
    throw new Error("Percentage fee must be between 0 and 100.");
  }

  if (filledSpotFeeMode === "none") {
    filledSpotFixedFeeCents = 0;
    filledSpotPercentageBps = 0;
  }

  if (filledSpotFeeMode === "fixed") {
    filledSpotPercentageBps = 0;
  }

  if (filledSpotFeeMode === "percentage") {
    filledSpotFixedFeeCents = 0;
  }

  return {
    terms: {
      currency,
      monthlySubscriptionCents,
      filledSpotFeeMode,
      filledSpotFixedFeeCents,
      filledSpotPercentageBps
    },
    notes: input.notes.trim().slice(0, 1000) || null
  };
}

export function calculateFilledSpotFeeCents({
  terms,
  filledSpot
}: {
  terms: BillingTerms;
  filledSpot: FilledSpotForBilling;
}) {
  let feeCents = 0;
  let warning: string | null = null;
  const needsPercentage =
    terms.filledSpotFeeMode === "percentage" ||
    terms.filledSpotFeeMode === "fixed_plus_percentage";

  if (
    terms.filledSpotFeeMode === "fixed" ||
    terms.filledSpotFeeMode === "fixed_plus_percentage"
  ) {
    feeCents += terms.filledSpotFixedFeeCents;
  }

  if (needsPercentage) {
    if (filledSpot.recoveredValueCents === null) {
      warning =
        "Percentage fee requires recovered value to be tracked on filled bookings.";
    } else {
      feeCents += Math.round(
        (filledSpot.recoveredValueCents * terms.filledSpotPercentageBps) / 10000
      );
    }
  }

  return {
    feeCents,
    warning
  };
}

export function aggregateFilledSpotFees({
  terms,
  filledSpots
}: {
  terms: BillingTerms;
  filledSpots: FilledSpotForBilling[];
}) {
  const warnings = new Set<string>();
  let totalFeeCents = 0;

  for (const filledSpot of filledSpots) {
    const result = calculateFilledSpotFeeCents({ terms, filledSpot });
    totalFeeCents += result.feeCents;

    if (result.warning) {
      warnings.add(result.warning);
    }
  }

  return {
    totalFeeCents,
    warnings: [...warnings]
  };
}

export function formatBillingTermsSummary(terms: BillingTerms) {
  if (terms.filledSpotFeeMode === "none") {
    return "No filled spot fee";
  }

  const fixed = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: terms.currency
  }).format(terms.filledSpotFixedFeeCents / 100);
  const percentage = `${terms.filledSpotPercentageBps / 100}%`;

  if (terms.filledSpotFeeMode === "fixed") {
    return `${fixed} / filled spot`;
  }

  if (terms.filledSpotFeeMode === "percentage") {
    return `${percentage} of recovered value`;
  }

  return `${fixed} + ${percentage}`;
}
