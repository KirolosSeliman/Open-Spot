import type { Locale } from "@/lib/i18n/types";

export type SmsTemplateKey = "opening_alert" | "opening_confirmation";

export type SmsTemplateLanguage = "fr" | "en";

export const SMS_TEMPLATE_VARIABLES = [
  "{business_name}",
  "{service_name}",
  "{appointment_date}",
  "{appointment_time}",
  "{client_name}",
  "{business_address}",
  "{employee_name}",
  "{estimated_price}",
  "{reply_keyword}"
] as const;

export type SmsTemplateVariable = (typeof SMS_TEMPLATE_VARIABLES)[number];

export const SMS_TEMPLATE_NAME_MAX_LENGTH = 60;

export const SMS_TEMPLATE_DEFINITIONS: Record<
  SmsTemplateKey,
  {
    label: Record<SmsTemplateLanguage, string>;
    defaultName: Record<SmsTemplateLanguage, string>;
    defaultBody: Record<SmsTemplateLanguage, string>;
    requiresManualValidationHint?: boolean;
  }
> = {
  opening_alert: {
    label: {
      fr: "Alerte de créneau libre",
      en: "Slot alert"
    },
    defaultName: {
      fr: "Alerte de créneau libre — FR",
      en: "Slot alert — EN"
    },
    defaultBody: {
      fr: `Bonjour, une place vient de se libérer chez {business_name} le {appointment_date} à {appointment_time} pour {service_name}.

Répondez OUI si vous êtes intéressé.
Votre rendez-vous sera confirmé seulement après validation par notre équipe.`,
      en: `Hi, a spot just opened at {business_name} on {appointment_date} at {appointment_time} for {service_name}.

Reply YES if you are interested.
Your appointment will only be confirmed after our team validates it.`
    },
    requiresManualValidationHint: true
  },
  opening_confirmation: {
    label: {
      fr: "Confirmation manuelle",
      en: "Manual confirmation"
    },
    defaultName: {
      fr: "Confirmation manuelle — FR",
      en: "Manual confirmation — EN"
    },
    defaultBody: {
      fr: `Bonjour {client_name}, votre rendez-vous chez {business_name} est confirmé pour {service_name} le {appointment_date} à {appointment_time}. Adresse : {business_address}. À bientôt ! Répondez AIDE pour de l'aide ou STOP pour vous désinscrire.`,
      en: `Hi {client_name}, your appointment at {business_name} is confirmed for {service_name} on {appointment_date} at {appointment_time}. Address: {business_address}. See you soon! Reply HELP for help or STOP to unsubscribe.`
    }
  }
};

export const SMS_TEMPLATE_PREVIEW_SAMPLES: Record<
  SmsTemplateVariable,
  Record<SmsTemplateLanguage, string>
> = {
  "{business_name}": { fr: "Chez Kiro", en: "Chez Kiro" },
  "{service_name}": { fr: "Coupe régulière", en: "Regular haircut" },
  "{appointment_date}": { fr: "14 juin", en: "June 14" },
  "{appointment_time}": { fr: "14:30", en: "2:30 PM" },
  "{client_name}": { fr: "Alex", en: "Alex" },
  "{business_address}": {
    fr: "123 rue Saint-Laurent",
    en: "123 Saint-Laurent Street"
  },
  "{employee_name}": { fr: "Sarah", en: "Sarah" },
  "{estimated_price}": { fr: "85 $", en: "$85" },
  "{reply_keyword}": { fr: "OUI", en: "YES" }
};

const MANUAL_VALIDATION_PATTERNS = [
  /validation\s+(?:par\s+)?(?:notre\s+)?(?:équipe|equipe)/i,
  /confirm(?:é|e)?\s+seulement\s+apr/i,
  /manual\s+confirmation/i,
  /only\s+be\s+confirmed\s+after/i,
  /team\s+validates/i
];

const AUTOMATIC_CONFIRMATION_PATTERNS = [
  /confirm(?:ation|é|e)?\s+automatique/i,
  /automatic(?:ally)?\s+confirm/i,
  /premier\s+(?:client|qui)\s+.*confirm/i,
  /first\s+(?:to\s+reply|responder).*(?:confirm|booked)/i,
  /réservation\s+automatique/i,
  /automatic\s+booking/i,
  /vous\s+êtes\s+automatiquement\s+confirm/i
];

export function getDefaultTemplateName(
  templateKey: SmsTemplateKey,
  language: SmsTemplateLanguage
) {
  return SMS_TEMPLATE_DEFINITIONS[templateKey].defaultName[language];
}

export function getDefaultTemplateBody(
  templateKey: SmsTemplateKey,
  language: SmsTemplateLanguage
) {
  return SMS_TEMPLATE_DEFINITIONS[templateKey].defaultBody[language];
}

export function extractTemplateVariables(body: string) {
  const matches = body.match(/\{[a-z_]+\}/gi) ?? [];
  return [...new Set(matches.map((value) => value.toLowerCase()))];
}

export function findUnknownTemplateVariables(body: string) {
  const allowed = new Set<string>(SMS_TEMPLATE_VARIABLES);
  return extractTemplateVariables(body).filter((variable) => !allowed.has(variable));
}

export function validateSmsTemplateInput({
  templateKey,
  language,
  name,
  body
}: {
  templateKey: SmsTemplateKey;
  language: SmsTemplateLanguage;
  name: string;
  body: string;
}) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const trimmedName = name.trim();
  const trimmedBody = body.trim();

  if (!trimmedName) {
    errors.push("Le nom du template est requis.");
  }

  if (trimmedName.length > SMS_TEMPLATE_NAME_MAX_LENGTH) {
    errors.push(
      `Le nom du template ne peut pas dépasser ${SMS_TEMPLATE_NAME_MAX_LENGTH} caractères.`
    );
  }

  if (!trimmedBody) {
    errors.push("Le message ne peut pas être vide.");
  }

  if (language !== "fr" && language !== "en") {
    errors.push("La langue sélectionnée est invalide.");
  }

  const unknownVariables = findUnknownTemplateVariables(trimmedBody);

  for (const variable of unknownVariables) {
    warnings.push(`Variable inconnue : ${variable}`);
  }

  for (const pattern of AUTOMATIC_CONFIRMATION_PATTERNS) {
    if (pattern.test(trimmedBody)) {
      warnings.push(
        "Ce message suggère une confirmation automatique. Open Spot exige une validation manuelle par le commerce."
      );
      break;
    }
  }

  const definition = SMS_TEMPLATE_DEFINITIONS[templateKey];

  if (
    definition.requiresManualValidationHint &&
    !MANUAL_VALIDATION_PATTERNS.some((pattern) => pattern.test(trimmedBody))
  ) {
    warnings.push(
      "Ce message ne précise pas que la confirmation est manuelle. Open Spot recommande de garder une mention de validation manuelle."
    );
  }

  return {
    errors,
    warnings,
    isValid: errors.length === 0
  };
}

export function toSmsTemplateLanguage(locale: Locale): SmsTemplateLanguage {
  return locale === "en" ? "en" : "fr";
}
