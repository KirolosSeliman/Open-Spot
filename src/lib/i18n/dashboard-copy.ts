import type { Locale } from "./types";

export const dashboardCopy = {
  en: {
    common: {
      all: "All",
      applyFilters: "Apply filters",
      clear: "Clear",
      customer: "Customer",
      customers: "Customers",
      dateUnknown: "Unknown date",
      end: "End",
      filter: "Filter",
      filters: "Filters",
      language: "Language",
      notes: "Notes",
      phoneUnknown: "Unknown phone",
      reset: "Reset",
      save: "Save",
      search: "Search",
      service: "Service",
      serviceNotSpecified: "Service not specified",
      start: "Start",
      status: "Status",
      timeUnknown: "Unknown time"
    },
    dashboard: {
      title: (organizationName: string) => `${organizationName} Dashboard`,
      description: (organizationName: string) =>
        `Your workspace is ready. ${organizationName} is now using real data and operational statuses.`,
      newCancellation: "New cancellation",
      metrics: {
        customers: ["Customers", "Real customers linked to this organization."],
        services: ["Services", "Real services configured in your workspace."],
        waitlist: ["Waitlist", "Real waitlist entries."],
        openCancellations: [
          "Open cancellations",
          "Recorded cancellation opportunities."
        ],
        smsSent: ["SMS sent", "Outbound messages recorded for this organization."],
        recoveredAppointments: [
          "Recovered appointments",
          "Manual confirmations only."
        ],
        pendingResponses: [
          "Pending responses",
          "Offers with a customer response awaiting a manual decision."
        ],
        recoveredRevenue: [
          "Estimated recovered revenue",
          "Total value of confirmed or completed appointments."
        ]
      },
      remindersPanel: {
        title: "Reminders and confirmations",
        description:
          "24-hour reminders and customer replies linked to existing appointments.",
        next7Days: ["Next 7 days", "Appointments scheduled in the next 7 days."],
        confirmed: ["Confirmed", "Customers who confirmed by SMS."],
        awaiting: ["Awaiting", "YES/NO requests without a customer reply."],
        failed: ["Failed reminders", "Reminders that need manual review."]
      },
      recoveryPanel: {
        title: "SMS cancellation recovery",
        description:
          "SMS cancellations converted into recoverable openings, without automatic confirmation.",
        smsCancellations: [
          "SMS cancellations",
          "Appointment cancellations detected from SMS replies."
        ],
        openingsCreated: [
          "Openings created",
          "Openings created from an SMS cancellation."
        ],
        recoveryReplies: [
          "Recovery replies",
          "Waitlist replies that are pending or reviewed."
        ],
        recoveredAfterSms: [
          "Recovered after SMS",
          "Only manually validated appointments are counted."
        ]
      },
      actions: {
        title: "Actions to review",
        description:
          "Work queues based on this organization's real data. Confirmations stay manual.",
        appointmentsNeedingFollowUp: [
          "Appointments without a reply",
          "Customers without a reply after a confirmation request."
        ],
        failedReminderSends: [
          "Failed reminders",
          "24-hour reminders that require manual review."
        ],
        cancellationsAwaitingAction: [
          "Cancellations to validate",
          "Recovery openings that have not been finalized."
        ],
        waitlistRespondentsAwaitingValidation: [
          "Waitlist replies to validate",
          "Customer replies waiting for a merchant decision."
        ]
      },
      setup: {
        title: "Initial setup",
        description: "Start by adding your services and customers.",
        items: [
          [
            "/dashboard/services",
            "Add your services",
            "Define the services that can fill a cancellation."
          ],
          [
            "/dashboard/clients",
            "Add your customers",
            "Import or add customers with their consent status."
          ],
          [
            "/dashboard/new-cancellation",
            "Create your first cancellation",
            "Prepare an opportunity without sending a real SMS."
          ],
          [
            "/dashboard/messages",
            "Review an SMS alert",
            "Check the message before sending it through a provider."
          ]
        ]
      },
      recentResponses: [
        "Recent responses",
        "No responses yet.",
        "Real SMS replies will appear here after an alert is sent and customers reply."
      ],
      recentCancellations: [
        "Recent cancellations",
        "No cancellations yet.",
        "Create a first cancellation to track contacted customers, received replies, and the final decision."
      ]
    },
    history: {
      eyebrow: "Open Spot",
      title: "History",
      descriptionLine1:
        "Real history of cancellation opportunities for this organization.",
      descriptionLine2: "Replies never automatically confirm a client.",
      newCancellation: "New cancellation",
      tableTitle: "History",
      columns: {
        title: "Title",
        start: "Start",
        end: "End",
        status: "Status",
        estimatedValue: "Estimated value",
        actions: "Actions"
      },
      pagination: {
        showing: "Showing",
        resultsPerPage: "results per page",
        range: (start: number, end: number, total: number) =>
          `${start}–${end} of ${total}`,
        previousPage: "Previous page",
        nextPage: "Next page",
        pageSizeLabel: "Results per page"
      },
      empty: {
        title: "No cancellations yet.",
        description:
          "Create a first cancellation to track contacted customers, received replies, and the final decision."
      },
      rowActions: {
        viewDetails: "View details",
        menuLabel: "Opening actions"
      }
    },
    newCancellation: {
      title: "New cancellation",
      description:
        "Create a last-minute opening, prepare eligible customers, and keep confirmation under manual control.",
      detailsTitle: "Opening details",
      titleLabel: "Title",
      anyService: "Any service",
      estimatedValue: "Estimated recovered value",
      offer: "Offer",
      offerPlaceholder: "15% today only",
      internalNote: "Internal note",
      eligibleCustomers: "Eligible customers",
      emptyEligibleTitle: "No eligible customers.",
      emptyEligibleDescription:
        "Add customers who have opted in to SMS communications to the waitlist before preparing an alert."
    },
    smsRuntime: {
      sendAlert: "Send SMS alert",
      unavailable: "SMS unavailable",
      ready:
        "Only customers who have opted in to SMS communications will be included in this alert.",
      notReady: (reason: string) => `SMS alerts are not ready: ${reason}`,
      plivoUnavailable: "This SMS provider is not available yet.",
      simulation:
        "SMS sending is currently in simulation. No real customer SMS will be sent."
    },
    appointments: {
      title: "Appointments",
      description:
        "Add the business's existing appointments to prepare 24-hour reminders and track confirmations without replacing the booking system.",
      addTitle: "Add appointment",
      chooseCustomer: "Choose a customer",
      reminder24h: "24-hour reminder",
      askYesNo: "Ask for YES/NO",
      submit: "Add appointment",
      save: "Save appointment",
      upcomingTitle: "Upcoming appointments",
      help:
        "The 24-hour reminder choice is saved on the appointment. If reminders are enabled and the customer has opted in, Open Spot prepares a scheduled message processed by the server SMS engine.",
      emptyTitle: "No appointments found.",
      emptyDescription:
        "Add an existing appointment to prepare upcoming SMS reminders. Real sends remain disabled until the scheduled provider flow is ready.",
      table: {
        appointment: "Appointment",
        statuses: "Statuses",
        edit: "Edit"
      },
      ranges: {
        all: "All",
        today: "Today",
        tomorrow: "Tomorrow",
        next_7_days: "7 days"
      },
      statuses: {
        all: "All",
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        cancelled: "Cancelled",
        completed: "Completed",
        no_show: "No-show"
      },
      reminderStates: {
        disabled: "Reminder disabled",
        sent: "Reminder sent",
        scheduled: "24-hour reminder active",
        failed: "Reminder failed",
        requested: "24-hour reminder requested"
      }
    },
    responses: {
      title: "Responses",
      description:
        "Track SMS replies by exact context: existing appointments or open-spot alerts.",
      tabs: {
        openings: "Open-spot alerts",
        appointments: "Appointment confirmations"
      },
      appointmentPanel: {
        title: "Appointment confirmations",
        description: "YES/NO reminder replies are grouped by appointment date.",
        emptyTitle: "No appointment confirmation replies received.",
        emptyDescription: "YES/NO reminder replies will appear here.",
        link: "View appointments"
      },
      openingsPanel: {
        title: "Open-spot alerts",
        description:
          "Each cancellation keeps its own reply list. A YES reply never confirms a customer automatically.",
        view: "View / validate this cancellation",
        emptyFilteredTitle: "No opening matches these filters.",
        emptyFilteredDescription: "Try a wider search or reset the filters.",
        emptyTitle: "No open-spot alerts yet.",
        emptyDescription:
          "Create a new cancellation to send an SMS alert to eligible customers."
      },
      filters: {
        period: "Opening period",
        searchAria: "Search open-spot alerts",
        searchPlaceholder: "Title, customer, phone, SMS...",
        allServices: "All services",
        displayed: (filtered: number, total: number) =>
          `${filtered} cancellation${filtered === 1 ? "" : "s"} shown out of ${total}.`,
        search: (query: string) => `Search: "${query}"`
      },
      ranges: {
        this_week: "This week",
        two_weeks: "2 weeks",
        one_month: "1 month",
        three_months: "3 months",
        all: "All"
      },
      counts: {
        responses: "responses",
        positives: "positive",
        noReply: "without reply",
        smsSent: "SMS sent"
      },
      labels: {
        received: "Received",
        rank: "Rank",
        offer: "Offer",
        awaitingManualValidation: "Awaiting manual validation"
      },
      classifications: {
        appointment_confirm: "Confirmed by customer",
        appointment_cancel: "Cancelled by customer",
        opt_out: "Unsubscribed",
        waitlist_positive: "Positive reply",
        unknown: "Unknown / other"
      },
      appointmentStatuses: {
        scheduled: "Scheduled",
        cancelled: "Cancelled",
        unknown: "Unknown status"
      },
      confirmationStatuses: {
        confirmed_by_client: "Confirmed by customer",
        cancelled_by_client: "Cancelled by customer",
        pending: "Pending",
        not_requested: "Not requested",
        unknown: "Unknown confirmation"
      },
      replyStatuses: {
        selected: "Manually confirmed",
        rejected: "Not selected",
        opt_out: "Unsubscribed",
        waitlist_positive: "Positive reply",
        unknown: "Unknown / other reply",
        no_reply: "SMS sent, no reply yet"
      }
    },
    settings: {
      title: "Settings",
      description: "Real organization settings and SMS safety controls.",
      currentBusiness: "Current business",
      businessName: "Business name",
      phone: "Phone",
      timezone: "Timezone",
      mainLanguage: "Main language",
      notConfigured: "Supabase is not configured",
      notProvided: "Not provided",
      automationBundles: "Automation bundles",
      automationDescription:
        "Only owners/admins should change these settings. This page is read-only until the settings edit flow is audited and setting changes can be logged safely.",
      currentAutomationSettings: "Current automation settings",
      currentAutomationDescription:
        "These controls show current database settings. They are disabled here until owner/admin updates are audited.",
      importExport: "Import / export",
      complianceBasics: "Compliance basics",
      complianceText:
        "Customers must have agreed to receive SMS before any message is sent. STOP, ARRET, and UNSUBSCRIBE keywords must automatically exclude unsubscribed customers from future alerts. Appointment recovery remains under manual merchant validation.",
      enabled: "Enabled",
      disabled: "Disabled",
      future: "Future",
      bundleDescriptions: {
        essential:
          "24-hour reminders, YES/OUI confirmation, NO/NON cancellation, STOP/ARRET handling, and message history.",
        noShow:
          "24-hour reminder tracking, non-response lists, no-show reporting, and conservative delay controls. Optional 2-hour reminders stay future until backend support is safe.",
        recovery:
          "SMS cancellations can create recoverable openings, alert customers who have opted in, rank respondents by timestamp, and keep merchant validation mandatory.",
        reactivation:
          "Optional winback messages for inactive clients. This requires stronger marketing consent review before any SMS is sent.",
        followUp:
          "Optional thank-you, review, and rebooking prompts. This remains off until consent and review-platform policies are reviewed."
      },
      settingLabels: {
        appointment_reminders_enabled: "Enable appointment reminders",
        default_reminder_delay_hours: "Reminder delay hours",
        appointment_confirmation_requests_enabled:
          "Request confirmation in reminder",
        client_sms_cancellation_enabled: "Enable client cancellation by SMS",
        auto_create_opening_on_sms_cancellation:
          "Auto-create opening on SMS cancellation",
        auto_send_recovery_sms_on_cancellation:
          "Auto-send recovery SMS after cancellation",
        unavailable_sms_to_non_selected_enabled:
          "Unavailable SMS to non-selected respondents",
        sms_daily_limit: "Daily SMS limit",
        sms_monthly_limit: "Monthly SMS limit"
      }
    }
  },
  fr: {
    common: {
      all: "Tous",
      applyFilters: "Appliquer les filtres",
      clear: "Effacer",
      customer: "Client",
      customers: "Clients",
      dateUnknown: "Date inconnue",
      end: "Fin",
      filter: "Filtrer",
      filters: "Filtres",
      language: "Langue",
      notes: "Notes",
      phoneUnknown: "Téléphone inconnu",
      reset: "Réinitialiser",
      save: "Enregistrer",
      search: "Recherche",
      service: "Service",
      serviceNotSpecified: "Service non précisé",
      start: "Début",
      status: "Statut",
      timeUnknown: "Heure inconnue"
    },
    dashboard: {
      title: (organizationName: string) =>
        `Tableau de bord de ${organizationName}`,
      description: (organizationName: string) =>
        `Votre espace est prêt. ${organizationName} utilise maintenant vos données réelles et vos états opérationnels.`,
      newCancellation: "Nouvelle annulation",
      metrics: {
        customers: ["Clients", "Clients réels rattachés à cette organisation."],
        services: ["Services", "Services réels configurés dans votre espace."],
        waitlist: ["Liste d’attente", "Entrées réelles dans la liste d’attente."],
        openCancellations: [
          "Annulations ouvertes",
          "Opportunités d’annulation enregistrées."
        ],
        smsSent: [
          "SMS envoyés",
          "Messages sortants enregistrés pour cette organisation."
        ],
        recoveredAppointments: [
          "Rendez-vous récupérés",
          "Confirmations manuelles seulement."
        ],
        pendingResponses: [
          "Réponses en attente",
          "Offres avec réponse client en attente de décision manuelle."
        ],
        recoveredRevenue: [
          "Revenus estimés récupérés",
          "Somme des rendez-vous confirmés ou complétés."
        ]
      },
      remindersPanel: {
        title: "Rappels et confirmations",
        description:
          "Rappels 24 h et réponses clients liés aux rendez-vous existants.",
        next7Days: [
          "Prochains 7 jours",
          "Rendez-vous prévus dans les 7 prochains jours."
        ],
        confirmed: ["Confirmés", "Clients ayant confirmé par SMS."],
        awaiting: ["En attente", "Demandes OUI/NON sans réponse client."],
        failed: ["Rappels échoués", "Rappels qui nécessitent une vérification."]
      },
      recoveryPanel: {
        title: "Récupération après annulation SMS",
        description:
          "Annulations SMS converties en ouvertures récupérables, avec décision finale par votre équipe.",
        smsCancellations: [
          "Annulations SMS",
          "Annulations de rendez-vous détectées par réponse SMS."
        ],
        openingsCreated: [
          "Ouvertures créées",
          "Ouvertures créées depuis une annulation SMS."
        ],
        recoveryReplies: [
          "Réponses de récupération",
          "Réponses de liste d’attente en attente ou traitées."
        ],
        recoveredAfterSms: [
          "Récupéré après SMS",
          "Seulement les validations marchandes confirmées."
        ]
      },
      actions: {
        title: "Actions à traiter",
        description:
          "Files de travail basées sur les données réelles de cette organisation. Les confirmations restent manuelles.",
        appointmentsNeedingFollowUp: [
          "Rendez-vous sans réponse",
          "Clients sans réponse après demande de confirmation."
        ],
        failedReminderSends: [
          "Rappels échoués",
          "Rappels 24 h qui demandent une vérification manuelle."
        ],
        cancellationsAwaitingAction: [
          "Annulations à valider",
          "Ouvertures de récupération non finalisées."
        ],
        waitlistRespondentsAwaitingValidation: [
          "Réponses de liste d’attente à valider",
          "Réponses client qui attendent une décision marchande."
        ]
      },
      setup: {
        title: "Configuration initiale",
        description: "Commencez par ajouter vos services et vos clients.",
        items: [
          [
            "/dashboard/services",
            "Ajouter vos services",
            "Définissez les prestations qui pourront remplir une annulation."
          ],
          [
            "/dashboard/clients",
            "Ajouter vos clients",
            "Importez ou ajoutez des clients avec leur statut de consentement."
          ],
          [
            "/dashboard/new-cancellation",
            "Créer votre première annulation",
            "Préparez une opportunité sans envoyer de SMS réel."
          ],
          [
            "/dashboard/messages",
            "Vérifier une alerte SMS",
            "Vérifiez le message avant tout envoi par un fournisseur."
          ]
        ]
      },
      recentResponses: [
        "Réponses récentes",
        "Aucune réponse pour le moment.",
        "Les réponses SMS réelles apparaîtront ici après l’envoi d’une alerte et la réception de réponses clients."
      ],
      recentCancellations: [
        "Annulations récentes",
        "Aucune annulation pour le moment.",
        "Créez une première annulation pour suivre les clients contactés, les réponses reçues et la décision finale."
      ]
    },
    history: {
      eyebrow: "Open Spot",
      title: "Historique",
      descriptionLine1:
        "Historique réel des opportunités d’annulation de cette organisation.",
      descriptionLine2:
        "Les réponses ne confirment jamais automatiquement un client.",
      newCancellation: "Nouvelle annulation",
      tableTitle: "Historique",
      columns: {
        title: "Titre",
        start: "Début",
        end: "Fin",
        status: "Statut",
        estimatedValue: "Valeur estimée",
        actions: "Actions"
      },
      pagination: {
        showing: "Affichage",
        resultsPerPage: "résultats par page",
        range: (start: number, end: number, total: number) =>
          `${start}–${end} sur ${total}`,
        previousPage: "Page précédente",
        nextPage: "Page suivante",
        pageSizeLabel: "Résultats par page"
      },
      empty: {
        title: "Aucune annulation pour le moment.",
        description:
          "Créez une première annulation pour suivre les clients contactés, les réponses reçues et la décision de confirmation."
      },
      rowActions: {
        viewDetails: "Voir les détails",
        menuLabel: "Actions sur l’annulation"
      }
    },
    newCancellation: {
      title: "Nouvelle annulation",
      description:
        "Créez une ouverture de dernière minute, préparez les clients admissibles et gardez la confirmation sous contrôle manuel.",
      detailsTitle: "Détails du créneau",
      titleLabel: "Titre",
      anyService: "Tous les services",
      estimatedValue: "Valeur récupérée estimée",
      offer: "Offre",
      offerPlaceholder: "15 % aujourd’hui seulement",
      internalNote: "Note interne",
      eligibleCustomers: "Clients admissibles",
      emptyEligibleTitle: "Aucun client admissible.",
      emptyEligibleDescription:
        "Ajoutez des clients ayant consenti aux communications SMS dans la liste d’attente avant de préparer une alerte."
    },
    smsRuntime: {
      sendAlert: "Envoyer l’alerte SMS",
      unavailable: "SMS indisponible",
      ready:
        "Seuls les clients ayant consenti aux communications SMS seront inclus dans cette alerte.",
      notReady: (reason: string) => `Les alertes SMS ne sont pas prêtes : ${reason}`,
      plivoUnavailable: "Ce fournisseur SMS n’est pas encore disponible.",
      simulation:
        "L’envoi SMS est actuellement en simulation. Aucun SMS réel ne sera envoyé aux clients."
    },
    appointments: {
      title: "Rendez-vous",
      description:
        "Ajoutez les rendez-vous existants du commerce afin de préparer les rappels 24 h et de suivre les confirmations sans remplacer le système de réservation.",
      addTitle: "Ajouter un rendez-vous",
      chooseCustomer: "Choisir un client",
      reminder24h: "Rappel 24 h",
      askYesNo: "Demander OUI/NON",
      submit: "Ajouter un rendez-vous",
      save: "Enregistrer le rendez-vous",
      upcomingTitle: "Rendez-vous à venir",
      help:
        "Le choix Rappel 24 h est enregistré sur le rendez-vous. Si les rappels sont activés et que le client a consenti aux SMS, Open Spot prépare un message planifié traité par le moteur SMS serveur.",
      emptyTitle: "Aucun rendez-vous trouvé.",
      emptyDescription:
        "Ajoutez un rendez-vous existant pour préparer les prochains rappels SMS. Les envois réels resteront désactivés jusqu’à ce que le flux planifié du fournisseur soit prêt.",
      table: {
        appointment: "Rendez-vous",
        statuses: "Statuts",
        edit: "Modifier"
      },
      ranges: {
        all: "Tous",
        today: "Aujourd’hui",
        tomorrow: "Demain",
        next_7_days: "7 jours"
      },
      statuses: {
        all: "Tous",
        scheduled: "Planifiés",
        confirmed: "Confirmés",
        cancelled: "Annulés",
        completed: "Terminés",
        no_show: "Absences"
      },
      reminderStates: {
        disabled: "Rappel désactivé",
        sent: "Rappel envoyé",
        scheduled: "Rappel 24 h actif",
        failed: "Rappel en erreur",
        requested: "Rappel 24 h demandé"
      }
    },
    responses: {
      title: "Réponses",
      description:
        "Suivez les réponses SMS par contexte exact : rendez-vous existants ou alertes de créneaux libres.",
      tabs: {
        openings: "Alertes de créneaux libres",
        appointments: "Confirmations rendez-vous"
      },
      appointmentPanel: {
        title: "Confirmations rendez-vous",
        description:
          "Les réponses OUI/NON aux rappels sont regroupées par date de rendez-vous.",
        emptyTitle: "Aucune réponse de confirmation de rendez-vous reçue.",
        emptyDescription: "Les réponses OUI/NON aux rappels apparaîtront ici.",
        link: "Voir les rendez-vous"
      },
      openingsPanel: {
        title: "Alertes de créneaux libres",
        description:
          "Chaque annulation garde sa propre liste de réponses. Un OUI ne confirme jamais automatiquement un client.",
        view: "Voir / valider cette annulation",
        emptyFilteredTitle: "Aucun créneau ne correspond à ces filtres.",
        emptyFilteredDescription:
          "Essayez une recherche plus large ou réinitialisez les filtres.",
        emptyTitle: "Aucune alerte de créneau libre pour le moment.",
        emptyDescription:
          "Créez une nouvelle annulation pour envoyer une alerte SMS aux clients admissibles."
      },
      filters: {
        period: "Période du créneau",
        searchAria: "Rechercher dans les alertes de créneaux libres",
        searchPlaceholder: "Titre, client, téléphone, SMS...",
        allServices: "Tous les services",
        displayed: (filtered: number, total: number) =>
          `${filtered} annulation${filtered > 1 ? "s" : ""} affichée${filtered > 1 ? "s" : ""} sur ${total}.`,
        search: (query: string) => `Recherche : « ${query} »`
      },
      ranges: {
        this_week: "Cette semaine",
        two_weeks: "2 semaines",
        one_month: "1 mois",
        three_months: "3 mois",
        all: "Tout"
      },
      counts: {
        responses: "réponses",
        positives: "positifs",
        noReply: "sans réponse",
        smsSent: "SMS envoyés"
      },
      labels: {
        received: "Reçu",
        rank: "Rang",
        offer: "Offre",
        awaitingManualValidation: "En attente de validation manuelle"
      },
      classifications: {
        appointment_confirm: "Confirmé par client",
        appointment_cancel: "Annulé par client",
        opt_out: "Désabonnement",
        waitlist_positive: "Réponse positive",
        unknown: "Inconnu / autre"
      },
      appointmentStatuses: {
        scheduled: "Planifié",
        cancelled: "Annulé",
        unknown: "Statut inconnu"
      },
      confirmationStatuses: {
        confirmed_by_client: "Confirmé par client",
        cancelled_by_client: "Annulé par client",
        pending: "En attente",
        not_requested: "Non demandé",
        unknown: "Confirmation inconnue"
      },
      replyStatuses: {
        selected: "Confirmé manuellement",
        rejected: "Non retenu",
        opt_out: "Désabonné",
        waitlist_positive: "Réponse positive",
        unknown: "Réponse inconnue/autre",
        no_reply: "SMS envoyé, pas encore répondu"
      }
    },
    settings: {
      title: "Paramètres",
      description: "Paramètres réels de l’organisation et contrôles de sécurité SMS.",
      currentBusiness: "Commerce actuel",
      businessName: "Nom du commerce",
      phone: "Téléphone",
      timezone: "Fuseau horaire",
      mainLanguage: "Langue principale",
      notConfigured: "Supabase non configuré",
      notProvided: "Non renseigné",
      automationBundles: "Ensembles d’automatisation",
      automationDescription:
        "Seuls les propriétaires et administrateurs devraient modifier ces paramètres. Cette page reste en lecture seule jusqu’à ce que le flux de modification soit audité et que les changements puissent être journalisés correctement.",
      currentAutomationSettings: "Paramètres d’automatisation actuels",
      currentAutomationDescription:
        "Ces contrôles affichent les paramètres actuels de la base de données. Ils sont désactivés ici jusqu’à l’audit des modifications par propriétaire ou administrateur.",
      importExport: "Import / export",
      complianceBasics: "Bases de conformité",
      complianceText:
        "Les clients doivent avoir accepté de recevoir des SMS avant tout envoi. Les mots-clés STOP, ARRET et UNSUBSCRIBE doivent exclure automatiquement les clients désinscrits des prochaines alertes. Les récupérations de rendez-vous restent sous validation manuelle du commerçant.",
      enabled: "Activé",
      disabled: "Désactivé",
      future: "Futur",
      bundleDescriptions: {
        essential:
          "Rappels 24 h, confirmation YES/OUI, annulation NO/NON, gestion STOP/ARRET et historique des messages.",
        noShow:
          "Suivi des rappels 24 h, listes sans réponse, rapports d’absences et contrôles de délai prudents. Les rappels optionnels 2 h restent futurs jusqu’à ce que le support backend soit sécurisé.",
        recovery:
          "Les annulations SMS peuvent créer des ouvertures récupérables, alerter les clients ayant consenti aux SMS, classer les répondants par heure de réponse et garder la validation marchande obligatoire.",
        reactivation:
          "Messages optionnels de réactivation pour les clients inactifs. Cela exige une revue plus stricte du consentement marketing avant tout envoi SMS.",
        followUp:
          "Messages optionnels de remerciement, d’avis et de nouvelle réservation. Cela reste désactivé jusqu’à la revue du consentement et des politiques des plateformes d’avis."
      },
      settingLabels: {
        appointment_reminders_enabled: "Activer les rappels de rendez-vous",
        default_reminder_delay_hours: "Délai de rappel en heures",
        appointment_confirmation_requests_enabled:
          "Demander une confirmation dans le rappel",
        client_sms_cancellation_enabled: "Activer l’annulation client par SMS",
        auto_create_opening_on_sms_cancellation:
          "Créer automatiquement une ouverture après annulation SMS",
        auto_send_recovery_sms_on_cancellation:
          "Envoyer automatiquement le SMS de récupération après annulation",
        unavailable_sms_to_non_selected_enabled:
          "SMS d’indisponibilité aux répondants non retenus",
        sms_daily_limit: "Limite SMS quotidienne",
        sms_monthly_limit: "Limite SMS mensuelle"
      }
    }
  }
} as const;

export type DashboardCopy = (typeof dashboardCopy)[Locale];

export function getDashboardCopy(locale: Locale) {
  return dashboardCopy[locale];
}

export function intlLocale(locale: Locale) {
  return locale === "en" ? "en-CA" : "fr-CA";
}
