import {
  LEGAL_ENTITY_NAME,
  LEGAL_EYEBROW,
  LEGAL_LAST_UPDATED,
  LEGAL_SIDEBAR_NOTE_DEFAULT,
  LEGAL_SIDEBAR_NOTE_SMS
} from "@/lib/legal/constants";
import type { LegalPageDefinition } from "@/lib/legal/types";

const contactBlock = (heading?: string) =>
  ({
    type: "contact",
    heading,
    entity: LEGAL_ENTITY_NAME
  }) as const;

export const privacyPolicyPage: LegalPageDefinition = {
  slug: "politique-confidentialite",
  title: "Politique de confidentialité",
  eyebrow: LEGAL_EYEBROW,
  description:
    "La présente politique explique comment Open Spot recueille, utilise, conserve et protège les renseignements personnels obtenus par l'entremise de son site web, de ses formulaires, de ses communications et de ses services.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sidebarNote: LEGAL_SIDEBAR_NOTE_DEFAULT,
  sections: [
    {
      id: "renseignements",
      title: "Renseignements que nous recueillons",
      blocks: [
        {
          type: "paragraph",
          text: "Nous pouvons recueillir les renseignements suivants lorsque vous utilisez notre site ou nos services :"
        },
        {
          type: "list",
          items: [
            "nom et prénom",
            "nom du commerce",
            "adresse courriel",
            "numéro de téléphone",
            "type de commerce",
            "système de rendez-vous utilisé",
            "volume approximatif d'annulations",
            "informations fournies dans un formulaire ou lors d'un appel",
            "préférences de communication",
            "données techniques de base liées à l'utilisation du site, comme l'adresse IP, le type d'appareil, le navigateur et les pages consultées."
          ]
        },
        {
          type: "paragraph",
          text: "Nous recueillons uniquement les renseignements nécessaires aux fins décrites dans cette politique."
        }
      ]
    },
    {
      id: "utilisation",
      title: "Utilisation des renseignements",
      blocks: [
        {
          type: "paragraph",
          text: "Nous utilisons les renseignements recueillis pour :"
        },
        {
          type: "list",
          items: [
            "répondre à une demande d'information ou d'appel",
            "communiquer avec vous au sujet d'Open Spot",
            "évaluer si Open Spot peut répondre aux besoins de votre commerce",
            "fournir, améliorer et sécuriser nos services",
            "envoyer des communications liées au service, lorsque vous y avez consenti",
            "respecter nos obligations légales et administratives."
          ]
        },
        {
          type: "paragraph",
          text: "Nous ne vendons pas vos renseignements personnels."
        }
      ]
    },
    {
      id: "communications",
      title: "Communications par SMS et courriel",
      blocks: [
        {
          type: "paragraph",
          text: "Si vous nous fournissez votre numéro de téléphone ou votre adresse courriel, nous pouvons vous contacter au sujet de votre demande, de nos services ou de votre compte, lorsque cela est permis par la loi ou lorsque vous y avez consenti."
        },
        {
          type: "paragraph",
          text: "Vous pouvez vous désabonner des communications promotionnelles en tout temps en suivant les instructions incluses dans le message ou en nous contactant à l'adresse courriel indiquée sur cette page."
        }
      ]
    },
    {
      id: "partage",
      title: "Partage des renseignements",
      blocks: [
        {
          type: "paragraph",
          text: "Nous pouvons partager certains renseignements avec des fournisseurs qui nous aident à exploiter notre site ou nos services, par exemple :"
        },
        {
          type: "list",
          items: [
            "hébergement web",
            "outils de formulaire",
            "services d'envoi de courriels",
            "services d'envoi de SMS",
            "outils d'analyse ou de sécurité."
          ]
        },
        {
          type: "paragraph",
          text: "Ces fournisseurs doivent utiliser les renseignements uniquement pour fournir les services demandés."
        },
        {
          type: "paragraph",
          text: "Nous pouvons également communiquer des renseignements si la loi l'exige, pour protéger nos droits, prévenir la fraude ou assurer la sécurité de nos services."
        }
      ]
    },
    {
      id: "conservation",
      title: "Conservation des renseignements",
      blocks: [
        {
          type: "paragraph",
          text: "Nous conservons les renseignements personnels seulement aussi longtemps que nécessaire pour atteindre les objectifs pour lesquels ils ont été recueillis, sauf si une période plus longue est exigée ou permise par la loi."
        },
        {
          type: "paragraph",
          text: "Lorsque les renseignements ne sont plus nécessaires, nous les supprimons, les anonymisons ou les archivons de manière sécuritaire."
        }
      ]
    },
    {
      id: "securite",
      title: "Sécurité",
      blocks: [
        {
          type: "paragraph",
          text: "Nous appliquons des mesures raisonnables pour protéger les renseignements personnels contre l'accès non autorisé, la perte, l'utilisation abusive, la modification ou la divulgation non autorisée."
        },
        {
          type: "paragraph",
          text: "Aucune méthode de transmission ou de stockage électronique n'est toutefois entièrement sécurisée. Nous ne pouvons donc pas garantir une sécurité absolue."
        }
      ]
    },
    {
      id: "temoins",
      title: "Témoins et technologies similaires",
      blocks: [
        {
          type: "paragraph",
          text: "Notre site peut utiliser des témoins ou technologies similaires pour :"
        },
        {
          type: "list",
          items: [
            "assurer le bon fonctionnement du site",
            "améliorer l'expérience utilisateur",
            "comprendre l'utilisation du site",
            "mesurer la performance de nos pages."
          ]
        },
        {
          type: "paragraph",
          text: "Vous pouvez configurer votre navigateur pour refuser certains témoins. Certaines fonctionnalités pourraient alors être limitées."
        }
      ]
    },
    {
      id: "droits",
      title: "Vos droits",
      blocks: [
        {
          type: "paragraph",
          text: "Selon les lois applicables, vous pouvez demander :"
        },
        {
          type: "list",
          items: [
            "l'accès aux renseignements personnels que nous détenons à votre sujet",
            "la correction de renseignements inexacts",
            "le retrait de votre consentement, lorsque le traitement repose sur celui-ci",
            "la suppression de certains renseignements, lorsque permis par la loi",
            "des informations sur la façon dont vos renseignements sont utilisés."
          ]
        },
        {
          type: "paragraph",
          text: "Pour exercer vos droits, contactez-nous à l'adresse courriel indiquée sur cette page."
        }
      ]
    },
    {
      id: "responsable",
      title: "Responsable de la protection des renseignements personnels",
      blocks: [
        {
          type: "paragraph",
          text: "Pour toute question relative à cette politique ou à vos renseignements personnels, vous pouvez contacter :"
        },
        contactBlock("Responsable de la protection des renseignements personnels")
      ]
    },
    {
      id: "modifications",
      title: "Modifications",
      blocks: [
        {
          type: "paragraph",
          text: "Nous pouvons modifier cette politique de temps à autre. La version la plus récente sera publiée sur cette page avec la date de mise à jour."
        }
      ]
    }
  ]
};

