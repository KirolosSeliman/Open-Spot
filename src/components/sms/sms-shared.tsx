import type { AdminSmsDiagnosticRow } from "@/lib/admin/sms-diagnostics";
import type { SmsSenderReadinessCheck } from "@/lib/sms/sms-setup-readiness";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";

export type SmsConfigurationTab =
  | "overview"
  | "number"
  | "sending"
  | "compliance"
  | "tests"
  | "activity"
  | "advanced";

export function parseSmsTab(value: string | undefined): SmsConfigurationTab {
  const allowed: SmsConfigurationTab[] = [
    "overview",
    "number",
    "sending",
    "compliance",
    "tests",
    "activity",
    "advanced"
  ];

  if (value && allowed.includes(value as SmsConfigurationTab)) {
    return value as SmsConfigurationTab;
  }

  return "overview";
}

export function mapSmsMessageSource(
  context: "opening" | "appointment" | "consent" | "unlinked"
) {
  switch (context) {
    case "opening":
      return "Campagne";
    case "consent":
      return "Réponse";
    default:
      return "Transactionnel";
  }
}

export function mapSmsStatusLabel(status: string) {
  switch (status) {
    case "delivered":
      return "Livré";
    case "received":
      return "Reçu";
    case "failed":
    case "undelivered":
    case "error":
      return "Échec";
    case "sent":
      return "Envoyé";
    case "queued":
    case "accepted":
      return "En attente";
    default:
      return status;
  }
}

export const smsPageStyles = {
  page: "mx-auto grid max-w-[1280px] gap-6 bg-[#f7fbff] pb-10",
  card:
    "rounded-[22px] border border-[#e1e9f5] bg-white p-5 shadow-[0_8px_32px_rgba(15,23,42,0.05)] sm:p-6",
  cardTitle: "text-lg font-black tracking-tight text-[#0b1328]",
  cardSubtitle: "text-sm text-[#64748b]",
  label: "text-[13px] font-bold text-[#64748b]",
  value: "text-sm font-black text-[#0b1328]",
  input:
    "min-h-11 w-full rounded-xl border border-[#e1e9f5] bg-white px-4 text-sm text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#eef5ff]",
  textarea:
    "min-h-28 w-full rounded-xl border border-[#e1e9f5] bg-white px-4 py-3 text-sm text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#eef5ff]",
  primaryButton:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563ff] px-5 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50",
  secondaryButton:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e1e9f5] bg-white px-5 text-sm font-bold text-[#0b1328] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50",
  destructiveButton:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50",
  linkButton:
    "inline-flex items-center gap-1 text-sm font-bold text-[#2563ff] transition hover:text-[#1d4ed8]"
} as const;

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

const shortTimeFormatter = new Intl.DateTimeFormat("fr-CA", {
  hour: "numeric",
  minute: "2-digit"
});

export function formatSmsDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return dateFormatter.format(new Date(value));
}

export function formatSmsShortTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return shortTimeFormatter.format(new Date(value));
}

export function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(digits).replace(".", ",")} %`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("fr-CA").format(value);
}

export function formatTrendPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1).replace(".", ",")} %`;
}

export function statusToneFromLabel(label: string) {
  if (["Actif", "Validé", "Réussi", "Synchronisé", "Configuré", "Approuvé", "Livré", "Envoyé"].includes(label)) {
    return "success" as const;
  }

  if (["À vérifier", "En attente", "En pause", "En mode essai"].includes(label)) {
    return "warning" as const;
  }

  if (["Manquant", "Échec", "Bloqué", "Erreur"].includes(label)) {
    return "danger" as const;
  }

  if (["Reçu"].includes(label)) {
    return "info" as const;
  }

  return "default" as const;
}

export function senderStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "ready":
      return "Synchronisé";
    case "paused":
      return "En pause";
    case "blocked":
      return "Bloqué";
    case "number_missing":
    case "webhook_missing":
    case "test_required":
    case "compliance_pending":
      return "À vérifier";
    default:
      return "Manquant";
  }
}

export function complianceLabel(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return "Actif";
    case "not_required":
      return "Actif";
    case "rejected":
    case "blocked":
      return "Bloqué";
    default:
      return "À vérifier";
  }
}

export function broadcastStatusLabel(
  sender: SafeOrganizationSmsSenderView | null
) {
  if (sender?.senderStatus === "blocked") {
    return "Bloqué";
  }

  if (sender?.senderStatus === "paused") {
    return "En pause";
  }

  if (sender?.senderStatus === "ready") {
    return "Actif";
  }

  if (sender?.isTrialAccount) {
    return "En mode essai";
  }

  return "À configurer";
}

export function checklistStatusLabel(check: SmsSenderReadinessCheck) {
  if (check.status === "active") {
    return "Actif";
  }

  if (check.status === "pending") {
    return "À vérifier";
  }

  return "Manquant";
}

export function rowStatusLabel(row: AdminSmsDiagnosticRow) {
  return mapSmsStatusLabel(row.status);
}

export function prerequisiteStatusLabel(
  status: "validated" | "pending" | "missing"
) {
  switch (status) {
    case "validated":
      return "Validé";
    case "pending":
      return "En attente";
    default:
      return "Manquant";
  }
}

export function testStepStatusLabel(
  status: "success" | "failure" | "pending" | "missing"
) {
  switch (status) {
    case "success":
      return "Réussi";
    case "failure":
      return "Échec";
    case "pending":
      return "En attente";
    default:
      return "Manquant";
  }
}
