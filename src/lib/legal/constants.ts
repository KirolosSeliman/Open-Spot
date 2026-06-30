export const LEGAL_ROUTES = {
  privacy: "/politique-confidentialite",
  smsConsent: "/consentement-sms",
  terms: "/conditions-utilisation"
} as const;

/** Commercial name displayed on legal pages — not necessarily the incorporated legal entity name. */
export const LEGAL_ENTITY_NAME = "Open Spot";

function readRequiredProductionLegalValue(name: string, fallback: string) {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (process.env.VERCEL_ENV === "production") {
    throw new Error(`${name} must be configured before publishing legal pages.`);
  }

  return fallback;
}

export const LEGAL_CONTACT_EMAIL = readRequiredProductionLegalValue(
  "LEGAL_CONTACT_EMAIL",
  "legal-contact-required@example.invalid"
);

export const LEGAL_ADDRESS = readRequiredProductionLegalValue(
  "LEGAL_BUSINESS_ADDRESS",
  "Adresse légale à configurer avant production"
);

/** Last update date for all legal pages (French format). */
export const LEGAL_LAST_UPDATED = "25 juin 2026";

export const LEGAL_EYEBROW = "INFORMATIONS LÉGALES";

export const LEGAL_SIDEBAR_NOTE_DEFAULT =
  "Ces informations peuvent être mises à jour à tout moment. Nous vous encourageons à les consulter régulièrement.";

export const LEGAL_SIDEBAR_NOTE_SMS =
  "Ces informations SMS peuvent être mises à jour à tout moment. Nous vous encourageons à les consulter régulièrement.";