export const smsConsentPage: LegalPageDefinition = {
  slug: "consentement-sms",
  title: "Consentement SMS",
  eyebrow: LEGAL_EYEBROW,
  description:
    "La présente page explique comment Open Spot utilise les SMS dans le cadre de ses services et comment les clients peuvent consentir à recevoir des messages, se désabonner ou demander de l'aide.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sidebarNote: LEGAL_SIDEBAR_NOTE_SMS,
  sections: [
    {
      id: "pourquoi",
      title: "Pourquoi des SMS sont envoyés",
      blocks: [
        {
          type: "paragraph",
          text: "Open Spot permet aux commerces participants d'envoyer des SMS à des clients intéressés lorsqu'un rendez-vous se libère, qu'une annulation survient ou qu'une disponibilité devient disponible à court terme."
        },
        {
          type: "paragraph",
          text: "Ces messages peuvent inclure, par exemple :"
        },
        {
          type: "list",
          items: [
            "une disponibilité de dernière minute",
            "une invitation à répondre si le client est intéressé",
            "une confirmation ou un suivi lié à une demande",
            "des informations utiles concernant un rendez-vous ou une disponibilité."
          ]
        }
      ]
    },
    {
      id: "consentement",
      title: "Consentement requis",
      blocks: [
        {
          type: "paragraph",
          text: "Les SMS doivent être envoyés uniquement aux personnes qui ont consenti à être contactées ou lorsque la loi permet une telle communication."
        },
        {
          type: "paragraph",
          text: "Le consentement peut être obtenu, par exemple, lorsqu'un client :"
        },
        {
          type: "list",
          items: [
            "s'inscrit à une liste d'attente",
            "demande à être informé des disponibilités",
            "fournit son numéro de téléphone à cette fin",
            "confirme qu'il accepte de recevoir des alertes SMS",
            "entretient une relation commerciale existante permettant certains messages, lorsque permis par la loi."
          ]
        },
        {
          type: "paragraph",
          text: "Le commerce qui utilise Open Spot demeure responsable de s'assurer que les consentements nécessaires ont été obtenus."
        }
      ]
    },
    {
      id: "contenu",
      title: "Contenu des SMS",
      blocks: [
        {
          type: "paragraph",
          text: "Les SMS envoyés par Open Spot ou par un commerce utilisant Open Spot doivent être clairs, pertinents et liés à l'objectif annoncé."
        },
        {
          type: "paragraph",
          text: "Un message peut contenir :"
        },
        {
          type: "list",
          items: [
            "le nom du commerce",
            "la disponibilité proposée",
            "la date et l'heure du rendez-vous",
            "une instruction de réponse, par exemple répondre OUI ou YES",
            "une instruction de désabonnement, par exemple répondre STOP."
          ]
        }
      ]
    },
    {
      id: "desabonnement",
      title: "Désabonnement",
      blocks: [
        {
          type: "paragraph",
          text: "Le destinataire peut se désabonner des SMS en tout temps."
        },
        {
          type: "paragraph",
          text: "Pour ne plus recevoir de SMS, il peut répondre :"
        },
        {
          type: "paragraph",
          text: "STOP"
        },
        {
          type: "paragraph",
          text: "Après un désabonnement, le numéro concerné ne devrait plus recevoir de messages promotionnels ou d'alertes de disponibilité, sauf si la loi permet un message strictement nécessaire ou si la personne se réinscrit plus tard."
        }
      ]
    },
    {
      id: "aide",
      title: "Aide",
      blocks: [
        {
          type: "paragraph",
          text: "Pour obtenir de l'aide, le destinataire peut répondre :"
        },
        {
          type: "paragraph",
          text: "AIDE"
        },
        {
          type: "paragraph",
          text: "ou contacter le commerce concerné directement."
        },
        {
          type: "paragraph",
          text: "Pour toute question liée à Open Spot, vous pouvez nous joindre à l'adresse courriel indiquée sur cette page."
        }
      ]
    },
    {
      id: "frequence",
      title: "Fréquence des messages",
      blocks: [
        {
          type: "paragraph",
          text: "La fréquence des SMS peut varier selon les disponibilités du commerce, les annulations, les demandes du client et les préférences configurées."
        },
        {
          type: "paragraph",
          text: "Open Spot vise à encourager des messages utiles, ciblés et raisonnables, et non des envois excessifs."
        }
      ]
    },
    {
      id: "frais",
      title: "Frais de messagerie",
      blocks: [
        {
          type: "paragraph",
          text: "Des frais de messagerie ou de données peuvent s'appliquer selon le forfait mobile du destinataire. Ces frais sont établis par le fournisseur mobile du destinataire et ne sont pas contrôlés par Open Spot."
        }
      ]
    },
    {
      id: "responsabilites",
      title: "Responsabilités du commerce",
      blocks: [
        {
          type: "paragraph",
          text: "Le commerce utilisant Open Spot est responsable de :"
        },
        {
          type: "list",
          items: [
            "recueillir et conserver les consentements nécessaires",
            "respecter les demandes de désabonnement",
            "envoyer uniquement des messages pertinents",
            "identifier clairement le commerce dans les communications",
            "respecter les lois applicables en matière de SMS, de confidentialité et de communications électroniques",
            "éviter l'envoi de messages trompeurs, excessifs ou non sollicités."
          ]
        }
      ]
    },
    {
      id: "protection",
      title: "Protection des renseignements",
      blocks: [
        {
          type: "paragraph",
          text: "Les numéros de téléphone et informations associées aux SMS sont traités conformément à notre Politique de confidentialité."
        },
        {
          type: "paragraph",
          text: "Nous utilisons ces informations pour fournir le service, envoyer les messages demandés, gérer les réponses, respecter les désabonnements et assurer la sécurité du service."
        }
      ]
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          type: "paragraph",
          text: "Pour toute question concernant le consentement SMS ou les communications envoyées par Open Spot, contactez-nous :"
        },
        contactBlock()
      ]
    }
  ]
};

