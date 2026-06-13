export function isFilledSpotStatus(status: string) {
  return status === "filled" || status === "selected" || status === "confirmed";
}

export function calculateCostPerFilledSpotCents({
  estimatedSmsCostCents,
  filledSpots
}: {
  estimatedSmsCostCents: number;
  filledSpots: number;
}) {
  if (filledSpots <= 0) {
    return null;
  }

  return Number((estimatedSmsCostCents / filledSpots).toFixed(2));
}

export function maskPhoneNumber(phone: string | null | undefined) {
  const value = String(phone ?? "").trim();

  if (!value) {
    return "—";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "••••";
  }

  const prefix = value.startsWith("+") ? "+" : "";
  const country = digits.length > 10 ? digits.slice(0, digits.length - 10) : "";
  const lastFour = digits.slice(-4);

  return `${prefix}${country}${"•".repeat(6)}${lastFour}`;
}

export function buildDailyBuckets({
  from,
  to
}: {
  from: Date;
  to: Date;
}) {
  const buckets: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  );

  while (cursor <= end) {
    buckets.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return buckets;
}

export function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
