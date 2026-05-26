import { generateCancellationSms } from "./message-generation";
import type {
  BillingState,
  CancellationOpportunity,
  DashboardBusiness,
  DashboardClient,
  DashboardService,
  MessageTemplate,
  SmsReply,
  TeamMember
} from "./types";

export const dashboardBusiness: DashboardBusiness = {
  id: "business_demo_salon",
  name: "Salon Demo 2e Chance",
  phone: "+1 514 555 0142",
  address: "1200 rue Saint-Denis, Montréal, QC",
  website: "https://2echancerdv.ca",
  timezone: "America/Toronto",
  mainLanguage: "fr",
  smsSender: "+1 438 555 0101"
};

export const dashboardServices: DashboardService[] = [
  {
    id: "service_cut",
    name: "Coupe régulière",
    durationMinutes: 45,
    estimatedPriceCents: 5500,
    category: "Coiffure",
    active: true
  },
  {
    id: "service_color",
    name: "Coloration racines",
    durationMinutes: 90,
    estimatedPriceCents: 12000,
    category: "Coiffure",
    active: true
  },
  {
    id: "service_nails",
    name: "Pose gel",
    durationMinutes: 60,
    estimatedPriceCents: 7000,
    category: "Onglerie",
    active: true
  },
  {
    id: "service_massage",
    name: "Massage détente",
    durationMinutes: 60,
    estimatedPriceCents: 9500,
    category: "Bien-être",
    active: false
  }
];

export const dashboardClients: DashboardClient[] = [
  {
    id: "client_maya",
    name: "Maya Tremblay",
    phone: "+1 514 555 1001",
    email: "maya@example.com",
    preferredLanguage: "fr",
    interestedServices: ["Coupe régulière", "Coloration racines"],
    internalNotes: "Préfère les après-midis. Répond vite aux SMS.",
    signupSource: "QR code comptoir",
    smsConsent: "consenti",
    status: "Actif",
    dateAdded: "2026-04-11",
    lastResponse: "Oui, je peux venir !",
    vip: true,
    availability: "Disponible aujourd'hui"
  },
  {
    id: "client_sarah",
    name: "Sarah Nguyen",
    phone: "+1 514 555 1002",
    preferredLanguage: "fr",
    interestedServices: ["Coupe régulière"],
    internalNotes: "Intéressée par les créneaux de semaine.",
    signupSource: "Import CSV",
    smsConsent: "consenti",
    status: "Actif",
    dateAdded: "2026-04-18",
    lastResponse: "Oui, dispo à 14h30",
    vip: false,
    availability: "Disponible aujourd'hui"
  },
  {
    id: "client_lina",
    name: "Lina Haddad",
    phone: "+1 514 555 1003",
    preferredLanguage: "fr",
    interestedServices: ["Pose gel", "Coupe régulière"],
    internalNotes: "Cliente fidèle, éviter les matins.",
    signupSource: "Formulaire public",
    smsConsent: "consenti",
    status: "Actif",
    dateAdded: "2026-03-29",
    lastResponse: "Merci mais pas dispo aujourd'hui",
    vip: false,
    availability: "Soirs seulement"
  },
  {
    id: "client_emma",
    name: "Emma Roy",
    phone: "+1 514 555 1004",
    preferredLanguage: "en",
    interestedServices: ["Massage détente"],
    internalNotes: "A demandé les messages en anglais.",
    signupSource: "Lien Instagram",
    smsConsent: "a_confirmer",
    status: "Actif",
    dateAdded: "2026-05-02",
    lastResponse: "Can you do later?",
    vip: false,
    availability: "À vérifier"
  },
  {
    id: "client_noah",
    name: "Noah Smith",
    phone: "+1 514 555 1005",
    preferredLanguage: "en",
    interestedServices: ["Coupe régulière"],
    internalNotes: "Désinscrit manuellement après demande STOP.",
    signupSource: "Ancienne liste",
    smsConsent: "desinscrit",
    status: "Désabonné",
    dateAdded: "2026-02-20",
    lastResponse: "STOP",
    vip: false,
    availability: "Exclu SMS"
  }
];

