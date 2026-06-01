export type InboundSmsContext = "appointment" | "waitlist" | "unknown";
export type InboundSmsClassification =
  | "opt_out"
  | "appointment_confirm"
  | "appointment_cancel"
  | "waitlist_positive"
  | "unknown";

const optOutKeywords = new Set([
  "stop",
  "unsubscribe",
  "arret",
  "desabonner",
  "cancel"
]);
const positiveKeywords = new Set(["oui", "yes", "1"]);
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
    .replace(/\p{Diacritic}/gu, "");

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
