export type SmsLanguage = "fr" | "en";

export type OpeningSmsInput = {
  businessName: string;
  serviceName: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  offerLabel?: string | null;
  customerFirstName?: string | null;
  language: SmsLanguage;
  replyKeyword?: string;
  includeOptOut?: boolean;
};

export type OpeningConfirmationSmsInput = {
  businessName: string;
  serviceName: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  customerFirstName?: string | null;
  language: SmsLanguage;
  includeOptOut?: boolean;
};

export type GeneratedSmsMessage = {
  body: string;
  language: SmsLanguage;
  characterCount: number;
  estimatedSegments: number;
  warnings: string[];
};

export type ConsentRequestSmsInput = {
  businessName: string;
  customerFirstName: string | null;
  language: SmsLanguage;
};

const SMS_SEGMENT_LENGTH = 160;

function cleanText(value: string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parseDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatOpeningDateTime(value: Date | string, language: SmsLanguage) {
  const date = parseDate(value);

  if (!date) {
    return {
      dateLabel: language === "fr" ? "date a confirmer" : "date to confirm",
      timeLabel: language === "fr" ? "heure a confirmer" : "time to confirm",
      invalid: true
    };
  }

  return {
    dateLabel: date.toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }),
    timeLabel: date.toLocaleTimeString(language === "fr" ? "fr-CA" : "en-CA", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    invalid: false
  };
}

function estimateSmsSegments(characterCount: number) {
  return Math.max(1, Math.ceil(characterCount / SMS_SEGMENT_LENGTH));
}

export function generateOpeningSmsMessage(
  input: OpeningSmsInput
): GeneratedSmsMessage {
  const language = input.language;
  const warnings: string[] = [];
  const cleanedBusinessName = cleanText(input.businessName);
  const cleanedServiceName = cleanText(input.serviceName);
  const businessName =
    cleanedBusinessName || (language === "fr" ? "Votre commerce" : "Your business");
  const serviceName =
    cleanedServiceName || (language === "fr" ? "ce service" : "this service");
  const firstName = cleanText(input.customerFirstName);
  const offerLabel = cleanText(input.offerLabel);
  const replyKeyword =
    cleanText(input.replyKeyword) || (language === "fr" ? "OUI" : "YES");
  const includeOptOut = input.includeOptOut ?? true;
  const { dateLabel, timeLabel, invalid } = formatOpeningDateTime(
    input.startsAt,
    language
  );

  if (!cleanedBusinessName) {
    warnings.push("missing_business_name");
  }

  if (!cleanedServiceName) {
    warnings.push("missing_service_name");
  }

  if (invalid) {
    warnings.push("invalid_opening_time");
  }

  if (offerLabel.length > 80) {
    warnings.push("long_offer_label");
  }

  const greeting =
    firstName && language === "fr"
      ? `Bonjour ${firstName}, `
      : firstName
        ? `Hi ${firstName}, `
        : "";
  const offerSentence = offerLabel ? `${offerLabel}. ` : "";

  const body =
    language === "fr"
      ? `${greeting}${businessName}: place disponible pour ${serviceName} le ${dateLabel} a ${timeLabel}. ${offerSentence}Repondez ${replyKeyword} si interesse. Confirmation manuelle.${includeOptOut ? " STOP pour arret." : ""}`
      : `${greeting}${businessName}: spot available for ${serviceName} on ${dateLabel} at ${timeLabel}. ${offerSentence}Reply ${replyKeyword} if interested. Manual confirmation.${includeOptOut ? " Reply STOP to opt out." : ""}`;
  const characterCount = [...body].length;
  const estimatedSegments = estimateSmsSegments(characterCount);

  if (estimatedSegments > 1) {
    warnings.push("message_exceeds_single_segment");
  }

  return {
    body,
    language,
    characterCount,
    estimatedSegments,
    warnings
  };
}

export function generateOpeningConfirmationSmsMessage(
  input: OpeningConfirmationSmsInput
): GeneratedSmsMessage {
  const language = input.language === "en" ? "en" : "fr";
  const warnings: string[] = [];
  const cleanedBusinessName = cleanText(input.businessName);
  const cleanedServiceName = cleanText(input.serviceName);
  const businessName =
    cleanedBusinessName || (language === "fr" ? "Votre commerce" : "Your business");
  const serviceName =
    cleanedServiceName || (language === "fr" ? "ce service" : "this service");
  const firstName = cleanText(input.customerFirstName);
  const includeOptOut = input.includeOptOut ?? true;
  const { dateLabel, timeLabel, invalid } = formatOpeningDateTime(
    input.startsAt,
    language
  );

  if (!cleanedBusinessName) {
    warnings.push("missing_business_name");
  }

  if (!cleanedServiceName) {
    warnings.push("missing_service_name");
  }

  if (invalid) {
    warnings.push("invalid_opening_time");
  }

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
      ? `${greeting}${businessName} confirme votre place pour ${serviceName} le ${dateLabel} a ${timeLabel}. A bientot.${includeOptOut ? " STOP pour arret." : ""}`
      : `${greeting}${businessName} confirms your spot for ${serviceName} on ${dateLabel} at ${timeLabel}. See you soon.${includeOptOut ? " Reply STOP to opt out." : ""}`;
  const characterCount = [...body].length;
  const estimatedSegments = estimateSmsSegments(characterCount);

  if (estimatedSegments > 1) {
    warnings.push("message_exceeds_single_segment");
  }

  return {
    body,
    language,
    characterCount,
    estimatedSegments,
    warnings
  };
}

export function generateConsentRequestSmsMessage(
  input: ConsentRequestSmsInput
): GeneratedSmsMessage {
  const language = input.language === "fr" ? "fr" : "en";
  const warnings: string[] = [];
  const cleanedBusinessName = cleanText(input.businessName);
  const businessName =
    cleanedBusinessName || (language === "fr" ? "Votre commerce" : "Your business");
  const firstName = cleanText(input.customerFirstName);
  const greeting =
    language === "fr"
      ? firstName
        ? `Bonjour ${firstName}, `
        : "Bonjour, "
      : firstName
        ? `Hi ${firstName}, `
        : "Hi, ";

  if (!cleanedBusinessName) {
    warnings.push("missing_business_name");
  }

  const body =
    language === "fr"
      ? `${greeting}${businessName} utilise Open Spot pour envoyer des alertes de créneaux disponibles par SMS. Répondez OUI pour accepter. STOP pour refuser. Des frais de messagerie peuvent s'appliquer.`
      : `${greeting}${businessName} uses Open Spot to send SMS alerts for available appointment spots. Reply YES to opt in. Reply STOP to decline. Message and data rates may apply.`;
  const characterCount = [...body].length;
  const estimatedSegments = estimateSmsSegments(characterCount);

  if (estimatedSegments > 1) {
    warnings.push("message_exceeds_single_segment");
  }

  return {
    body,
    language,
    characterCount,
    estimatedSegments,
    warnings
  };
}