const sentMessage = generateCancellationSms({
  locale: "fr",
  businessName: dashboardBusiness.name,
  appointmentDate: "26 mai 2026",
  appointmentTime: "14:30",
  serviceName: "Coupe régulière"
});

export const dashboardCancellations: CancellationOpportunity[] = [
  {
    id: "cancel_1430",
    date: "2026-05-26",
    time: "14:30",
    durationMinutes: 45,
    serviceId: "service_cut",
    employeeName: "Amélie",
    estimatedValueCents: 5500,
    status: "Récupérée",
    clientsContacted: 3,
    replies: 3,
    confirmedClientId: "client_sarah",
    messageSent: sentMessage,
    internalNotes: "Client initial a annulé à 10:12. Prioriser liste d'attente coupe.",
    recipients: [
      { clientId: "client_maya", smsStatus: "Livré", consentStatus: "consenti" },
      { clientId: "client_sarah", smsStatus: "Livré", consentStatus: "consenti" },
      { clientId: "client_lina", smsStatus: "Livré", consentStatus: "consenti" }
    ],
    activity: [
      {
        id: "act_1",
        at: "2026-05-26T10:12:00-04:00",
        title: "Annulation créée",
        detail: "Créneau de 14:30 marqué disponible par l'équipe."
      },
      {
        id: "act_2",
        at: "2026-05-26T10:14:00-04:00",
        title: "SMS envoyé",
        detail: "3 clients admissibles contactés avec consentement SMS."
      },
      {
        id: "act_3",
        at: "2026-05-26T10:17:18-04:00",
        title: "Client confirmé manuellement",
        detail: "Sarah Nguyen confirmée par Amélie. Aucun autre client confirmé automatiquement."
      }
    ]
  },
  {
    id: "cancel_1600",
    date: "2026-05-26",
    time: "16:00",
    durationMinutes: 60,
    serviceId: "service_nails",
    employeeName: "Nora",
    estimatedValueCents: 7000,
    status: "Réponses reçues",
    clientsContacted: 4,
    replies: 1,
    messageSent: generateCancellationSms({
      locale: "fr",
      businessName: dashboardBusiness.name,
      appointmentDate: "26 mai 2026",
      appointmentTime: "16:00",
      serviceName: "Pose gel"
    }),
    internalNotes: "Attendre une deuxième réponse avant décision.",
    recipients: [
      { clientId: "client_lina", smsStatus: "Livré", consentStatus: "consenti" },
      { clientId: "client_maya", smsStatus: "Livré", consentStatus: "consenti" }
    ],
    activity: [
      {
        id: "act_4",
        at: "2026-05-26T11:04:00-04:00",
        title: "Alerte envoyée",
        detail: "Alerte SMS envoyée aux clients intéressés par onglerie."
      }
    ]
  },
  {
    id: "cancel_0900",
    date: "2026-05-25",
    time: "09:00",
    durationMinutes: 90,
    serviceId: "service_color",
    employeeName: "Amélie",
    estimatedValueCents: 12000,
    status: "Non récupérée",
    clientsContacted: 6,
    replies: 0,
    messageSent: generateCancellationSms({
      locale: "fr",
      businessName: dashboardBusiness.name,
      appointmentDate: "25 mai 2026",
      appointmentTime: "09:00",
      serviceName: "Coloration racines"
    }),
    internalNotes: "Créneau trop tôt. Aucune réponse reçue avant fermeture.",
    recipients: [],
    activity: [
      {
        id: "act_5",
        at: "2026-05-25T07:10:00-04:00",
        title: "Créneau fermé",
        detail: "Aucune réponse admissible reçue à temps."
      }
    ]
  }
];

