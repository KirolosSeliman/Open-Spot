export const LEGAL_ROUTES = {
  privacy: "/politique-confidentialite",
  smsConsent: "/consentement-sms",
  terms: "/conditions-utilisation"
} as const;

/** Commercial name displayed on legal pages — not necessarily the incorporated legal entity name. */
export const LEGAL_ENTITY_NAME = "Open Spot";

const DEV_FALLBACK_EMAIL = "legal-contact-required@example.invalid";
const DEV_FALLBACK_ADDRESS = "Adresse légale à configurer avant production";

function isProductionLegalRuntime() {
  return (
    process.env.VERCEL_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

export function getLegalContactEmail() {
  const value = process.env.LEGAL_CONTACT_EMAIL?.trim();

  if (value) {
    return value;
  }

  if (isProductionLegalRuntime()) {
    throw new Error(
      "LEGAL_CONTACT_EMAIL must be configured before publishing legal pages."
    );
  }

  return DEV_FALLBACK_EMAIL;
}

export function getLegalBusinessAddress() {
  const value = process.env.LEGAL_BUSINESS_ADDRESS?.trim();

  if (value) {
    return value;
  }

  if (isProductionLegalRuntime()) {
    throw new Error(
      "LEGAL_BUSINESS_ADDRESS must be configured before publishing legal pages."
    );
  }

  return DEV_FALLBACK_ADDRESS;
}

export function assertProductionLegalConfig() {
  getLegalContactEmail();
  getLegalBusinessAddress();
}

/** Last update date for all legal pages (French format). */
export const LEGAL_LAST_UPDATED = "25 juin 2026";

export const LEGAL_EYEBROW = "INFORMATIONS LÉGALES";

export const LEGAL_SIDEBAR_NOTE_DEFAULT =
  "Ces informations peuvent être mises à jour à tout moment. Nous vous encourageons à les consulter régulièrement.";

export const LEGAL_SIDEBAR_NOTE_SMS =
  "Ces informations SMS peuvent être mises à jour à tout moment. Nous vous encourageons à les consulter régulièrement.";
