export type InboundSmsClassification = "opt_out" | "positive" | "unknown";

const optOutKeywords = new Set(["stop", "unsubscribe", "cancel", "arret"]);
const positiveKeywords = new Set(["oui", "yes", "1"]);

export function classifyInboundSmsBody(body: string): InboundSmsClassification {
  const normalized = body
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (optOutKeywords.has(normalized)) {
    return "opt_out";
  }

  if (positiveKeywords.has(normalized)) {
    return "positive";
  }

  return "unknown";
}
