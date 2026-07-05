import type { MetadataRoute } from "next";

import { brandConfig } from "@/config/brand";

export type FaqItem = {
  question: string;
  answer: string;
};

export type InternalLink = {
  label: string;
  href: string;
};

export type SeoMetadataDefinition = {
  title: string;
  description: string;
  path: string;
  locale: "fr-CA";
};

export type CommercialSeoPage = {
  path: string;
  metadata: SeoMetadataDefinition;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: { title: string; body: string }[];
  workflow: string[];
  manualValidationCopy: string;
  smsConsentCopy: string;
  smsExample: string;
  faq: FaqItem[];
  internalLinks: InternalLink[];
  relatedSectorLinks: InternalLink[];
};

export type PublicSeoPage = {
  path: string;
  metadata: SeoMetadataDefinition;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const productLinks: InternalLink[] = [
  { label: "Comment ça marche", href: "/how-it-works" },
  { label: "Tarifs", href: "/pricing" },
  { label: "Tous les secteurs", href: "/industries" },
  { label: "Réserver un appel", href: "/book-call/questions" }
];

const sectors = [
  { label: "Barbiers", href: "/barbiers" },
  { label: "Coiffeurs", href: "/coiffeurs" },
  { label: "Salons d’esthétique", href: "/salons-esthetique" },
  { label: "Spas", href: "/spas" },
  { label: "Cliniques beauté", href: "/cliniques-beaute" },
  { label: "Ongleries", href: "/ongleries" }
] as const;

function faqFor(context: string): FaqItem[] {
  return [
    {
      question: `Open Spot confirme-t-il un client sans validation pour ${context}?`,
      answer:
        "Non. Les réponses sont regroupées pour aider l’équipe, mais le commerce garde la confirmation manuelle finale."
    },
    {
      question: "Les clients doivent-ils installer une application?",
      answer:
        "Non. Les clients consentants reçoivent un SMS et peuvent répondre OUI, YES ou 1 directement depuis leur téléphone."
    },
    {
      question: "Comment le désabonnement SMS fonctionne-t-il?",
      answer:
        "Les messages doivent être envoyés aux clients qui ont accepté ce type d’alerte. Le mot STOP doit être respecté pour retirer une personne des prochains envois."
    }
  ];
}

function makeCommercialPage({
  path,
  title,
  description,
  eyebrow,
  h1,
  intro,
  cost,
  help,
  workflow,
  smsExample,
  relatedSectorLinks
}: {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  cost: string;
  help: string;
  workflow: string[];
  smsExample: string;
  relatedSectorLinks: InternalLink[];
}): CommercialSeoPage {
  return {
    path,
    metadata: {
      title,
      description,
      path,
      locale: "fr-CA"
    },
    eyebrow,
    h1,
    intro,
    sections: [
      {
        title: "Pourquoi les annulations coûtent cher",
        body: cost
      },
      {
        title: "Comment Open Spot aide",
        body: help
      },
      {
        title: "Validation manuelle",
        body:
          "Open Spot organise les réponses, mais ne choisit pas à la place de votre équipe. Le commerce garde le contrôle et confirme seulement après avoir vérifié le meilleur ajustement."
      },
      {
        title: "Consentement SMS et STOP",
        body:
          "Les alertes doivent viser des clients consentants. Chaque commerce doit respecter les désinscriptions, garder les consentements clairs et traiter STOP comme une demande de retrait."
      }
    ],
    workflow,
    manualValidationCopy:
      "La confirmation manuelle reste visible dans le workflow: même si plusieurs clients répondent vite, votre équipe décide qui confirmer.",
    smsConsentCopy:
      "Open Spot est pensé pour les clients consentants, les réponses OUI / YES / 1 et la désinscription STOP.",
    smsExample,
    faq: faqFor(eyebrow.toLowerCase()),
    internalLinks: [
      ...productLinks,
      { label: "Liste d’attente SMS", href: "/liste-attente-sms" },
      { label: "Annulations par SMS", href: "/annulations-rendez-vous-sms" }
    ],
    relatedSectorLinks
  };
}

const standardWorkflow = [
  "Un client annule ou un créneau se libère dans votre horaire.",
  "Votre équipe crée une ouverture avec le service, l’heure et les détails utiles.",
  "Open Spot envoie une alerte SMS aux clients admissibles et consentants.",
  "Les clients intéressés répondent OUI, YES ou 1 par SMS.",
  "Votre équipe révise les réponses et confirme manuellement la bonne personne."
];

export const commercialSeoPages: CommercialSeoPage[] = [
  makeCommercialPage({
    path: "/barbiers",
    title: "Annulations SMS pour barbiers et barbershops",
    description:
      "Remplissez les annulations de votre barbershop par SMS avec des clients consentants, des réponses centralisées et une confirmation manuelle par votre équipe.",
    eyebrow: "Barbiers",
    h1: "Remplissez les annulations de votre barbershop par SMS",
    intro:
      "Une chaise vide peut arriver vite dans un barbershop. Open Spot aide à prévenir les clients locaux qui veulent prendre une place plus tôt, sans changer votre calendrier actuel.",
    cost:
      "Une coupe ou un service barbe annulé à la dernière minute laisse une chaise improductive, coupe le rythme de l’équipe et réduit le revenu potentiel de la journée.",
    help:
      "Votre équipe envoie une alerte ciblée à une liste de clients consentants, voit les réponses dans un seul endroit, puis choisit la personne à confirmer selon l’horaire.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: une place barbier s’est libérée aujourd’hui à 15 h. Répondez OUI si vous êtes disponible. STOP pour arrêter.",
    relatedSectorLinks: [
      sectors[1],
      sectors[2],
      sectors[5]
    ]
  }),
  makeCommercialPage({
    path: "/coiffeurs",
    title: "Annulations SMS pour salons de coiffure",
    description:
      "Récupérez les annulations de rendez-vous en salon de coiffure par SMS pour colorations, coupes et services longs avec confirmation manuelle finale.",
    eyebrow: "Coiffeurs",
    h1: "Récupérez les annulations de rendez-vous en salon de coiffure",
    intro:
      "Une coloration, une coupe ou un brushing annulé peut créer un trou coûteux dans la journée. Open Spot aide le salon à joindre rapidement les clients consentants.",
    cost:
      "Les services longs bloquent une partie importante de l’horaire. Quand ils tombent, l’équipe perd du temps productif et doit souvent contacter des clients un par un.",
    help:
      "Open Spot transforme une ouverture en alerte SMS claire, recueille les réponses et donne au salon une file simple pour choisir la meilleure cliente ou le meilleur client.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: une disponibilité coiffure s’est libérée demain à 10 h pour coupe ou brushing. Répondez OUI si cela vous intéresse. STOP pour arrêter.",
    relatedSectorLinks: [
      sectors[0],
      sectors[2],
      sectors[4]
    ]
  }),
  makeCommercialPage({
    path: "/salons-esthetique",
    title: "Annulations SMS pour salons d’esthétique",
    description:
      "Aidez votre salon d’esthétique à remplir les annulations de soins par SMS avec opt-in client, réponses simples et validation humaine finale.",
    eyebrow: "Salons d’esthétique",
    h1: "Remplissez les annulations de votre salon d’esthétique par SMS",
    intro:
      "Soins du visage, épilation, traitements courts ou longs: une annulation crée vite un espace difficile à combler sans une liste d’attente claire.",
    cost:
      "Les annulations tardives laissent une cabine disponible, réduisent l’utilisation du personnel et peuvent forcer l’équipe à gérer des messages dispersés.",
    help:
      "Open Spot aide à prévenir une liste d’attente consentante, sans application client, puis centralise les réponses pour que l’équipe garde la décision finale.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: un soin esthétique s’est libéré jeudi à 13 h 30. Répondez OUI si vous voulez la place. STOP pour arrêter.",
    relatedSectorLinks: [
      sectors[3],
      sectors[4],
      sectors[5]
    ]
  }),
  makeCommercialPage({
    path: "/spas",
    title: "Annulations SMS pour spas et soins bien-être",
    description:
      "Transformez les annulations de dernière minute en créneaux récupérables pour spas, massages et soins grâce à des alertes SMS consenties.",
    eyebrow: "Spas",
    h1: "Transformez les annulations de dernière minute en créneaux récupérables",
    intro:
      "Dans un spa, le ton doit rester calme et professionnel. Open Spot aide à envoyer une alerte utile aux clients consentants sans donner une impression de message de masse.",
    cost:
      "Un massage ou un soin annulé peut laisser une salle et un membre de l’équipe sans réservation, surtout quand le créneau était réservé depuis plusieurs jours.",
    help:
      "Open Spot donne une couche SMS sobre: une ouverture, une alerte aux clients admissibles, des réponses regroupées et une confirmation humaine par l’accueil.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: un créneau spa s’est libéré demain à 14 h pour un soin de 60 min. Répondez OUI si vous êtes disponible. STOP pour arrêter.",
    relatedSectorLinks: [
      sectors[2],
      sectors[4],
      sectors[1]
    ]
  }),
  makeCommercialPage({
    path: "/cliniques-beaute",
    title: "Annulations SMS pour cliniques beauté",
    description:
      "Ajoutez une couche SMS pour récupérer les annulations en clinique beauté tout en gardant le contrôle, le service client et la confirmation manuelle.",
    eyebrow: "Cliniques beauté",
    h1: "Une couche SMS pour récupérer les annulations en clinique beauté",
    intro:
      "Les cliniques beauté ont souvent besoin de vérifier le service, la durée et l’adéquation client avant de confirmer un rendez-vous récupéré.",
    cost:
      "Un traitement esthétique annulé peut immobiliser une salle, un appareil ou une ressource spécialisée. Le coût réel dépend du service et du volume d’annulations.",
    help:
      "Open Spot aide la réception à notifier des clients consentants, à voir les réponses en un seul endroit et à confirmer seulement après révision.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: une disponibilité clinique beauté s’est libérée vendredi à 11 h. Répondez OUI si vous souhaitez être rappelé pour ce créneau. STOP pour arrêter.",
    relatedSectorLinks: [
      sectors[2],
      sectors[3],
      sectors[5]
    ]
  }),
  makeCommercialPage({
    path: "/ongleries",
    title: "Annulations SMS pour ongleries",
    description:
      "Remplissez les annulations de votre onglerie avec des alertes SMS aux clientes consentantes, des réponses centralisées et un choix final manuel.",
    eyebrow: "Ongleries",
    h1: "Remplissez les annulations de votre onglerie avec des alertes SMS",
    intro:
      "Les ongleries gèrent souvent des trous courts ou récurrents. Une liste d’attente SMS peut aider à combler ces espaces sans ajouter une application client.",
    cost:
      "Même un créneau court annulé peut déranger le rythme de la journée, surtout quand plusieurs techniciennes ou services sont planifiés de près.",
    help:
      "Open Spot prévient des clientes consentantes, regroupe les réponses et laisse le commerce choisir qui confirmer selon le service, la durée et la disponibilité.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: une place onglerie s’est libérée aujourd’hui à 16 h. Répondez OUI si vous êtes disponible. STOP pour arrêter.",
    relatedSectorLinks: [
      sectors[2],
      sectors[1],
      sectors[4]
    ]
  }),
  makeCommercialPage({
    path: "/liste-attente-sms",
    title: "Liste d’attente SMS pour rendez-vous",
    description:
      "Créez une liste d’attente SMS simple pour commerces sur rendez-vous avec clients opt-in, réponses OUI / YES / 1, STOP et validation manuelle.",
    eyebrow: "Liste d’attente SMS",
    h1: "Une liste d’attente SMS simple pour les commerces sur rendez-vous",
    intro:
      "Une liste d’attente moderne doit être facile pour le client et utile pour l’équipe. Open Spot vise un flux SMS simple, sans application client à installer.",
    cost:
      "Sans liste exploitable, une annulation force souvent l’équipe à chercher dans ses notes, appeler au hasard ou laisser le créneau vide.",
    help:
      "Open Spot organise les clients opt-in, envoie une alerte quand une place se libère et centralise les réponses pour une décision humaine.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: une place s’est libérée demain à 10 h. Répondez OUI, YES ou 1 si vous êtes intéressé. STOP pour arrêter.",
    relatedSectorLinks: [
      sectors[0],
      sectors[1],
      sectors[2],
      sectors[3]
    ]
  }),
  makeCommercialPage({
    path: "/annulations-rendez-vous-sms",
    title: "Annulations de rendez-vous par SMS",
    description:
      "Remplissez vos annulations de rendez-vous par SMS avec un workflow de récupération clair, des clients consentants et une confirmation manuelle.",
    eyebrow: "Annulations de rendez-vous SMS",
    h1: "Remplissez vos annulations de rendez-vous par SMS",
    intro:
      "Quand un rendez-vous tombe à la dernière minute, le temps compte. Open Spot aide les commerces sur rendez-vous à joindre les bonnes personnes sans transformer leur outil en système de réservation complet.",
    cost:
      "Chaque créneau vide peut représenter du revenu potentiel perdu, du personnel sous-utilisé et une journée plus difficile à optimiser.",
    help:
      "Open Spot complète votre système actuel: vous créez une ouverture, les clients consentants répondent par SMS et votre équipe garde la décision finale.",
    workflow: standardWorkflow,
    smsExample:
      "Open Spot: une annulation vient de libérer une place aujourd’hui à 15 h. Répondez OUI si vous voulez être considéré. STOP pour arrêter.",
    relatedSectorLinks: [...sectors]
  })
];

export const howItWorksFaq: FaqItem[] = [
  {
    question: "Que répondent les clients?",
    answer:
      "Ils peuvent répondre OUI, YES ou 1 pour signaler leur intérêt pour le créneau disponible."
  },
  {
    question: "Open Spot modifie-t-il mon calendrier?",
    answer:
      "Non. Open Spot complète votre système actuel et aide surtout à gérer l’alerte SMS et les réponses."
  },
  {
    question: "Comment la confirmation finale se fait-elle?",
    answer:
      "Votre équipe révise les réponses, choisit le bon client et confirme manuellement dans votre processus habituel."
  }
];

export const industryHubLinks: InternalLink[] = [...sectors];

export const publicSeoPages: PublicSeoPage[] = [
  {
    path: "/",
    metadata: {
      title: "Solution SMS pour annulations de rendez-vous",
      description:
        "Open Spot aide les salons, barbiers, spas et cliniques beauté à remplir les annulations de dernière minute par SMS avec clients consentants et confirmation manuelle.",
      path: "/",
      locale: "fr-CA"
    },
    changeFrequency: "weekly",
    priority: 1
  },
  {
    path: "/pricing",
    metadata: {
      title: "Tarifs personnalisés pour récupération SMS",
      description:
        "Découvrez une tarification Open Spot adaptée à votre volume d’annulations, votre usage SMS, vos services et votre workflow de confirmation manuelle.",
      path: "/pricing",
      locale: "fr-CA"
    },
    changeFrequency: "monthly",
    priority: 0.9
  },
  {
    path: "/how-it-works",
    metadata: {
      title: "Comment remplir une annulation par SMS",
      description:
        "Comprenez comment Open Spot transforme une annulation de rendez-vous en alerte SMS aux clients consentants, réponses OUI / YES / 1 et confirmation manuelle.",
      path: "/how-it-works",
      locale: "fr-CA"
    },
    changeFrequency: "monthly",
    priority: 0.95
  },
  {
    path: "/industries",
    metadata: {
      title: "Commerces sur rendez-vous et annulations SMS",
      description:
        "Explorez comment Open Spot aide barbiers, coiffeurs, salons d’esthétique, spas, cliniques beauté et ongleries à récupérer des annulations par SMS.",
      path: "/industries",
      locale: "fr-CA"
    },
    changeFrequency: "monthly",
    priority: 0.9
  },
  {
    path: "/book-call/questions",
    metadata: {
      title: "Questions sur la récupération SMS",
      description:
        "Posez vos questions sur Open Spot, le consentement SMS, les annulations de rendez-vous et le workflow de confirmation manuelle pour votre commerce.",
      path: "/book-call/questions",
      locale: "fr-CA"
    },
    changeFrequency: "monthly",
    priority: 0.85
  },
  {
    path: "/book-call/ready",
    metadata: {
      title: "Appel de démarrage pour annulations SMS",
      description:
        "Planifiez un appel Open Spot si vous êtes prêt à discuter de votre volume d’annulations, de votre liste d’attente SMS et de votre lancement.",
      path: "/book-call/ready",
      locale: "fr-CA"
    },
    changeFrequency: "monthly",
    priority: 0.75
  },
  {
    path: "/politique-confidentialite",
    metadata: {
      title: "Politique de confidentialité",
      description:
        "Consultez la politique de confidentialité d’Open Spot pour comprendre la gestion des renseignements, des SMS et des données des commerces.",
      path: "/politique-confidentialite",
      locale: "fr-CA"
    },
    changeFrequency: "yearly",
    priority: 0.4
  },
  {
    path: "/conditions-utilisation",
    metadata: {
      title: "Conditions d’utilisation",
      description:
        "Consultez les conditions d’utilisation d’Open Spot pour les commerces qui utilisent le service de récupération d’annulations par SMS.",
      path: "/conditions-utilisation",
      locale: "fr-CA"
    },
    changeFrequency: "yearly",
    priority: 0.4
  },
  {
    path: "/consentement-sms",
    metadata: {
      title: "Consentement SMS pour rendez-vous",
      description:
        "Comprenez le consentement SMS, les alertes de rendez-vous, la désinscription STOP et les responsabilités des commerces qui utilisent Open Spot.",
      path: "/consentement-sms",
      locale: "fr-CA"
    },
    changeFrequency: "yearly",
    priority: 0.45
  },
  ...commercialSeoPages.map((page): PublicSeoPage => ({
    path: page.path,
    metadata: page.metadata,
    changeFrequency: "monthly",
    priority: page.path.includes("annulations") ? 0.95 : page.path.includes("liste") ? 0.9 : 0.82
  }))
];

export const publicSitemapEntries = publicSeoPages.map(
  ({ path, changeFrequency, priority }) => ({
    path,
    changeFrequency,
    priority
  })
);

export function getPublicSeoPage(path: string) {
  const page = publicSeoPages.find((entry) => entry.path === path);

  if (!page) {
    throw new Error(`Missing public SEO page definition for ${path}`);
  }

  return page;
}

export function getCommercialSeoPage(path: string) {
  const page = commercialSeoPages.find((entry) => entry.path === path);

  if (!page) {
    throw new Error(`Missing commercial SEO page definition for ${path}`);
  }

  return page;
}

export const sameAsActivationNote =
  `${brandConfig.brandName} JSON-LD sameAs should stay empty until real public profiles exist. Add only verified LinkedIn, GitHub, Google Business, Facebook, or X URLs.`;