export const termsOfUsePage: LegalPageDefinition = {
  slug: "conditions-utilisation",
  title: "Conditions d'utilisation",
  eyebrow: LEGAL_EYEBROW,
  description:
    "Les présentes conditions régissent l'utilisation du site web, des formulaires, des communications et des services offerts par Open Spot.",
  lastUpdated: LEGAL_LAST_UPDATED,
  sidebarNote: LEGAL_SIDEBAR_NOTE_DEFAULT,
  sections: [
    {
      id: "description",
      title: "Description du service",
      blocks: [
        {
          type: "paragraph",
          text: "Open Spot aide les commerces à récupérer des rendez-vous annulés ou disponibles à court terme en facilitant l'envoi de messages SMS à des clients intéressés ou à une liste d'attente."
        },
        {
          type: "paragraph",
          text: "Open Spot ne remplace pas votre système principal de réservation, votre calendrier, votre logiciel de gestion ou votre relation directe avec vos clients. Le commerçant demeure responsable de confirmer manuellement les rendez-vous."
        }
      ]
    },
    {
      id: "utilisation-permise",
      title: "Utilisation permise",
      blocks: [
        {
          type: "paragraph",
          text: "Vous acceptez d'utiliser Open Spot uniquement à des fins légales, raisonnables et conformes aux présentes conditions."
        },
        {
          type: "paragraph",
          text: "Vous vous engagez à ne pas :"
        },
        {
          type: "list",
          items: [
            "utiliser le service pour envoyer des messages non sollicités",
            "contacter des personnes sans consentement approprié",
            "transmettre du contenu trompeur, offensant, illégal ou abusif",
            "tenter d'accéder à des systèmes, comptes ou données sans autorisation",
            "nuire au fonctionnement normal du site ou des services",
            "utiliser Open Spot pour contourner des lois applicables en matière de confidentialité, de protection des consommateurs ou de communications électroniques."
          ]
        }
      ]
    },
    {
      id: "responsabilites-commercant",
      title: "Responsabilités du commerçant",
      blocks: [
        {
          type: "paragraph",
          text: "Si vous utilisez Open Spot pour contacter vos clients, vous êtes responsable de :"
        },
        {
          type: "list",
          items: [
            "vous assurer que vous avez le droit de contacter ces personnes",
            "obtenir les consentements requis",
            "respecter les demandes de désabonnement",
            "vérifier l'exactitude des informations envoyées",
            "confirmer manuellement les rendez-vous",
            "gérer les annulations, retards, absences et conflits de réservation",
            "respecter les lois applicables à votre commerce."
          ]
        },
        {
          type: "paragraph",
          text: "Open Spot fournit un outil de communication et d'organisation. La décision finale de confirmer un client appartient toujours au commerçant."
        }
      ]
    },
    {
      id: "exactitude",
      title: "Exactitude des informations",
      blocks: [
        {
          type: "paragraph",
          text: "Vous acceptez de fournir des informations exactes, complètes et à jour lorsque vous remplissez un formulaire, demandez un appel ou utilisez nos services."
        },
        {
          type: "paragraph",
          text: "Nous ne sommes pas responsables des problèmes causés par des informations inexactes ou incomplètes fournies par vous ou par vos représentants."
        }
      ]
    },
    {
      id: "disponibilite",
      title: "Disponibilité du service",
      blocks: [
        {
          type: "paragraph",
          text: "Nous faisons des efforts raisonnables pour maintenir le site et les services disponibles. Toutefois, nous ne garantissons pas que le service sera toujours disponible, sans interruption ou sans erreur."
        },
        {
          type: "paragraph",
          text: "Nous pouvons modifier, suspendre ou interrompre une partie du site ou des services à tout moment, notamment pour des raisons de maintenance, de sécurité ou d'amélioration."
        }
      ]
    },
    {
      id: "communications",
      title: "Communications SMS et courriel",
      blocks: [
        {
          type: "paragraph",
          text: "Certaines fonctionnalités d'Open Spot peuvent impliquer l'envoi de SMS ou de courriels."
        },
        {
          type: "paragraph",
          text: "Vous êtes responsable de vous assurer que les destinataires ont consenti à recevoir les communications concernées. Vous devez également respecter les règles applicables en matière d'identification, de contenu et de désabonnement."
        },
        {
          type: "paragraph",
          text: "Nous pouvons refuser, suspendre ou limiter l'accès à nos services si nous croyons qu'ils sont utilisés de manière abusive, illégale ou non conforme."
        }
      ]
    },
    {
      id: "frais",
      title: "Frais et services payants",
      blocks: [
        {
          type: "paragraph",
          text: "Certains services d'Open Spot peuvent être gratuits, en essai ou payants. Les prix, modalités de paiement et inclusions seront communiqués avant tout engagement payant."
        },
        {
          type: "paragraph",
          text: "Sauf indication contraire écrite, les frais payés ne sont pas remboursables pour les périodes déjà commencées ou les services déjà fournis."
        }
      ]
    },
    {
      id: "propriete",
      title: "Propriété intellectuelle",
      blocks: [
        {
          type: "paragraph",
          text: "Le site, le nom Open Spot, les textes, interfaces, éléments visuels, logos, fonctionnalités et contenus associés sont la propriété d'Open Spot ou de ses concédants."
        },
        {
          type: "paragraph",
          text: "Vous ne pouvez pas copier, modifier, distribuer, revendre ou exploiter nos contenus ou services sans autorisation écrite préalable."
        }
      ]
    },
    {
      id: "limitation",
      title: "Limitation de responsabilité",
      blocks: [
        {
          type: "paragraph",
          text: "Dans la mesure permise par la loi, Open Spot ne peut être tenu responsable des pertes indirectes, pertes de revenus, pertes de clients, erreurs de réservation, absences, retards, annulations, problèmes liés aux fournisseurs tiers ou dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le service."
        },
        {
          type: "paragraph",
          text: "Notre responsabilité totale, si elle est engagée, sera limitée au montant payé par vous pour les services concernés au cours des trois mois précédant l'événement donnant lieu à la réclamation, sauf si la loi impose une responsabilité différente."
        }
      ]
    },
    {
      id: "tiers",
      title: "Services tiers",
      blocks: [
        {
          type: "paragraph",
          text: "Open Spot peut dépendre de services tiers, notamment pour l'hébergement, l'envoi de SMS, l'envoi de courriels, les paiements ou l'analyse technique."
        },
        {
          type: "paragraph",
          text: "Nous ne contrôlons pas entièrement ces services tiers et ne sommes pas responsables de leurs interruptions, erreurs, frais, politiques ou changements."
        }
      ]
    },
    {
      id: "resiliation",
      title: "Résiliation ou suspension",
      blocks: [
        {
          type: "paragraph",
          text: "Nous pouvons suspendre ou résilier votre accès à Open Spot si vous violez les présentes conditions, utilisez le service de manière abusive, présentez un risque de sécurité ou utilisez le service d'une manière pouvant entraîner une responsabilité légale."
        },
        {
          type: "paragraph",
          text: "Vous pouvez cesser d'utiliser nos services en tout temps."
        }
      ]
    },
    {
      id: "lois",
      title: "Lois applicables",
      blocks: [
        {
          type: "paragraph",
          text: "Les présentes conditions sont régies par les lois applicables dans la province de Québec et les lois fédérales du Canada applicables, sauf disposition contraire obligatoire."
        }
      ]
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          type: "paragraph",
          text: "Pour toute question concernant ces conditions, contactez-nous :"
        },
        contactBlock()
      ]
    }
  ]
};

export const legalPages = {
  privacy: privacyPolicyPage,
  smsConsent: smsConsentPage,
  terms: termsOfUsePage
} as const;
