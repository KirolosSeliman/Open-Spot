import type { Dictionary, Locale } from "./types";

export const defaultLocale: Locale = "fr";

export const supportedLocales: Locale[] = ["en", "fr"];

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    admin: {
      admin: "Admin",
      audit: "Audit",
      compliance: "Compliance",
      reports: "Reports",
      sms: "SMS"
    },
    auth: {
      createAccount: "Create account",
      dashboard: "Dashboard",
      signIn: "Sign in",
      signOut: "Sign out"
    },
    common: {
      productName: "Open Spot",
      language: "Language",
      french: "French",
      english: "English",
      tagline:
        "Fill last-minute cancellations by SMS without changing your current booking system."
    },
    customers: {
      customers: "Customers",
      consentRequired: "Consent required",
      optedIn: "Opted in",
      optedOut: "Opted out"
    },
    dashboard: {
      appointments: "Appointments",
      appointmentsShort: "Appts",
      billing: "Billing",
      cancellations: "Cancellations",
      messages: "Messages",
      overview: "Overview",
      previewWorkspace: "Preview workspace",
      recoverySms: "SMS recovery",
      stats: "Analytics",
      team: "Team",
      workspaceUnavailable:
        "Supabase is not configured: UI preview without persisted data."
    },
    errors: {
      generic: "The request could not be completed.",
      retry: "Please try again.",
      support: "If the problem persists, contact support."
    },
    import: {
      import: "Import",
      paste: "Paste",
      export: "Export"
    },
    marketing: {
      howItWorks: "How it works",
      whyOpenSpot: "Why Open Spot",
      bookCall: "Book a call"
    },
    navigation: {
      dashboard: "Dashboard",
      pricing: "Pricing",
      contact: "Contact",
      waitlist: "Waitlist",
      settings: "Settings",
      services: "Services"
    },
    onboarding: {
      onboarding: "Onboarding",
      businessSetup: "Business setup"
    },
    openings: {
      newCancellation: "New cancellation",
      openings: "Openings",
      qrLink: "QR / link"
    },
    reports: {
      reports: "Reports",
      estimatedRecoveredRevenue: "Estimated recovered revenue"
    },
    responses: {
      responses: "Responses",
      manualValidation: "Manual validation",
      rankedByReceivedTime: "Ranked by received time"
    },
    services: {
      services: "Services"
    },
    settings: {
      settings: "Settings"
    },
    statuses: {
      needs_consent: "Consent required",
      opted_in: "Opted in",
      opted_out: "Opted out",
      draft: "Draft",
      sending: "Sending",
      sent: "Sent",
      no_eligible_customers: "No eligible customers",
      replies_received: "Replies received",
      customer_validated: "Customer validated",
      expired: "Expired",
      cancelled: "Cancelled"
    },
    waitlist: {
      waitlist: "Waitlist",
      publicSignup: "Public signup"
    }
  },
  fr: {
    admin: {
      admin: "Admin",
      audit: "Audit",
      compliance: "Conformite",
      reports: "Rapports",
      sms: "SMS"
    },
    auth: {
      createAccount: "Creer un compte",
      dashboard: "Tableau de bord",
      signIn: "Connexion",
      signOut: "Deconnexion"
    },
    common: {
      productName: "Open Spot",
      language: "Langue",
      french: "Francais",
      english: "Anglais",
      tagline:
        "Remplissez vos annulations de derniere minute par SMS, sans changer votre systeme de rendez-vous actuel."
    },
    customers: {
      customers: "Clients",
      consentRequired: "Consentement requis",
      optedIn: "Inscrit",
      optedOut: "Desinscrit"
    },
    dashboard: {
      appointments: "Rendez-vous",
      appointmentsShort: "RDV",
      billing: "Abonnement",
      cancellations: "Annulations",
      messages: "Messages",
      overview: "Accueil",
      previewWorkspace: "Espace apercu",
      recoverySms: "Recuperation SMS",
      stats: "Statistiques",
      team: "Equipe",
      workspaceUnavailable:
        "Supabase non configure : apercu UI sans donnees persistees."
    },
    errors: {
      generic: "Une erreur est survenue.",
      retry: "Veuillez reessayer.",
      support: "Si le probleme persiste, contactez le support."
    },
    import: {
      import: "Import",
      paste: "Coller",
      export: "Exporter"
    },
    marketing: {
      howItWorks: "Comment ca marche",
      whyOpenSpot: "Pourquoi Open Spot",
      bookCall: "Reserver un appel"
    },
    navigation: {
      dashboard: "Tableau de bord",
      pricing: "Tarifs",
      contact: "Contact",
      waitlist: "Liste d'attente",
      settings: "Parametres",
      services: "Services"
    },
    onboarding: {
      onboarding: "Demarrage",
      businessSetup: "Configuration du commerce"
    },
    openings: {
      newCancellation: "Nouvelle annulation",
      openings: "Ouvertures",
      qrLink: "QR / lien"
    },
    reports: {
      reports: "Rapports",
      estimatedRecoveredRevenue: "Revenu recupere estime"
    },
    responses: {
      responses: "Reponses",
      manualValidation: "Validation manuelle",
      rankedByReceivedTime: "Classees par heure de reception"
    },
    services: {
      services: "Services"
    },
    settings: {
      settings: "Parametres"
    },
    statuses: {
      needs_consent: "Consentement requis",
      opted_in: "Inscrit",
      opted_out: "Desinscrit",
      draft: "Brouillon",
      sending: "Envoi en cours",
      sent: "Envoye",
      no_eligible_customers: "Aucun client admissible",
      replies_received: "Reponses recues",
      customer_validated: "Client valide",
      expired: "Expire",
      cancelled: "Annule"
    },
    waitlist: {
      waitlist: "Liste d'attente",
      publicSignup: "Inscription publique"
    }
  }
};
