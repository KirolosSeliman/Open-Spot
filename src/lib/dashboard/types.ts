export type Locale = "fr" | "en";

export type ClientStatus = "Actif" | "Désabonné" | "Bloqué" | "Invalide";
export type ConsentStatus = "consenti" | "a_confirmer" | "desinscrit";
export type CancellationStatus =
  | "Brouillon"
  | "Envoyée"
  | "Réponses reçues"
  | "Récupérée"
  | "Non récupérée"
  | "Fermée"
  | "Annulée";
export type ReplyStatus =
  | "En attente"
  | "Confirmé"
  | "Non retenu"
  | "À vérifier"
  | "Fermé";
export type ReplyIntent = "positive" | "negative" | "question" | "unknown";
export type TeamRole = "Owner" | "Manager" | "Employee" | "Read-only";

export type DashboardBusiness = {
  id: string;
  name: string;
  phone: string;
  address: string;
  website: string;
  timezone: string;
  mainLanguage: Locale;
  smsSender: string;
};

export type DashboardService = {
  id: string;
  name: string;
  durationMinutes: number;
  estimatedPriceCents: number;
  category: string;
  active: boolean;
};

export type DashboardClient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  preferredLanguage: Locale;
  interestedServices: string[];
  internalNotes: string;
  signupSource: string;
  smsConsent: ConsentStatus;
  status: ClientStatus;
  dateAdded: string;
  lastResponse: string;
  vip: boolean;
  availability: string;
};

export type SmsRecipient = {
  clientId: string;
  smsStatus: "Prêt" | "Envoyé" | "Livré" | "Erreur" | "Exclu";
  consentStatus: ConsentStatus;
};

export type SmsReply = {
  id: string;
  order: number;
  clientId: string;
  phone: string;
  rawBody: string;
  normalizedIntent: ReplyIntent;
  receivedAt: string;
  status: ReplyStatus;
  cancellationId: string;
  messageId: string;
};

export type CancellationOpportunity = {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  serviceId: string;
  employeeName: string;
  estimatedValueCents: number;
  status: CancellationStatus;
  clientsContacted: number;
  replies: number;
  confirmedClientId?: string;
  messageSent: string;
  internalNotes: string;
  recipients: SmsRecipient[];
  activity: ActivityLogEntry[];
};

export type ActivityLogEntry = {
  id: string;
  at: string;
  title: string;
  detail: string;
};

export type MessageTemplate = {
  id: string;
  name: string;
  locale: Locale | "manual";
  body: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "Invitation envoyée" | "Actif";
};

export type BillingState = {
  plan: string;
  status: string;
  renewalDate: string;
  smsUsed: number;
  smsLimit: number;
};
