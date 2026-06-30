import type { Locale } from "@/lib/i18n/types";

export type OpeningOfferSmsInput = {
  locale: Locale;
  businessName: string;
  timeLabel: string;
  serviceName: string;
  offerText?: string;
};

export function renderOpeningOfferSms(input: OpeningOfferSmsInput) {
  const offerText = input.offerText?.trim() ? `${input.offerText.trim()} ` : "";

  if (input.locale === "fr") {
    return `${input.businessName} : une place s'est libérée ${input.timeLabel} pour ${input.serviceName}. ${offerText}Répondez OUI pour demander la place. STOP pour arrêter.`;
  }

  return `${input.businessName}: a last-minute spot opened ${input.timeLabel} for ${input.serviceName}. ${offerText}Reply YES to request it. STOP to unsubscribe.`;
}

export function renderConfirmationSms(businessName: string, timeLabel: string) {
  return `${businessName}: your last-minute appointment request for ${timeLabel} was confirmed by the merchant.`;
}

export function renderUnavailableSms(businessName: string, timeLabel: string) {
  return `${businessName}: the last-minute spot for ${timeLabel} is no longer available.`;
}
