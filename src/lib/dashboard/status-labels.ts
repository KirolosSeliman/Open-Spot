import type { Locale } from "@/lib/i18n/types";

const openingStatusLabels: Record<Locale, Record<string, string>> = {
  fr: {
    draft: "Brouillon",
    broadcasting: "Envoi en cours",
    awaiting_validation: "En attente de validation",
    filled: "Créneau récupéré",
    expired: "Expiré",
    cancelled: "Annulé"
  },
  en: {
    draft: "Draft",
    broadcasting: "Broadcasting",
    awaiting_validation: "Awaiting validation",
    filled: "Recovered",
    expired: "Expired",
    cancelled: "Cancelled"
  }
};

const openingOfferStatusLabels: Record<Locale, Record<string, string>> = {
  fr: {
    pending: "Préparé",
    sent: "Envoyé",
    responded: "Réponse reçue",
    selected: "Confirmé",
    rejected: "Non retenu",
    expired: "Expiré",
    invalid: "Invalide"
  },
  en: {
    pending: "Prepared",
    sent: "Sent",
    responded: "Response received",
    selected: "Confirmed",
    rejected: "Not selected",
    expired: "Expired",
    invalid: "Invalid"
  }
};

function normalizeLocale(locale: Locale | null | undefined): Locale {
  return locale === "en" ? "en" : "fr";
}

export function formatOpeningStatus(
  status: string | null | undefined,
  locale?: Locale | null
) {
  if (!status) {
    return normalizeLocale(locale) === "en" ? "Unknown status" : "Statut inconnu";
  }

  return openingStatusLabels[normalizeLocale(locale)][status] ?? status;
}

export function formatOpeningOfferStatus(
  status: string | null | undefined,
  locale?: Locale | null
) {
  if (!status) {
    return normalizeLocale(locale) === "en" ? "Unknown status" : "Statut inconnu";
  }

  return openingOfferStatusLabels[normalizeLocale(locale)][status] ?? status;
}
