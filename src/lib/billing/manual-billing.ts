import type { Locale } from "@/lib/i18n/types";

export const manualBillingStatuses = [
  "unpaid",
  "payment_link_sent",
  "paid",
  "past_due",
  "cancelled",
  "comped",
  "trial"
] as const;

export const billingIntervals = ["monthly", "yearly", "one_time", "custom"] as const;
export const paymentMethods = [
  "manual_external",
  "stripe_payment_link",
  "stripe_invoice",
  "interac",
  "other"
] as const;

export type ManualBillingStatus = (typeof manualBillingStatuses)[number];
export type BillingInterval = (typeof billingIntervals)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type BillingEventType =
  | "billing_created"
  | "payment_link_sent"
  | "marked_paid"
  | "marked_past_due"
  | "cancelled"
  | "status_changed"
  | "note_added"
  | "plan_updated"
  | "payment_reminder_sent";

export type ManualBillingInput = {
  planName: string;
  monthlyPriceCents: number;
  currency: string;
  billingInterval: BillingInterval;
  paymentMethod: PaymentMethod;
  externalPaymentUrl: string | null;
  externalCustomerReference: string | null;
  internalNotes: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePaymentLinkId: string | null;
  stripeInvoiceId: string | null;
};

export type ManualBillingValidation =
  | {
      ok: true;
      value: ManualBillingInput;
    }
  | {
      ok: false;
      errors: string[];
    };

const statusLabels: Record<Locale, Record<ManualBillingStatus, string>> = {
  fr: {
    unpaid: "Non payé",
    payment_link_sent: "Lien envoyé",
    paid: "Paiement reçu",
    past_due: "Paiement en retard",
    cancelled: "Compte annulé",
    comped: "Offert",
    trial: "Essai"
  },
  en: {
    unpaid: "Unpaid",
    payment_link_sent: "Payment link sent",
    paid: "Payment received",
    past_due: "Past due",
    cancelled: "Cancelled",
    comped: "Comped",
    trial: "Trial"
  }
};

const statusTones: Record<
  ManualBillingStatus,
  "default" | "info" | "success" | "warning" | "danger" | "dark"
> = {
  unpaid: "default",
  payment_link_sent: "info",
  paid: "success",
  past_due: "warning",
  cancelled: "dark",
  comped: "info",
  trial: "info"
};

const intervalLabels: Record<Locale, Record<BillingInterval, string>> = {
  fr: {
    monthly: "Mensuel",
    yearly: "Annuel",
    one_time: "Paiement unique",
    custom: "Personnalisé"
  },
  en: {
    monthly: "Monthly",
    yearly: "Yearly",
    one_time: "One-time",
    custom: "Custom"
  }
};

const methodLabels: Record<Locale, Record<PaymentMethod, string>> = {
  fr: {
    manual_external: "Manuel externe",
    stripe_payment_link: "Stripe Payment Link",
    stripe_invoice: "Stripe Invoice",
    interac: "Virement Interac",
    other: "Autre"
  },
  en: {
    manual_external: "Manual external",
    stripe_payment_link: "Stripe Payment Link",
    stripe_invoice: "Stripe Invoice",
    interac: "Interac transfer",
    other: "Other"
  }
};

function clean(value: FormDataEntryValue | string | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";

  return text.length > 0 ? text : null;
}

function parseMoneyToCents(value: FormDataEntryValue | string | null | undefined) {
  const raw = clean(value)?.replace(",", ".") ?? "";

  if (!raw) {
    return Number.NaN;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

function isHttpsUrl(value: string | null) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isManualBillingStatus(
  value: string | null | undefined
): value is ManualBillingStatus {
  return manualBillingStatuses.includes(value as ManualBillingStatus);
}

export function isBillingInterval(
  value: string | null | undefined
): value is BillingInterval {
  return billingIntervals.includes(value as BillingInterval);
}

export function isPaymentMethod(value: string | null | undefined): value is PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod);
}

export function getBillingStatusLabel(
  status: string | null | undefined,
  locale: Locale = "fr"
) {
  return isManualBillingStatus(status)
    ? statusLabels[locale][status]
    : locale === "fr"
      ? "Statut inconnu"
      : "Unknown status";
}

export function getBillingStatusTone(status: string | null | undefined) {
  return isManualBillingStatus(status) ? statusTones[status] : "default";
}

export function getBillingIntervalLabel(
  interval: string | null | undefined,
  locale: Locale = "fr"
) {
  return isBillingInterval(interval)
    ? intervalLabels[locale][interval]
    : interval ?? (locale === "fr" ? "Non défini" : "Not set");
}

export function getPaymentMethodLabel(
  method: string | null | undefined,
  locale: Locale = "fr"
) {
  return isPaymentMethod(method)
    ? methodLabels[locale][method]
    : method ?? (locale === "fr" ? "Non défini" : "Not set");
}

export function canBillingStatusSendSms(status: string | null | undefined) {
  return status === "paid" || status === "trial" || status === "comped";
}

export function normalizeManualBillingInput(formData: FormData): ManualBillingValidation {
  const errors: string[] = [];
  const planName = clean(formData.get("planName")) ?? "";
  const monthlyPriceCents = parseMoneyToCents(formData.get("monthlyPrice"));
  const currency = (clean(formData.get("currency")) ?? "CAD").toUpperCase();
  const intervalValue = clean(formData.get("billingInterval")) ?? "monthly";
  const paymentMethodValue = clean(formData.get("paymentMethod")) ?? "manual_external";
  const externalPaymentUrl = clean(formData.get("externalPaymentUrl"));
  const internalNotes = clean(formData.get("internalNotes"))?.slice(0, 2000) ?? null;

  if (!planName) {
    errors.push("The plan is required.");
  }

  if (!Number.isFinite(monthlyPriceCents) || monthlyPriceCents < 0) {
    errors.push("The monthly price must be valid.");
  }

  if (currency.length !== 3) {
    errors.push("Currency must be a 3-letter code.");
  }

  if (!isBillingInterval(intervalValue)) {
    errors.push("Billing interval is invalid.");
  }

  if (!isPaymentMethod(paymentMethodValue)) {
    errors.push("Payment method is invalid.");
  }

  if (!isHttpsUrl(externalPaymentUrl)) {
    errors.push("The payment link must be a valid HTTPS URL.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    value: {
      planName: planName.slice(0, 120),
      monthlyPriceCents,
      currency,
      billingInterval: intervalValue as BillingInterval,
      paymentMethod: paymentMethodValue as PaymentMethod,
      externalPaymentUrl,
      externalCustomerReference: clean(formData.get("externalCustomerReference")),
      internalNotes,
      stripeCustomerId: clean(formData.get("stripeCustomerId")),
      stripeSubscriptionId: clean(formData.get("stripeSubscriptionId")),
      stripePaymentLinkId: clean(formData.get("stripePaymentLinkId")),
      stripeInvoiceId: clean(formData.get("stripeInvoiceId"))
    }
  };
}

export function getNextPeriodEnd({
  start,
  interval
}: {
  start: Date;
  interval: string | null | undefined;
}) {
  const next = new Date(start);

  if (interval === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }

  if (interval === "monthly") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  return null;
}
