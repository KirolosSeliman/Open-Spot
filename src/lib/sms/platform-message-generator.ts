export type PlatformSmsLanguage = "fr" | "en";

export type BookCallConfirmationSmsInput = {
  firstName?: string | null;
  language: PlatformSmsLanguage;
};

export type BillingPaymentReminderSmsInput = {
  contactName?: string | null;
  businessName: string;
  billingPeriod: string;
  amountDue: string;
  paymentUrl?: string | null;
  language: PlatformSmsLanguage;
};

function cleanText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function firstNameFromFullName(fullName: string | null | undefined) {
  return cleanText(fullName).split(/\s+/)[0] ?? "";
}

export function generateBookCallConfirmationSmsMessage(
  input: BookCallConfirmationSmsInput
) {
  const language = input.language === "en" ? "en" : "fr";
  const firstName = cleanText(input.firstName);
  const greeting =
    language === "fr"
      ? firstName
        ? `Bonjour ${firstName}, `
        : "Bonjour, "
      : firstName
        ? `Hi ${firstName}, `
        : "Hi, ";

  const body =
    language === "fr"
      ? `${greeting}Open Spot a bien recu votre demande d'appel. On vous recontactera bientot pour discuter de vos annulations et voir comment recuperer vos rendez-vous perdus. Repondez STOP pour vous desinscrire.`
      : `${greeting}Open Spot has received your call request. We'll contact you soon to discuss your cancellations and how to recover lost appointments. Reply STOP to unsubscribe.`;

  return {
    body,
    language
  };
}

export function generateBillingPaymentReminderSmsMessage(
  input: BillingPaymentReminderSmsInput
) {
  const language = input.language === "en" ? "en" : "fr";
  const contactName =
    cleanText(input.contactName) ||
    (language === "fr" ? "Bonjour" : "Hi");
  const businessName =
    cleanText(input.businessName) ||
    (language === "fr" ? "votre commerce" : "your business");
  const billingPeriod =
    cleanText(input.billingPeriod) ||
    (language === "fr" ? "la periode en cours" : "the current period");
  const amountDue =
    cleanText(input.amountDue) ||
    (language === "fr" ? "le montant du" : "the amount due");
  const paymentUrl = cleanText(input.paymentUrl);
  const paymentLinkSentence = paymentUrl
    ? language === "fr"
      ? `. Paiement : ${paymentUrl}`
      : `. Payment: ${paymentUrl}`
    : "";

  const greeting =
    language === "fr"
      ? contactName === "Bonjour"
        ? "Bonjour, "
        : `Bonjour ${contactName}, `
      : contactName === "Hi"
        ? "Hi, "
        : `Hi ${contactName}, `;

  const body =
    language === "fr"
      ? `${greeting}rappel Open Spot : la facture de ${businessName} pour ${billingPeriod} est prete. Montant du : ${amountDue}. Merci de proceder au paiement des que possible${paymentLinkSentence}. Repondez STOP pour vous desinscrire.`
      : `${greeting}Open Spot reminder: the invoice for ${businessName} for ${billingPeriod} is ready. Amount due: ${amountDue}. Please complete payment when possible${paymentLinkSentence}. Reply STOP to unsubscribe.`;

  return {
    body,
    language
  };
}

export function getFirstNameForBookCall(fullName: string) {
  return firstNameFromFullName(fullName);
}

export function formatBillingPeriodLabel({
  periodStart,
  language
}: {
  periodStart: string | null;
  language: PlatformSmsLanguage;
}) {
  if (!periodStart) {
    return language === "fr" ? "la periode en cours" : "the current period";
  }

  const date = new Date(periodStart);

  if (Number.isNaN(date.getTime())) {
    return language === "fr" ? "la periode en cours" : "the current period";
  }

  return date.toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
    month: "long",
    year: "numeric"
  });
}

export function formatBillingAmount({
  amountCents,
  currency,
  language
}: {
  amountCents: number;
  currency: string;
  language: PlatformSmsLanguage;
}) {
  return new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: currency || "CAD"
  }).format(amountCents / 100);
}
