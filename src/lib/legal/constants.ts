export const LEGAL_ROUTES = {
  privacy: "/politique-confidentialite",
  smsConsent: "/consentement-sms",
  terms: "/conditions-utilisation"
} as const;

/** Commercial name displayed on legal pages — not necessarily the incorporated legal entity name. */
export const LEGAL_ENTITY_NAME = "Open Spot";

/** TODO: Replace with the official legal contact email once confirmed by the business. */
export const LEGAL_CONTACT_EMAIL = "À compléter";

/** TODO: Replace with the official business address once confirmed, if applicable. */
export const LEGAL_ADDRESS = "À compléter, si applicable";

/** Last update date for all legal pages (French format). */
export const LEGAL_LAST_UPDATED = "25 juin 2026";

export const LEGAL_EYEBROW = "INFORMATIONS LÉGALES";

export const LEGAL_SIDEBAR_NOTE_DEFAULT =
  "Ces informations peuvent être mises à jour à tout moment. Nous vous encourageons à les consulter régulièrement.";

export const LEGAL_SIDEBAR_NOTE_SMS =
  "Ces informations SMS peuvent être mises à jour à tout moment. Nous vous encourageons à les consulter régulièrement.";
