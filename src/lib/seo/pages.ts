import type { MetadataRoute } from "next";

export type FaqItem = {
  question: string;
  answer: string;
};

export type RelatedLink = {
  label: string;
  href: string;
};

export type CommercialPageData = {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  problem: {
    title: string;
    paragraphs: string[];
  };
  solution: {
    title: string;
    paragraphs: string[];
  };
  howItWorks: {
    title: string;
    steps: string[];
  };
  smsExample: {
    title: string;
    message: string;
  };
  benefits: {
    title: string;
    items: string[];
  };
  manualConfirmation: {
    title: string;
    paragraphs: string[];
  };
  faq: FaqItem[];
  relatedLinks: RelatedLink[];
  sitemap: {
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
  };
};

export type ArticlePageData = {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: {
    title: string;
    paragraphs: string[];
    list?: string[];
  }[];
  practicalExample?: {
    title: string;
    content: string;
  };
  mistakesToAvoid?: {
    title: string;
    items: string[];
  };
  faq?: FaqItem[];
  relatedLinks: RelatedLink[];
  sitemap: {
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
  };
};

export const commercialPages: Record<string, CommercialPageData> = {
  "logiciel-sms-annulations-rendez-vous": {
    path: "/logiciel-sms-annulations-rendez-vous",
    title: "Logiciel SMS pour annulations de rendez-vous | Open Spot",
    description:
      "Open Spot aide les commerces à remplir les annulations de rendez-vous dernière minute par SMS, avec réponses clients et confirmation manuelle par le commerce.",
    h1: "Logiciel SMS pour remplir les annulations de rendez-vous",
    intro:
      "Quand un client annule à la dernière minute, chaque créneau vide représente du revenu perdu. Open Spot permet d'alerter rapidement une liste de clients intéressés par SMS. Les clients répondent simplement, et le commerce choisit manuellement qui confirmer.",
    problem: {
      title: "Le problème des annulations de dernière minute",
      paragraphs: [
        "Une annulation reçue quelques heures avant le rendez-vous laisse peu de temps pour réagir. Appeler les clients un par un est lent, imprévisible et difficile à tenir pendant une journée chargée.",
        "Sans processus clair, le créneau reste souvent vide. Le commerce perd une opportunité de revenu sans pour autant améliorer la relation client."
      ]
    },
    solution: {
      title: "La solution Open Spot",
      paragraphs: [
        "Open Spot complète votre logiciel de réservation existant. Dès qu'une annulation survient, vous pouvez proposer la place libérée à des clients déjà intéressés par SMS.",
        "Les réponses arrivent rapidement dans votre tableau de bord. Vous gardez toujours le contrôle final : le commerce confirme manuellement le client choisi."
      ]
    },
    howItWorks: {
      title: "Comment ça fonctionne",
      steps: [
        "Un client annule un rendez-vous de dernière minute.",
        "Vous sélectionnez la place libérée et les clients intéressés à contacter.",
        "Open Spot envoie un SMS clair avec une réponse simple (OUI, YES ou 1).",
        "Les réponses arrivent dans votre interface.",
        "Vous confirmez manuellement la personne que vous souhaitez recevoir."
      ]
    },
    smsExample: {
      title: "Exemple de SMS",
      message:
        "Bonjour Léa, une place vient de se libérer aujourd'hui à 15 h 30. Réponds OUI si tu es disponible. Réponds STOP pour te désinscrire."
    },
    benefits: {
      title: "Bénéfices pour votre commerce",
      items: [
        "Réagir plus vite qu'avec des appels téléphoniques un par un.",
        "Proposer une place disponible à des clients déjà intéressés.",
        "Réduire les créneaux vides sans changer votre logiciel de réservation.",
        "Garder une communication professionnelle par SMS."
      ]
    },
    manualConfirmation: {
      title: "Confirmation manuelle, toujours",
      paragraphs: [
        "Open Spot ne confirme jamais un rendez-vous à la place du commerce. Même si un client répond en premier, la décision finale reste entre vos mains.",
        "Cette approche évite les doubles réservations, respecte votre jugement professionnel et vous laisse choisir la meilleure personne selon le service, l'horaire ou le contexte."
      ]
    },
    faq: [
      {
        question: "Est-ce que le rendez-vous est confirmé automatiquement ?",
        answer:
          "Non. Le commerce garde toujours le contrôle final et confirme manuellement la personne choisie."
      },
      {
        question: "Est-ce que Open Spot remplace mon logiciel de réservation ?",
        answer:
          "Non. Open Spot complète le système existant pour gérer les annulations de dernière minute."
      },
      {
        question: "Est-ce adapté aux petits commerces ?",
        answer:
          "Oui, l'objectif est de rester simple, rapide et facile à utiliser au quotidien."
      }
    ],
    relatedLinks: [
      {
        label: "Liste d'attente SMS pour rendez-vous",
        href: "/liste-attente-sms-rendez-vous"
      },
      {
        label: "Comment remplir une annulation de rendez-vous",
        href: "/comment-remplir-annulation-rendez-vous"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.85 }
  },
  "liste-attente-sms-rendez-vous": {
    path: "/liste-attente-sms-rendez-vous",
    title: "Liste d'attente SMS pour rendez-vous | Open Spot",
    description:
      "Créez une liste d'attente SMS pour proposer rapidement les places libérées et récupérer des rendez-vous annulés sans automatiser la confirmation finale.",
    h1: "Liste d'attente SMS pour remplir les places qui se libèrent",
    intro:
      "Une liste d'attente SMS permet de contacter rapidement des clients intéressés lorsqu'une place se libère. Ils répondent simplement par SMS, et le commerce garde la confirmation manuelle.",
    problem: {
      title: "Sans liste d'attente, chaque annulation devient une course",
      paragraphs: [
        "Beaucoup de commerces savent quels clients seraient intéressés par un créneau, mais cette information reste dispersée : notes, mémoires, conversations informelles.",
        "Quand une annulation arrive, retrouver et joindre ces personnes prend du temps. Le créneau se vide pendant que vous cherchez qui contacter."
      ]
    },
    solution: {
      title: "Une liste d'attente SMS simple et actionnable",
      paragraphs: [
        "Open Spot centralise les clients intéressés par des places disponibles. Lors d'une annulation, vous proposez le créneau libéré par SMS à cette liste.",
        "Les clients répondent OUI, YES ou 1 s'ils sont disponibles. Ceux qui ne souhaitent plus recevoir d'alertes peuvent répondre STOP pour se désinscrire."
      ]
    },
    howItWorks: {
      title: "Comment ça fonctionne",
      steps: [
        "Constituez une liste de clients intéressés par des places disponibles.",
        "Quand une annulation survient, sélectionnez le créneau libéré.",
        "Envoyez une alerte SMS à la liste d'attente.",
        "Consultez les réponses reçues dans Open Spot.",
        "Confirmez manuellement le client que vous choisissez."
      ]
    },
    smsExample: {
      title: "Exemple de SMS",
      message:
        "Bonjour Amélie, une place vient de se libérer aujourd'hui à 14 h pour un soin. Réponds OUI si tu es intéressée."
    },
    benefits: {
      title: "Pourquoi une liste d'attente SMS",
      items: [
        "Contacter plusieurs clients intéressés en une seule action.",
        "Recevoir des réponses rapides sans appels répétés.",
        "Respecter le consentement SMS avec une option STOP claire.",
        "Garder le contrôle final sur la confirmation du rendez-vous."
      ]
    },
    manualConfirmation: {
      title: "La confirmation reste manuelle",
      paragraphs: [
        "Plusieurs clients peuvent répondre à la même alerte. Open Spot vous montre les réponses, mais ne choisit pas à votre place.",
        "Vous décidez qui confirmer selon le service, la disponibilité réelle ou la relation client. Aucune réponse OUI ne crée un rendez-vous sans votre validation."
      ]
    },
    faq: [
      {
        question: "Les clients doivent-ils répondre d'une façon précise ?",
        answer:
          "Oui, un message simple comme OUI, YES ou 1 suffit pour indiquer leur intérêt. Le commerce confirme ensuite manuellement."
      },
      {
        question: "Comment se désinscrire de la liste ?",
        answer:
          "Les clients peuvent répondre STOP pour ne plus recevoir d'alertes SMS, conformément aux bonnes pratiques de consentement."
      }
    ],
    relatedLinks: [
      {
        label: "Logiciel SMS pour annulations de rendez-vous",
        href: "/logiciel-sms-annulations-rendez-vous"
      },
      {
        label: "Modèles SMS pour place disponible",
        href: "/modele-sms-place-disponible-salon"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.8 }
  },
  "salon-esthetique-annulations-rdv-sms": {
    path: "/salon-esthetique-annulations-rdv-sms",
    title: "Remplir les annulations pour salons d'esthétique | Open Spot",
    description:
      "Open Spot aide les salons d'esthétique à proposer les places libérées par SMS et à récupérer du revenu perdu avec une confirmation manuelle.",
    h1: "Remplir les annulations de rendez-vous pour salons d'esthétique",
    intro:
      "Les salons d'esthétique — soins visage, ongles, cils, épilation, soins beauté — perdent rapidement de la valeur quand un rendez-vous annulé reste vide. Open Spot aide à proposer la place par SMS tout en gardant la confirmation manuelle.",
    problem: {
      title: "Les annulations coûtent cher en esthétique",
      paragraphs: [
        "Les soins esthétiques ont souvent une valeur moyenne élevée et des durées planifiées à l'avance. Une annulation de dernière minute laisse un trou difficile à combler.",
        "Appeler les clientes une par une pendant un service en cours n'est pas réaliste. Sans processus, le créneau reste vide et l'horaire en souffre."
      ]
    },
    solution: {
      title: "Proposer la place libérée par SMS",
      paragraphs: [
        "Open Spot permet d'alerter rapidement des clientes intéressées lorsqu'un soin est annulé. Elles répondent par SMS, et l'équipe choisit manuellement qui confirmer.",
        "Vous gardez une communication professionnelle adaptée à un salon d'esthétique, sans remplacer votre logiciel de réservation."
      ]
    },
    howItWorks: {
      title: "Comment ça fonctionne pour un salon d'esthétique",
      steps: [
        "Une cliente annule un soin esthétique de dernière minute.",
        "Vous sélectionnez le créneau libéré dans Open Spot.",
        "Un SMS est envoyé aux clientes intéressées par ce type de soin.",
        "Les réponses arrivent dans votre tableau de bord.",
        "Vous confirmez manuellement la cliente choisie."
      ]
    },
    smsExample: {
      title: "Exemple de SMS pour salon d'esthétique",
      message:
        "Bonjour Sarah, une place vient de se libérer aujourd'hui à 16 h pour un soin esthétique. Réponds OUI si tu es intéressée. Réponds STOP pour te désinscrire."
    },
    benefits: {
      title: "Bénéfices pour votre salon",
      items: [
        "Remplir plus vite les annulations de dernière minute.",
        "Proposer des soins à valeur élevée à des clientes déjà intéressées.",
        "Maintenir une relation client professionnelle par SMS.",
        "Garder le contrôle sur qui reçoit le rendez-vous."
      ]
    },
    manualConfirmation: {
      title: "Vous gardez la décision finale",
      paragraphs: [
        "En esthétique, le choix du client compte : type de soin, durée, préférences, historique. Open Spot ne remplace pas ce jugement.",
        "Même si une cliente répond en premier, c'est votre équipe qui confirme manuellement le rendez-vous."
      ]
    },
    faq: [
      {
        question: "Est-ce adapté aux soins visage, ongles et cils ?",
        answer:
          "Oui. Open Spot s'adapte à tout type de rendez-vous esthétique où une place libérée doit être proposée rapidement."
      },
      {
        question: "Faut-il remplacer mon logiciel de réservation ?",
        answer: "Non. Open Spot complète votre système actuel pour gérer les annulations de dernière minute."
      }
    ],
    relatedLinks: [
      {
        label: "Combien coûte une annulation à un salon d'esthétique",
        href: "/combien-coute-une-annulation-salon-esthetique"
      },
      {
        label: "Modèles SMS pour place disponible",
        href: "/modele-sms-place-disponible-salon"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.8 }
  },
  "coiffeur-annulations-rdv-sms": {
    path: "/coiffeur-annulations-rdv-sms",
    title: "Remplir les annulations pour salons de coiffure | Open Spot",
    description:
      "Aidez votre salon de coiffure à remplir les annulations dernière minute par SMS pour coupes, brushing, coloration et soins capillaires.",
    h1: "Remplir les annulations de rendez-vous pour salons de coiffure",
    intro:
      "Coupe, brushing, coloration ou soin capillaire : une annulation de dernière minute crée souvent un trou difficile à remplir, surtout aux heures de pointe. Open Spot propose la place libérée par SMS, avec confirmation manuelle par le salon.",
    problem: {
      title: "Des plages horaires difficiles à remplir",
      paragraphs: [
        "Les salons de coiffure connaissent des créneaux très demandés et d'autres plus difficiles à combler. Une annulation en milieu de journée ou en fin de journée laisse souvent un espace vide.",
        "Contacter les clientes une par une par téléphone ralentit l'équipe en salon et ne garantit pas une réponse rapide."
      ]
    },
    solution: {
      title: "Alerter les clientes intéressées par SMS",
      paragraphs: [
        "Open Spot envoie un SMS aux clientes intéressées lorsqu'une place se libère pour une coupe, un brushing, une coloration ou un soin.",
        "Les réponses arrivent rapidement. Le salon confirme manuellement la personne choisie, sans laisser le système décider seul."
      ]
    },
    howItWorks: {
      title: "Comment ça fonctionne en salon de coiffure",
      steps: [
        "Une cliente annule un rendez-vous de dernière minute.",
        "Vous indiquez le service et l'horaire libéré.",
        "Open Spot contacte les clientes intéressées par SMS.",
        "Vous consultez les réponses reçues.",
        "Vous confirmez manuellement la cliente retenue."
      ]
    },
    smsExample: {
      title: "Exemple de SMS pour coiffeur",
      message:
        "Bonjour Léa, une place vient de se libérer aujourd'hui à 15 h 30 pour coupe + brushing. Réponds OUI si tu es disponible."
    },
    benefits: {
      title: "Bénéfices pour votre salon de coiffure",
      items: [
        "Réagir vite aux annulations de dernière minute.",
        "Proposer des services variés : coupe, coloration, soin.",
        "Éviter les appels répétés pendant un service en cours.",
        "Garder le contrôle sur la confirmation finale."
      ]
    },
    manualConfirmation: {
      title: "Pas de confirmation automatique",
      paragraphs: [
        "Open Spot ne confirme jamais un rendez-vous à la place du salon. Vous choisissez la cliente selon le service, la durée du créneau ou votre connaissance de la clientèle.",
        "Cette confirmation manuelle réduit les erreurs et les doubles réservations."
      ]
    },
    faq: [
      {
        question: "Est-ce utile pour les colorations longues ?",
        answer:
          "Oui. Plus le rendez-vous a de la valeur, plus il est important de remplir rapidement le créneau libéré."
      }
    ],
    relatedLinks: [
      {
        label: "Logiciel SMS pour annulations de rendez-vous",
        href: "/logiciel-sms-annulations-rendez-vous"
      },
      {
        label: "Modèles SMS pour place disponible",
        href: "/modele-sms-place-disponible-salon"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.75 }
  },
  "barbier-annulations-rdv-sms": {
    path: "/barbier-annulations-rdv-sms",
    title: "Remplir les annulations pour barbiers | Open Spot",
    description:
      "Open Spot aide les barbiers à remplir les créneaux annulés par SMS pour coupe, barbe et services rapides, avec confirmation manuelle.",
    h1: "Remplir les annulations de rendez-vous pour barbiers",
    intro:
      "Les barbiers travaillent souvent avec des créneaux courts et une clientèle régulière. Quand un client annule à la dernière minute, Open Spot permet de proposer la place par SMS et de confirmer manuellement qui la prend.",
    problem: {
      title: "Des créneaux courts difficiles à récupérer",
      paragraphs: [
        "Coupe, barbe, entretien : chaque créneau compte dans une journée bien remplie. Une annulation laisse un trou visible dans l'horaire.",
        "Appeler les clients réguliers un par un prend du temps et retarde la réaction alors que la place pourrait être comblée rapidement."
      ]
    },
    solution: {
      title: "Proposer la place libérée aux clients réguliers",
      paragraphs: [
        "Open Spot contacte par SMS les clients intéressés par une place disponible. Ils répondent simplement, et le barbier confirme manuellement.",
        "La rapidité de réponse par SMS convient bien aux services courts et aux journées chargées."
      ]
    },
    howItWorks: {
      title: "Comment ça fonctionne pour un barbier",
      steps: [
        "Un client annule un rendez-vous de dernière minute.",
        "Vous sélectionnez le créneau libéré.",
        "Open Spot envoie un SMS aux clients intéressés.",
        "Les réponses arrivent en quelques minutes.",
        "Vous confirmez manuellement le client choisi."
      ]
    },
    smsExample: {
      title: "Exemple de SMS pour barbier",
      message:
        "Bonjour Adam, une place vient de se libérer aujourd'hui à 17 h pour coupe + barbe. Réponds OUI si tu es disponible."
    },
    benefits: {
      title: "Bénéfices pour votre barber shop",
      items: [
        "Combler rapidement les créneaux courts annulés.",
        "Contacter plusieurs clients réguliers en une action.",
        "Réduire les trous dans l'horaire.",
        "Garder le contrôle sur la confirmation du rendez-vous."
      ]
    },
    manualConfirmation: {
      title: "Confirmation manuelle par le barbier",
      paragraphs: [
        "Même si plusieurs clients répondent, c'est vous qui décidez qui confirmer. Open Spot ne remplace pas votre jugement ni votre connaissance de la clientèle.",
        "Aucune réponse OUI ne crée un rendez-vous sans votre validation explicite."
      ]
    },
    faq: [
      {
        question: "Est-ce adapté aux services rapides ?",
        answer:
          "Oui. Le SMS permet de recevoir des réponses rapidement, ce qui convient aux créneaux courts typiques d'un barber shop."
      }
    ],
    relatedLinks: [
      {
        label: "Liste d'attente SMS pour rendez-vous",
        href: "/liste-attente-sms-rendez-vous"
      },
      {
        label: "Comment remplir une annulation de rendez-vous",
        href: "/comment-remplir-annulation-rendez-vous"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.75 }
  },
  "spa-annulations-rdv-sms": {
    path: "/spa-annulations-rdv-sms",
    title: "Remplir les annulations pour spas | Open Spot",
    description:
      "Proposez les places libérées de votre spa par SMS et récupérez les annulations de dernière minute sans automatiser la confirmation du rendez-vous.",
    h1: "Remplir les annulations de rendez-vous pour spas",
    intro:
      "Les spas proposent souvent des soins plus longs et à plus forte valeur. Une annulation de dernière minute crée un impact important sur l'horaire et le revenu. Open Spot aide à proposer la place par SMS, avec confirmation manuelle par l'équipe.",
    problem: {
      title: "Des rendez-vous longs difficiles à remplacer",
      paragraphs: [
        "Un massage ou un soin spa peut durer 60 à 90 minutes. Quand ce créneau se vide, l'impact sur l'horaire est immédiat et le revenu perdu est significatif.",
        "Contacter les clientes une par une ne correspond pas à l'expérience premium attendue dans un spa, surtout en pleine journée."
      ]
    },
    solution: {
      title: "Une alerte SMS discrète et efficace",
      paragraphs: [
        "Open Spot propose la place libérée aux clientes intéressées par SMS. Les réponses arrivent rapidement, et l'équipe confirme manuellement qui recevra le soin.",
        "Vous réduisez les trous dans l'horaire tout en gardant une communication professionnelle."
      ]
    },
    howItWorks: {
      title: "Comment ça fonctionne pour un spa",
      steps: [
        "Une cliente annule un soin spa de dernière minute.",
        "Vous indiquez le service et la durée libérés.",
        "Open Spot alerte les clientes intéressées par SMS.",
        "Vous consultez les réponses dans votre tableau de bord.",
        "Vous confirmez manuellement la cliente retenue."
      ]
    },
    smsExample: {
      title: "Exemple de SMS pour spa",
      message:
        "Bonjour Camille, une place vient de se libérer aujourd'hui à 13 h pour un massage de 60 minutes. Réponds OUI si tu es intéressée."
    },
    benefits: {
      title: "Bénéfices pour votre spa",
      items: [
        "Récupérer des rendez-vous à plus forte valeur.",
        "Réduire les trous dans un horaire soigné.",
        "Maintenir une expérience client premium par SMS.",
        "Garder le contrôle final sur chaque confirmation."
      ]
    },
    manualConfirmation: {
      title: "L'équipe garde le contrôle",
      paragraphs: [
        "Dans un spa, le choix de la cliente compte : type de soin, durée, préférences, disponibilité réelle. Open Spot ne confirme jamais à votre place.",
        "La confirmation manuelle protège la qualité de service et évite les erreurs d'horaire."
      ]
    },
    faq: [
      {
        question: "Est-ce adapté aux soins longs comme les massages ?",
        answer:
          "Oui. Plus le rendez-vous a de la valeur, plus il est utile de proposer rapidement la place libérée à des clientes intéressées."
      }
    ],
    relatedLinks: [
      {
        label: "Pourquoi confirmer manuellement un rendez-vous",
        href: "/pourquoi-confirmer-manuellement-un-rendez-vous"
      },
      {
        label: "No-show vs annulation de rendez-vous",
        href: "/no-show-vs-annulation-rendez-vous"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.75 }
  },
  "clinique-beaute-annulations-rdv-sms": {
    path: "/clinique-beaute-annulations-rdv-sms",
    title: "Remplir les annulations pour cliniques beauté | Open Spot",
    description:
      "Open Spot aide les cliniques beauté à proposer rapidement les rendez-vous libérés par SMS avec suivi des réponses et confirmation manuelle.",
    h1: "Remplir les annulations de rendez-vous pour cliniques beauté",
    intro:
      "Les cliniques beauté gèrent des rendez-vous spécialisés à forte valeur. Open Spot permet de proposer rapidement une place libérée par SMS à une liste de clients intéressés, avec confirmation manuelle par l'équipe.",
    problem: {
      title: "Des rendez-vous spécialisés difficiles à remplacer",
      paragraphs: [
        "Les soins en clinique beauté demandent souvent une planification précise et une clientèle informée. Une annulation de dernière minute laisse un créneau vide coûteux.",
        "Sans processus structuré, l'équipe perd du temps à chercher qui contacter pendant que la place reste disponible."
      ]
    },
    solution: {
      title: "Proposer la place à des clients intéressés",
      paragraphs: [
        "Open Spot alerte par SMS les clients intéressés par des places disponibles. Les réponses sont centralisées, et l'équipe confirme manuellement qui recevra le rendez-vous.",
        "Vous gardez le contrôle final sur chaque décision, adapté aux exigences d'une clinique beauté."
      ]
    },
    howItWorks: {
      title: "Comment ça fonctionne en clinique beauté",
      steps: [
        "Un client annule un rendez-vous spécialisé de dernière minute.",
        "Vous sélectionnez le créneau et les clients à contacter.",
        "Open Spot envoie une alerte SMS claire.",
        "Les réponses arrivent dans votre interface.",
        "L'équipe confirme manuellement le client retenu."
      ]
    },
    smsExample: {
      title: "Exemple de SMS pour clinique beauté",
      message:
        "Bonjour Nadia, une place vient de se libérer aujourd'hui à 11 h pour un soin beauté. Réponds OUI si tu es disponible."
    },
    benefits: {
      title: "Bénéfices pour votre clinique",
      items: [
        "Récupérer des rendez-vous à valeur élevée.",
        "Contacter rapidement une liste de clients intéressés.",
        "Centraliser les réponses au même endroit.",
        "Garder le contrôle final par l'équipe."
      ]
    },
    manualConfirmation: {
      title: "Le contrôle final reste à l'équipe",
      paragraphs: [
        "En clinique beauté, chaque rendez-vous compte. Open Spot ne remplace pas le jugement de l'équipe sur qui confirmer selon le soin, le praticien ou le contexte.",
        "La confirmation manuelle protège la qualité de service et la relation client."
      ]
    },
    faq: [
      {
        question: "Open Spot convient-il aux soins spécialisés ?",
        answer:
          "Oui. L'outil s'adapte à tout rendez-vous où une place libérée doit être proposée rapidement à des clients intéressés."
      }
    ],
    relatedLinks: [
      {
        label: "Salons d'esthétique",
        href: "/salon-esthetique-annulations-rdv-sms"
      },
      {
        label: "Pourquoi confirmer manuellement un rendez-vous",
        href: "/pourquoi-confirmer-manuellement-un-rendez-vous"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.75 }
  }
};

export const articlePages: Record<string, ArticlePageData> = {
  "comment-remplir-annulation-rendez-vous": {
    path: "/comment-remplir-annulation-rendez-vous",
    title: "Comment remplir une annulation de rendez-vous | Open Spot",
    description:
      "Découvrez une méthode simple pour remplir une annulation de rendez-vous dernière minute par SMS sans remplacer votre logiciel de réservation.",
    h1: "Comment remplir une annulation de rendez-vous dernière minute",
    intro:
      "Une annulation reçue quelques heures avant le rendez-vous laisse peu de temps pour réagir. Voici une approche simple pour proposer la place libérée par SMS, sans remplacer votre logiciel de réservation.",
    sections: [
      {
        title: "Pourquoi une annulation coûte cher",
        paragraphs: [
          "Chaque créneau vide représente du revenu perdu et perturbe l'horaire de la journée. Plus le service a de la valeur, plus l'impact est important.",
          "En salon, spa ou clinique beauté, une annulation de dernière minute est fréquente et difficile à anticiper."
        ]
      },
      {
        title: "Pourquoi appeler les clients un par un est lent",
        paragraphs: [
          "Les appels téléphoniques demandent du temps, de la disponibilité et plusieurs tentatives. Pendant ce temps, le créneau reste vide.",
          "En journée chargée, contacter manuellement chaque client intéressé n'est pas réaliste."
        ]
      },
      {
        title: "Comment une alerte SMS accélère la réponse",
        paragraphs: [
          "Un SMS court informe plusieurs clients intéressés en même temps. Ils peuvent répondre OUI, YES ou 1 s'ils sont disponibles.",
          "Les réponses arrivent rapidement, ce qui laisse plus de chances de combler le créneau avant l'heure du rendez-vous."
        ]
      },
      {
        title: "Pourquoi la confirmation doit rester manuelle",
        paragraphs: [
          "Proposer une place disponible ne signifie pas confirmer le rendez-vous sans contrôle. Le commerce doit garder la décision finale pour éviter les doubles réservations et choisir la bonne personne.",
          "Open Spot centralise les réponses, mais c'est le commerce qui confirme manuellement."
        ]
      }
    ],
    practicalExample: {
      title: "Exemple concret",
      content:
        "Un salon reçoit une annulation à 14 h pour un rendez-vous à 16 h 30. Au lieu d'appeler trois clientes une par une, l'équipe envoie un SMS : « Bonjour, une place vient de se libérer aujourd'hui à 16 h 30 pour un soin. Réponds OUI si tu es disponible. » Deux clientes répondent. L'équipe confirme manuellement celle qui convient le mieux."
    },
    relatedLinks: [
      {
        label: "Logiciel SMS pour annulations de rendez-vous",
        href: "/logiciel-sms-annulations-rendez-vous"
      },
      {
        label: "Modèles SMS pour place disponible",
        href: "/modele-sms-place-disponible-salon"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.7 }
  },
  "modele-sms-place-disponible-salon": {
    path: "/modele-sms-place-disponible-salon",
    title: "Modèle SMS pour annoncer une place disponible | Open Spot",
    description:
      "Exemples de SMS simples pour proposer une place disponible après une annulation dans un salon, spa, clinique beauté ou barber shop.",
    h1: "Modèles de SMS pour proposer une place disponible",
    intro:
      "Voici des modèles de SMS courts pour proposer une place libérée après une annulation. Chaque message inclut l'heure, le service, une réponse simple et, lorsque pertinent, l'option STOP pour se désinscrire.",
    sections: [
      {
        title: "Salon d'esthétique",
        paragraphs: [],
        list: [
          "Bonjour Sarah, une place vient de se libérer aujourd'hui à 16 h pour un soin esthétique. Réponds OUI si tu es intéressée. Réponds STOP pour te désinscrire."
        ]
      },
      {
        title: "Coiffeur",
        paragraphs: [],
        list: [
          "Bonjour Léa, une place vient de se libérer aujourd'hui à 15 h 30 pour coupe + brushing. Réponds OUI si tu es disponible."
        ]
      },
      {
        title: "Barbier",
        paragraphs: [],
        list: [
          "Bonjour Adam, une place vient de se libérer aujourd'hui à 17 h pour coupe + barbe. Réponds OUI si tu es disponible."
        ]
      },
      {
        title: "Spa",
        paragraphs: [],
        list: [
          "Bonjour Camille, une place vient de se libérer aujourd'hui à 13 h pour un massage de 60 minutes. Réponds OUI si tu es intéressée."
        ]
      },
      {
        title: "Clinique beauté",
        paragraphs: [],
        list: [
          "Bonjour Nadia, une place vient de se libérer aujourd'hui à 11 h pour un soin beauté. Réponds OUI si tu es disponible."
        ]
      },
      {
        title: "Consentement SMS",
        paragraphs: [
          "Ces modèles sont des exemples pratiques. Assurez-vous de respecter le consentement SMS applicable à votre commerce et à votre clientèle avant d'envoyer des alertes.",
          "Open Spot ne confirme pas le rendez-vous à la place du commerce : les réponses indiquent un intérêt, et la confirmation reste manuelle."
        ]
      }
    ],
    mistakesToAvoid: {
      title: "Erreurs à éviter",
      items: [
        "Messages trop longs ou peu clairs sur comment répondre.",
        "Oublier de mentionner l'heure ou le service concerné.",
        "Envoyer des alertes sans consentement préalable du client.",
        "Laisser croire que répondre OUI confirme automatiquement le rendez-vous."
      ]
    },
    relatedLinks: [
      {
        label: "Liste d'attente SMS pour rendez-vous",
        href: "/liste-attente-sms-rendez-vous"
      },
      {
        label: "Consentement SMS",
        href: "/consentement-sms"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.65 }
  },
  "combien-coute-une-annulation-salon-esthetique": {
    path: "/combien-coute-une-annulation-salon-esthetique",
    title: "Combien coûte une annulation à un salon d'esthétique | Open Spot",
    description:
      "Calculez l'impact des annulations de rendez-vous pour un salon d'esthétique et voyez comment réduire les créneaux vides par SMS.",
    h1: "Combien coûte une annulation à un salon d'esthétique ?",
    intro:
      "Une annulation de rendez-vous a un coût direct et indirect pour un salon d'esthétique. Voici une façon simple d'y penser, sans exagérer les chiffres.",
    sections: [
      {
        title: "Le coût direct du créneau vide",
        paragraphs: [
          "Si un service vaut 85 $ et que le créneau reste vide, le salon perd une opportunité de revenu. C'est le coût le plus visible et immédiat.",
          "Pour des soins à plus forte valeur, l'impact est encore plus important."
        ]
      },
      {
        title: "Le temps perdu",
        paragraphs: [
          "Au-delà du revenu perdu, l'équipe peut passer du temps à chercher qui contacter, rappeler des clientes ou réorganiser l'horaire.",
          "Ce temps aurait pu être consacré à des soins ou à l'accueil client."
        ]
      },
      {
        title: "L'effet sur l'horaire",
        paragraphs: [
          "Un créneau vide perturbe la journée : trou dans l'horaire, praticienne disponible sans client, planning moins fluide.",
          "Les annulations de dernière minute sont particulièrement difficiles à combler sans processus adapté."
        ]
      },
      {
        title: "Comment Open Spot aide à récupérer une partie du revenu perdu",
        paragraphs: [
          "Open Spot permet de proposer rapidement le créneau libéré à des clientes intéressées par SMS. Les réponses arrivent vite, et le salon confirme manuellement qui recevra le rendez-vous.",
          "Cela ne garantit pas de combler chaque annulation, mais améliore les chances de récupérer une partie du revenu perdu."
        ]
      }
    ],
    relatedLinks: [
      {
        label: "Salons d'esthétique",
        href: "/salon-esthetique-annulations-rdv-sms"
      },
      {
        label: "Comment remplir une annulation de rendez-vous",
        href: "/comment-remplir-annulation-rendez-vous"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.65 }
  },
  "pourquoi-confirmer-manuellement-un-rendez-vous": {
    path: "/pourquoi-confirmer-manuellement-un-rendez-vous",
    title: "Pourquoi confirmer manuellement un rendez-vous | Open Spot",
    description:
      "La confirmation manuelle permet au commerce de garder le contrôle lorsqu'un client répond à une alerte SMS pour une place libérée.",
    h1: "Pourquoi la confirmation manuelle est importante",
    intro:
      "Quand un client répond OUI à une alerte SMS pour une place disponible, cela indique un intérêt — pas une réservation confirmée. Open Spot aide à recevoir les réponses rapidement, mais le commerce garde la décision finale.",
    sections: [
      {
        title: "Éviter les doubles réservations",
        paragraphs: [
          "Plusieurs clients peuvent répondre à la même alerte. Si le premier OUI confirmait le rendez-vous sans contrôle, le risque de double réservation augmenterait.",
          "La confirmation manuelle permet de vérifier la disponibilité réelle avant de valider."
        ]
      },
      {
        title: "Garder le contrôle client",
        paragraphs: [
          "Le commerce connaît sa clientèle, ses préférences et son historique. Cette connaissance ne peut pas être remplacée par une règle automatique.",
          "Confirmer manuellement respecte la relation client et la qualité de service."
        ]
      },
      {
        title: "Choisir la meilleure personne selon le contexte",
        paragraphs: [
          "Selon le service, l'horaire, la durée ou le praticien disponible, une réponse n'est pas toujours équivalente à une autre.",
          "Le commerce choisit la personne la plus adaptée au créneau libéré."
        ]
      },
      {
        title: "Réduire les erreurs",
        paragraphs: [
          "Une réponse SMS rapide peut arriver par erreur ou sans que le client ait vérifié sa disponibilité réelle.",
          "La confirmation manuelle laisse le temps de valider avant de bloquer le rendez-vous."
        ]
      },
      {
        title: "Open Spot ne confirme pas à votre place",
        paragraphs: [
          "Open Spot centralise les réponses et accélère la communication, mais ne remplace pas le jugement du commerce.",
          "Aucune réponse OUI ne crée un rendez-vous confirmé sans validation explicite de l'équipe."
        ]
      }
    ],
    faq: [
      {
        question: "Est-ce plus lent que de confirmer automatiquement ?",
        answer:
          "La confirmation manuelle prend quelques secondes de plus, mais elle évite des erreurs coûteuses et protège la qualité de service."
      }
    ],
    relatedLinks: [
      {
        label: "Logiciel SMS pour annulations de rendez-vous",
        href: "/logiciel-sms-annulations-rendez-vous"
      },
      {
        label: "Liste d'attente SMS pour rendez-vous",
        href: "/liste-attente-sms-rendez-vous"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.75 }
  },
  "no-show-vs-annulation-rendez-vous": {
    path: "/no-show-vs-annulation-rendez-vous",
    title: "No-show vs annulation de rendez-vous | Open Spot",
    description:
      "Comprendre la différence entre un no-show et une annulation de rendez-vous, et comment réduire les pertes liées aux créneaux vides.",
    h1: "No-show vs annulation de rendez-vous : quelle différence ?",
    intro:
      "No-show et annulation créent tous deux un créneau vide, mais la situation n'est pas la même. Comprendre la différence aide à mieux réagir et à réduire les pertes.",
    sections: [
      {
        title: "Qu'est-ce qu'un no-show ?",
        paragraphs: [
          "Un no-show, c'est quand un client ne se présente pas à son rendez-vous sans avoir annulé à l'avance. Le commerce découvre le créneau vide au moment prévu.",
          "Dans ce cas, il est souvent trop tard pour proposer la place à d'autres clients."
        ]
      },
      {
        title: "Qu'est-ce qu'une annulation ?",
        paragraphs: [
          "Une annulation, c'est quand un client prévient qu'il ne pourra pas venir. Si l'annonce arrive à la dernière minute, il reste parfois un court délai pour réagir.",
          "C'est cette fenêtre qu'Open Spot aide à exploiter en proposant la place par SMS."
        ]
      },
      {
        title: "Impact sur l'horaire",
        paragraphs: [
          "Les deux situations laissent un trou dans l'horaire, mais l'annulation de dernière minute offre une chance de combler le créneau si vous réagissez vite.",
          "Le no-show, lui, arrive souvent quand il est déjà trop tard pour proposer la place."
        ]
      },
      {
        title: "Comment gérer une annulation plus efficacement",
        paragraphs: [
          "Dès qu'une annulation est reçue, proposez la place à des clients intéressés par SMS plutôt que d'appeler un par un.",
          "Consultez les réponses et confirmez manuellement la personne choisie."
        ]
      },
      {
        title: "Le rôle du SMS",
        paragraphs: [
          "Le SMS permet de contacter plusieurs clients intéressés en même temps et de recevoir des réponses rapidement.",
          "Open Spot centralise ces réponses sans confirmer le rendez-vous à la place du commerce."
        ]
      }
    ],
    relatedLinks: [
      {
        label: "Comment remplir une annulation de rendez-vous",
        href: "/comment-remplir-annulation-rendez-vous"
      },
      {
        label: "Pourquoi confirmer manuellement un rendez-vous",
        href: "/pourquoi-confirmer-manuellement-un-rendez-vous"
      }
    ],
    sitemap: { changeFrequency: "monthly", priority: 0.6 }
  }
};

export const solutionLinks: RelatedLink[] = [
  {
    label: "Logiciel SMS pour annulations de rendez-vous",
    href: "/logiciel-sms-annulations-rendez-vous"
  },
  {
    label: "Liste d'attente SMS pour rendez-vous",
    href: "/liste-attente-sms-rendez-vous"
  },
  { label: "Salons d'esthétique", href: "/salon-esthetique-annulations-rdv-sms" },
  { label: "Coiffeurs", href: "/coiffeur-annulations-rdv-sms" },
  { label: "Barbiers", href: "/barbier-annulations-rdv-sms" },
  { label: "Spas", href: "/spa-annulations-rdv-sms" },
  { label: "Cliniques beauté", href: "/clinique-beaute-annulations-rdv-sms" }
];

export const resourceLinks: RelatedLink[] = [
  {
    label: "Comment remplir une annulation de rendez-vous",
    href: "/comment-remplir-annulation-rendez-vous"
  },
  {
    label: "Modèles SMS pour place disponible",
    href: "/modele-sms-place-disponible-salon"
  },
  {
    label: "Combien coûte une annulation à un salon d'esthétique",
    href: "/combien-coute-une-annulation-salon-esthetique"
  },
  {
    label: "Pourquoi confirmer manuellement un rendez-vous",
    href: "/pourquoi-confirmer-manuellement-un-rendez-vous"
  },
  {
    label: "No-show vs annulation de rendez-vous",
    href: "/no-show-vs-annulation-rendez-vous"
  }
];

export const allPublicSeoPaths = [
  "/",
  "/book-call",
  "/consentement-sms",
  "/conditions-utilisation",
  "/politique-confidentialite",
  ...Object.values(commercialPages).map((page) => page.path),
  ...Object.values(articlePages).map((page) => page.path)
];
