import type { Locale } from "@/lib/i18n/types";
import type { OpeningResponseCustomer } from "@/lib/dashboard/operations-data";
import { formatOpeningStatus } from "@/lib/dashboard/status-labels";
import type { InboundSmsClassification } from "@/lib/sms/inbound";

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function formatReplyBadge(customer: OpeningResponseCustomer) {
  if (customer.offerStatus === "selected") {
    return { label: "OUI", tone: "positive" as const };
  }

  if (customer.offerStatus === "rejected") {
    return { label: "NON", tone: "negative" as const };
  }

  if (customer.replyClassification === "waitlist_positive") {
    return { label: "OUI", tone: "positive" as const };
  }

  if (customer.replyClassification === "opt_out") {
    return { label: "NON", tone: "negative" as const };
  }

  const text = (customer.lastInboundBody ?? customer.responseText ?? "").trim();

  if (!text) {
    return { label: "—", tone: "neutral" as const };
  }

  const normalized = text.toLowerCase();

  if (/^(oui|yes|ok|y)\b/.test(normalized)) {
    return { label: "OUI", tone: "positive" as const };
  }

  if (/^(non|no|n)\b/.test(normalized)) {
    return { label: "NON", tone: "negative" as const };
  }

  return { label: text, tone: "other" as const };
}

export function formatCustomerReplyStatus(
  customer: OpeningResponseCustomer,
  locale: Locale
) {
  const labels = {
    fr: {
      selected: "Confirmé manuellement",
      rejected: "Refusé",
      responded: "Répondu",
      no_reply: "Aucune réponse",
      positive: "Répondu",
      unknown: "Répondu"
    },
    en: {
      selected: "Manually confirmed",
      rejected: "Declined",
      responded: "Responded",
      no_reply: "No reply",
      positive: "Responded",
      unknown: "Responded"
    }
  }[locale === "en" ? "en" : "fr"];

  if (customer.offerStatus === "selected") {
    return labels.selected;
  }

  if (customer.offerStatus === "rejected") {
    return labels.rejected;
  }

  if (
    customer.replyClassification === "waitlist_positive" ||
    customer.respondedAt ||
    customer.lastInboundReceivedAt
  ) {
    return customer.replyClassification === "unknown"
      ? labels.unknown
      : labels.positive;
  }

  return labels.no_reply;
}

export function getOpeningStatusPresentation(
  status: string,
  locale: Locale
) {
  const label = formatOpeningStatus(status, locale);

  if (status === "filled") {
    return { label: "Créneau récupéré", tone: "success" as const };
  }

  if (status === "awaiting_validation" || status === "broadcasting") {
    return { label: "En attente", tone: "warning" as const };
  }

  return { label, tone: "neutral" as const };
}

export function formatAppointmentClassification(
  classification: InboundSmsClassification | null,
  locale: Locale
) {
  if (!classification) {
    return locale === "en" ? "No reply" : "Aucune réponse";
  }

  const labels = {
    fr: {
      appointment_confirm: "OUI",
      appointment_cancel: "NON",
      opt_out: "Désabonnement",
      waitlist_positive: "OUI",
      unknown: "Autre"
    },
    en: {
      appointment_confirm: "YES",
      appointment_cancel: "NO",
      opt_out: "Opt out",
      waitlist_positive: "YES",
      unknown: "Other"
    }
  }[locale === "en" ? "en" : "fr"];

  return labels[classification as keyof typeof labels] ?? labels.unknown;
}

export function canConfirmOpeningCustomer(
  customer: OpeningResponseCustomer,
  openingStatus: string
) {
  return (
    openingStatus !== "filled" &&
    customer.offerStatus === "responded" &&
    customer.replyClassification !== "opt_out"
  );
}

export function canRejectOpeningCustomer(
  customer: OpeningResponseCustomer,
  openingStatus: string
) {
  return (
    openingStatus !== "filled" &&
    ["sent", "responded"].includes(customer.offerStatus)
  );
}
