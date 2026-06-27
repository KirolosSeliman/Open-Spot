import type { Locale } from "@/lib/i18n/types";
import { formatOpeningStatus } from "@/lib/dashboard/status-labels";

export type OpeningStatusBadgeTone =
  | "success"
  | "info"
  | "warning"
  | "neutral"
  | "muted";

export type OpeningStatusBadgePresentation = {
  label: string;
  tone: OpeningStatusBadgeTone;
  icon: "check" | "send" | "clock" | "message" | "x" | null;
};

const frLabels: Record<string, string> = {
  draft: "En attente",
  broadcasting: "Envoi en cours",
  awaiting_validation: "Réponses reçues",
  filled: "Créneau récupéré",
  expired: "Non récupéré",
  cancelled: "Annulé"
};

const enLabels: Record<string, string> = {
  draft: "Pending",
  broadcasting: "Sending",
  awaiting_validation: "Replies received",
  filled: "Recovered spot",
  expired: "Not recovered",
  cancelled: "Cancelled"
};

export function getOpeningStatusBadgePresentation(
  status: string | null | undefined,
  locale: Locale = "fr"
): OpeningStatusBadgePresentation {
  const normalizedLocale = locale === "en" ? "en" : "fr";
  const labels = normalizedLocale === "en" ? enLabels : frLabels;

  if (!status) {
    return {
      label:
        normalizedLocale === "en"
          ? "Unknown status"
          : formatOpeningStatus(status, normalizedLocale),
      tone: "muted",
      icon: null
    };
  }

  const label = labels[status] ?? formatOpeningStatus(status, normalizedLocale);

  switch (status) {
    case "filled":
      return { label, tone: "success", icon: "check" };
    case "broadcasting":
      return { label, tone: "info", icon: "send" };
    case "awaiting_validation":
      return { label, tone: "warning", icon: "message" };
    case "draft":
      return { label, tone: "neutral", icon: "clock" };
    case "expired":
      return { label, tone: "muted", icon: "x" };
    case "cancelled":
      return { label, tone: "muted", icon: "x" };
    default:
      return { label, tone: "neutral", icon: null };
  }
}
