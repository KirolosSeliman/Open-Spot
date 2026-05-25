export type ConsentStatus = "opted_in" | "needs_consent" | "opted_out";

const optedInValues = new Set(["opted_in", "yes", "oui", "true", "1"]);
const optedOutValues = new Set([
  "opted_out",
  "stop",
  "unsubscribe",
  "unsubscribed",
  "cancel",
  "arret"
]);

export function mapConsentStatus(
  rawStatus: string | null | undefined,
  hasConsentProof: boolean
): ConsentStatus {
  const normalized = String(rawStatus ?? "")
    .trim()
    .toLowerCase();

  if (optedOutValues.has(normalized)) {
    return "opted_out";
  }

  if (optedInValues.has(normalized) && hasConsentProof) {
    return "opted_in";
  }

  return "needs_consent";
}

export function getConsentSource(status: ConsentStatus, source: string) {
  if (status === "opted_in") {
    return source;
  }

  return source || "unknown";
}
