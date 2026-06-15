export type Locale = "en" | "fr";

export type CopyNamespace = Record<string, string>;

export type Dictionary = {
  admin: CopyNamespace;
  auth: CopyNamespace;
  common: CopyNamespace;
  customers: CopyNamespace;
  dashboard: CopyNamespace;
  errors: CopyNamespace;
  import: CopyNamespace;
  marketing: CopyNamespace;
  navigation: CopyNamespace;
  onboarding: CopyNamespace;
  openings: CopyNamespace;
  reports: CopyNamespace;
  responses: CopyNamespace;
  services: CopyNamespace;
  settings: CopyNamespace;
  statuses: CopyNamespace;
  waitlist: CopyNamespace;
};
