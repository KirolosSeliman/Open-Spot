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
      compliance: "Conformité",
      reports: "Rapports",
      sms: "SMS"
    },
    auth: {
      createAccount: "Créer un compte",
      dashboard: "Tableau de bord",
      signIn: "Connexion",
      signOut: "Déconnexion"
    },
    common: {
      productName: "Open Spot",
      language: "Langue",
      french: "Français",
      english: "Anglais",
      tagline:
        "Remplissez vos annulations de dernière minute par SMS, sans changer votre système de rendez-vous actuel."
    },
    customers: {
      customers: "Clients",
      consentRequired: "Consentement requis",
      optedIn: "Inscrit",
      optedOut: "Désinscrit"
    },
    dashboard: {
      appointments: "Rendez-vous",
      appointmentsShort: "RDV",
      billing: "Abonnement",
      cancellations: "Annulations",
      messages: "Messages",
      overview: "Accueil",
      previewWorkspace: "Espace aperçu",
      recoverySms: "Récupération SMS",
      stats: "Statistiques",
      team: "Équipe",
      workspaceUnavailable:
        "Supabase non configuré : aperçu UI sans données persistées."
    },
    errors: {
      generic: "Une erreur est survenue.",
      retry: "Veuillez réessayer.",
      support: "Si le problème persiste, contactez le support."
    },
    import: {
      import: "Import",
      paste: "Coller",
      export: "Exporter"
    },
    marketing: {
      howItWorks: "Comment ça marche",
      whyOpenSpot: "Pourquoi Open Spot",
      bookCall: "Réserver un appel"
    },
    navigation: {
      dashboard: "Tableau de bord",
      pricing: "Tarifs",
      contact: "Contact",
      waitlist: "Liste d’attente",
      settings: "Paramètres",
      services: "Services"
    },
    onboarding: {
      onboarding: "Démarrage",
      businessSetup: "Configuration du commerce"
    },
    openings: {
      newCancellation: "Nouvelle annulation",
      openings: "Ouvertures",
      qrLink: "QR / lien"
    },
    reports: {
      reports: "Rapports",
      estimatedRecoveredRevenue: "Revenus récupérés estimés"
    },
    responses: {
      responses: "Réponses",
      manualValidation: "Validation manuelle",
      rankedByReceivedTime: "Classées par heure de réception"
    },
    services: {
      services: "Services"
    },
    settings: {
      settings: "Paramètres"
    },
    statuses: {
      needs_consent: "Consentement requis",
      opted_in: "Inscrit",
      opted_out: "Désinscrit",
      draft: "Brouillon",
      sending: "Envoi en cours",
      sent: "Envoyé",
      no_eligible_customers: "Aucun client admissible",
      replies_received: "Réponses reçues",
      customer_validated: "Client validé",
      expired: "Expiré",
      cancelled: "Annulé"
    },
    waitlist: {
      waitlist: "Liste d’attente",
      publicSignup: "Inscription publique"
    }
  }
};