const unsortedDashboardReplies: SmsReply[] = [
  {
    id: "reply_1",
    order: 1,
    clientId: "client_maya",
    phone: "+1 514 555 1001",
    rawBody: "Oui, je peux venir !",
    normalizedIntent: "positive",
    receivedAt: "2026-05-26T10:15:04-04:00",
    status: "En attente",
    cancellationId: "cancel_1430",
    messageId: "msg_1430"
  },
  {
    id: "reply_2",
    order: 2,
    clientId: "client_sarah",
    phone: "+1 514 555 1002",
    rawBody: "Oui, dispo à 14h30",
    normalizedIntent: "positive",
    receivedAt: "2026-05-26T10:16:22-04:00",
    status: "Confirmé",
    cancellationId: "cancel_1430",
    messageId: "msg_1430"
  },
  {
    id: "reply_3",
    order: 3,
    clientId: "client_lina",
    phone: "+1 514 555 1003",
    rawBody: "Merci mais pas dispo aujourd'hui",
    normalizedIntent: "negative",
    receivedAt: "2026-05-26T10:18:51-04:00",
    status: "Non retenu",
    cancellationId: "cancel_1430",
    messageId: "msg_1430"
  }
];

export const dashboardReplies: SmsReply[] = unsortedDashboardReplies.sort(
  (a, b) =>
    new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
);

export const dashboardTemplates: MessageTemplate[] = [
  {
    id: "opening_fr",
    name: "Last-minute opening FR",
    locale: "fr",
    body: "Bonjour, une place vient de se libérer chez {business_name} le {appointment_date} à {appointment_time} pour {service_name}. Répondez {reply_keyword} si vous êtes intéressé. Votre rendez-vous sera confirmé seulement après validation par notre équipe."
  },
  {
    id: "opening_en",
    name: "Last-minute opening EN",
    locale: "en",
    body: "Hi, a spot just opened at {business_name} on {appointment_date} at {appointment_time} for {service_name}. Reply {reply_keyword} if you are interested. Your appointment will only be confirmed after our team validates it."
  },
  {
    id: "confirmation_fr",
    name: "Confirmation FR",
    locale: "fr",
    body: "Votre rendez-vous chez {business_name} est confirmé pour {service_name} le {appointment_date} à {appointment_time}."
  },
  {
    id: "confirmation_en",
    name: "Confirmation EN",
    locale: "en",
    body: "Your appointment at {business_name} is confirmed for {service_name} on {appointment_date} at {appointment_time}."
  },
  {
    id: "not_selected_fr",
    name: "Not selected FR",
    locale: "fr",
    body: "Merci pour votre réponse. Cette place n'est plus disponible, mais nous vous écrirons dès qu'un autre créneau se libère."
  },
  {
    id: "not_selected_en",
    name: "Not selected EN",
    locale: "en",
    body: "Thanks for replying. This spot is no longer available, but we'll message you when another one opens."
  },
  {
    id: "manual",
    name: "Manual message",
    locale: "manual",
    body: "Message libre à personnaliser avant l'envoi."
  },
  {
    id: "opt_out",
    name: "Opt-out acknowledgement",
    locale: "manual",
    body: "Vous êtes désinscrit des alertes SMS. Répondez AIDE si vous avez besoin d'assistance."
  }
];

export const dashboardTeam: TeamMember[] = [
  {
    id: "team_owner",
    name: "Kirolos Seliman",
    email: "owner@example.com",
    role: "Owner",
    status: "Actif"
  },
  {
    id: "team_manager",
    name: "Amélie Fortin",
    email: "manager@example.com",
    role: "Manager",
    status: "Actif"
  },
  {
    id: "team_employee",
    name: "Nora B.",
    email: "nora@example.com",
    role: "Employee",
    status: "Invitation envoyée"
  }
];

export const dashboardBilling: BillingState = {
  plan: "Croissance",
  status: "Configuration requise",
  renewalDate: "2026-06-26",
  smsUsed: 284,
  smsLimit: 1000
};

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export function findClient(clientId?: string) {
  return dashboardClients.find((client) => client.id === clientId);
}

export function findService(serviceId: string) {
  return dashboardServices.find((service) => service.id === serviceId);
}

export function findCancellation(cancellationId: string) {
  return dashboardCancellations.find(
    (cancellation) => cancellation.id === cancellationId
  );
}
