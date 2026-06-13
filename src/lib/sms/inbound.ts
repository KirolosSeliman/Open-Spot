export type InboundSmsContext = "appointment" | "waitlist" | "consent" | "unknown";
export type InboundSmsClassification =
  | "opt_out"
  | "consent_opt_in"
  | "consent_decline"
  | "appointment_confirm"
  | "appointment_cancel"
  | "waitlist_positive"
  | "unknown";

const optOutKeywords = new Set([
  "stop",
  "unsubscribe",
  "arret",
  "arreter",
  "desabonner",
  "cancel",
  "end",
  "quit",
  "revoke",
  "optout"
]);
const positiveKeywords = new Set(["oui", "yes", "1"]);
const consentPositiveKeywords = new Set([
  "oui",
  "yes",
  "y",
  "1",
  "start",
  "subscribe",
  "unstop"
]);
const consentDeclineKeywords = new Set(["non", "no", "n", "2"]);
const appointmentConfirmKeywords = new Set([
  "oui",
  "yes",
  "1",
  "confirm",
  "confirmer"
]);
const appointmentCancelKeywords = new Set(["no", "non", "2", "annuler", "cancel"]);

export function classifyInboundSmsBody(
  body: string,
  context: InboundSmsContext = "unknown"
): InboundSmsClassification {
  const normalized = body
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const firstToken = normalized.split(/\s+/).filter(Boolean)[0] ?? "";

  if (context === "consent") {
    if (optOutKeywords.has(normalized) || optOutKeywords.has(firstToken)) {
      return "opt_out";
    }

    if (
      consentPositiveKeywords.has(normalized) ||
      consentPositiveKeywords.has(firstToken)
    ) {
      return "consent_opt_in";
    }

    if (
      consentDeclineKeywords.has(normalized) ||
      consentDeclineKeywords.has(firstToken)
    ) {
      return "consent_decline";
    }

    return "unknown";
  }

  if (context === "appointment" && appointmentCancelKeywords.has(normalized)) {
    return "appointment_cancel";
  }

  if (optOutKeywords.has(normalized)) {
    return "opt_out";
  }

  if (context === "appointment" && appointmentConfirmKeywords.has(normalized)) {
    return "appointment_confirm";
  }

  if (positiveKeywords.has(normalized)) {
    return "waitlist_positive";
  }

  return "unknown";
}
