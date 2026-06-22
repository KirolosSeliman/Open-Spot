"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, PointerEvent, ReactNode } from "react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BookingFlowSection } from "@/components/marketing/booking-flow-section";
import { OpenSpotMetricsShowcase } from "@/components/marketing/open-spot-metrics-showcase";
import { SmsConversationPhone } from "@/components/marketing/sms-conversation-phone";
import type { Locale } from "@/lib/i18n/types";
import {
  calculateRevenueEstimate,
  formatRevenueAmount,
  sliderPercent,
  sliderValueFromClientX
} from "@/lib/marketing/revenue-calculator";
import { cn } from "@/lib/utils/cn";

const loginHref = "/sign-in";

const openSpotCopy = {
  nav: {
    features: "Features",
    how: "How it works",
    pricing: "Pricing",
    contact: "Contact",
    primary: "Log in"
  },
  dashboardTerms: {
    createOpenSpot: "Create open spot",
    repliesReceived: "Replies received",
    manualReview: "Manual review",
    confirmClient: "Confirm client"
  },
  hero: {
    title: ["Recover every booking."],
    subtitle:
      "Open Spot contacts opted-in customers, centralizes replies, and lets your team choose who to confirm - without replacing your appointment system.",
    socialProof: "Built for appointment-based teams",
    primary: "Log in",
    secondary: "How it works",
    categories: [
      "Barbers",
      "Beauty Clinics",
      "Hair Salons",
      "Spas",
      "Nail Studios",
      "Massage Studios",
      "Brows & Lashes",
      "Med Spas",
      "Wellness Clinics",
      "Tattoo Studios",
      "Physiotherapy Clinics",
      "Aesthetic Clinics"
    ]
  },
  metrics: {
    title: ["Fill your schedule", "with simple SMS."],
    subtitle:
      "Open Spot helps you capture interest, notify at the right time, and recover more revenue - with less work.",
    cards: [
      {
        title: "Real-Time Replies",
        text: "See who replied YES as soon as your waitlist responds."
      },
      {
        title: "Revenue Saved",
        text: "Track how much revenue is recovered from filled last-minute openings."
      },
      {
        title: "Manual Confirmation",
        text: "Your team chooses who gets the appointment. No one is confirmed without review."
      },
      {
        title: "Average Fill Time",
        text: "See how quickly last-minute openings are filled after your SMS goes out."
      },
      {
        title: "Successfully Filled Spots",
        text: "Track the number of cancelled appointments you've successfully filled."
      }
    ],
    visuals: {
      yesReplies: "YES replies",
      vsYesterday: "+24% vs yesterday",
      revenueSaved: "Revenue saved",
      thisMonth: "This month",
      reviewed: "Reviewed",
      confirmation: "Confirmation",
      fasterThisWeek: "22% faster this week",
      filledSpots: "filled spots",
      thisWeek: "18% this week"
    }
  },
  setup: {
    tag: "Simple setup",
    title: ["Keep your booking system.", "Recover the empty spots."],
    subtitle:
      "Open Spot works around your existing appointment workflow, so your team can fill last-minute cancellations without changing how clients already book.",
    cards: [
      {
        icon: "calendar",
        title: "No migration needed",
        text: "Keep using your current booking system. Open Spot only helps when a spot opens."
      },
      {
        icon: "bell",
        title: "Built for cancellations",
        text: "Launch a targeted SMS alert when you have an empty appointment to fill."
      },
      {
        icon: "message",
        title: "Clients reply by SMS",
        text: "Interested clients answer directly from their phone. No app download required."
      },
      {
        icon: "shield",
        title: "You stay in control",
        text: "Review the replies and manually choose who gets confirmed."
      }
    ],
    mockups: {
      detected: "Spot opening detected",
      detectedTime: "Tomorrow at 10:00 AM",
      replyReceived: "Reply received",
      available: "Available",
      review: "Review",
      appointment: "May 14 · 10:00 AM · 60 min Facial",
      confirm: "Confirm Sarah"
    }
  },
  revenue: {
    badge: "CALCULATOR",
    title: ["Estimate the revenue", "you could recover"],
    subtitle:
      "Enter a few simple numbers and see how much last-minute cancellations may cost you each month.",
    averageServiceCost: "Average service price",
    lostPerWeek: "Last-minute spots lost per week",
    recoveryEstimate: "Recovery estimate",
    notePrefix: "Based on a",
    noteSuffix: "recovery estimate",
    recoveredRevenue: "Potential recovered revenue",
    monthlyAtRiskBeforeRecovery: "monthly revenue at risk before recovery.",
    primaryCta: "Book a call",
    secondaryCta: "See how it works",
    perMonth: "per month"
  },
  how: {
    tag: "How It Works",
    title: ["From cancellation", "to confirmation—", "just three", "simple steps."],
    steps: [
      {
        number: "01",
        title: "Send Waitlist Alert",
        text: "Notify interested clients in seconds when a spot opens."
      },
      {
        number: "02",
        title: "Review Replies",
        text: "See responses in one clean queue and review who is available."
      },
      {
        number: "03",
        title: "Confirm the Client",
        text: "Choose the best fit and confirm the appointment manually."
      }
    ],
    mockups: {
      detected: "Spot opening detected",
      detectedTime: "Tomorrow at 10:00 AM",
      replyReceived: "Reply received",
      available: "Available",
      review: "Review",
      appointment: "May 14 · 10:00 AM · 60 min Facial",
      confirm: "Confirm Sarah"
    }
  },
  pricing: {
    tag: "Pricing",
    title: ["Personalized pricing for", "every appointment business."],
    subtitle:
      "Every team has different needs. Book a call and we'll walk you through Open Spot, answer your questions, and tailor a setup that fits your workflow, volume, and goals.",
    leftTitle: ["Let's find the", "right setup"],
    leftText: [
      "Open Spot adapts to how your business runs.",
      "We'll help you get the right tools, flows,",
      "and SMS capacity to drive bookings",
      "and reduce no-shows."
    ],
    bullets: [
      "Personalized setup recommendations",
      "SMS volume matched to your needs",
      "Workflow tailored to your business"
    ],
    pill: "Book a call",
    rightTitle: ["Tell us about your business and", "we'll recommend the best setup."],
    options: [
      "Single location or multi-location",
      "Low or high SMS volume",
      "Custom rollout support"
    ],
    primaryCta: "Book a call",
    secondaryCta: "Contact sales",
    primaryHref: "/book-call",
    secondaryHref: "/contact"
  },
  testimonials: {
    title: "What local teams say about Open Spot.",
    text:
      "Human stories from appointment-based teams using consent-based SMS to recover last-minute cancellations while keeping final confirmation in their hands.",
    cards: [
      {
        name: "Maya R.",
        role: "Salon owner",
        business: "Hair salon",
        quote:
          "When someone cancels a color appointment, I do not want my team texting clients one by one. Open Spot lets us send one clean alert, see who replies, and choose the right client without changing our booking system.",
        resultBadge: "Color slot recovered",
        image: "/testimonials/maya-salon-owner.webp",
        imageAlt: "Representative portrait of a salon owner"
      },
      {
        name: "Karim B.",
        role: "Barber shop manager",
        business: "Barber shop",
        quote:
          "Between walk-ins and appointments, we cannot chase every empty chair manually. Now replies land in one place, and I can confirm the client when it actually makes sense for the shop.",
        resultBadge: "Empty chair filled",
        image: "/testimonials/karim-barber-manager.webp",
        imageAlt: "Representative portrait of a barber shop manager"
      },
      {
        name: "Sophie L.",
        role: "Clinic coordinator",
        business: "Beauty clinic",
        quote:
          "We used to lose late-day facial slots because reception was already busy. Open Spot gives us a simple recovery layer beside our calendar, without becoming another booking tool to manage.",
        resultBadge: "Late slot recovered",
        image: "/testimonials/sophie-clinic-coordinator.webp",
        imageAlt: "Representative portrait of a beauty clinic coordinator"
      },
      {
        name: "Amélie T.",
        role: "Spa receptionist",
        business: "Spa",
        quote:
          "Our regulars love knowing when a last-minute opening appears. Consent-based SMS feels personal instead of spammy, and we still decide who gets confirmed.",
        resultBadge: "Manual review kept",
        image: "/testimonials/amelie-spa-receptionist.webp",
        imageAlt: "Representative portrait of a spa receptionist"
      }
    ]
  },
  faq: {
    tag: "FAQ",
    title: "Questions before your first open spot.",
    text:
      "Everything local teams need to know before using consent-based SMS to recover last-minute cancellations.",
    items: [
      {
        question: "Does Open Spot replace my booking system?",
        answer:
          "No. Open Spot is designed to sit beside your existing booking system, not replace it. You keep your current calendar, booking workflow, and staff process. Open Spot only helps you recover last-minute cancellations by notifying opted-in clients and organizing the replies in one place."
      },
      {
        question: "How does Open Spot help fill a last-minute cancellation?",
        answer:
          "When a time slot opens, your team creates an open spot with the service, time, and optional details. Open Spot sends a clean SMS alert to clients who have agreed to receive these updates. Clients reply by text, and your team chooses who to confirm manually."
      },
      {
        question: "Does Open Spot confirm clients for me?",
        answer:
          "No. Open Spot keeps final confirmation in the hands of the business. Even if several clients reply quickly, your team reviews the responses and confirms the client that makes the most sense for the schedule, service, and staff availability."
      },
      {
        question: "Do clients need to download an app?",
        answer:
          "No. Clients receive and reply by regular SMS. This keeps the experience simple for the client and avoids asking them to create an account, install an app, or learn a new booking platform just to claim an opening."
      },
      {
        question: "How does Open Spot handle SMS consent?",
        answer:
          "Open Spot should only be used with clients who have agreed to receive appointment-related SMS updates from your business. The product is built around consent-based recovery, not cold texting or mass spam. Your team should keep consent clear, documented, and aligned with the rules that apply to your location and industry."
      },
      {
        question: "What happens if multiple clients reply?",
        answer:
          "Replies are collected in one place so your team does not have to manage scattered text messages manually. You can review who replied, compare timing or fit, and then confirm the right client. This keeps the decision with your team when another client may be a better match."
      },
      {
        question: "Can I start with a small client list?",
        answer:
          "Yes. Open Spot can start with a small opted-in waitlist or a focused group of loyal clients. You do not need a large audience to recover value from a single cancellation, especially for higher-value services like color, treatments, spa appointments, or longer bookings."
      },
      {
        question: "Is Open Spot a marketing SMS tool?",
        answer:
          "No. Open Spot is not meant to blast promotions or run generic SMS campaigns. It is focused on one practical workflow: helping appointment-based businesses recover real openings caused by cancellations, no-shows, or schedule gaps."
      },
      {
        question: "Which businesses is Open Spot built for?",
        answer:
          "Open Spot is built for appointment-based local businesses such as hair salons, barber shops, beauty clinics, spas, wellness studios, and similar teams. It works best when missed appointments or last-minute cancellations represent real lost revenue."
      },
      {
        question: "How quickly can a team start using it?",
        answer:
          "A team can start with a simple workflow: create an open spot, notify opted-in clients, review replies, and confirm manually. The product should feel lightweight enough for front-desk staff or owners to use without needing a complex setup or a full migration from existing tools."
      }
    ]
  },
  final: {
    title: "Ready to recover your next cancellation?",
    text:
      "Launch a simple SMS recovery workflow that keeps your booking system, your team, and your manual confirmation step in place.",
    primary: "Request a call"
  },
  footer: {
    line: "Recover last-minute cancellations by SMS.",
    columns: [
      ["Product", "Features", "How it works", "Pricing"],
      ["Company", "Contact", "Support"],
      ["Legal", "Privacy", "Terms", "SMS consent"]
    ]
  }
} as const;

const openSpotFrCopy = {
  ...openSpotCopy,
  nav: {
    features: "Fonctionnalites",
    how: "Comment ca marche",
    pricing: "Prix",
    contact: "Contact",
    primary: "Se connecter"
  },
  dashboardTerms: {
    createOpenSpot: "Creer un creneau",
    repliesReceived: "Reponses recues",
    manualReview: "Revision manuelle",
    confirmClient: "Confirmer le client"
  },
  hero: {
    ...openSpotCopy.hero,
    title: ["Recuperez chaque rendez-vous."],
    subtitle:
      "Open Spot contacte les clients consentants, centralise les reponses et laisse votre equipe choisir qui confirmer - sans remplacer votre systeme de rendez-vous.",
    socialProof: "Concu pour les equipes sur rendez-vous",
    primary: "Se connecter",
    secondary: "Comment ca marche",
    categories: [
      "Barbiers",
      "Cliniques beaute",
      "Salons de coiffure",
      "Spas",
      "Studios d'ongles",
      "Massotherapie",
      "Sourcils et cils",
      "Med spas",
      "Cliniques bien-etre",
      "Studios de tatouage",
      "Physiotherapie",
      "Cliniques esthetiques"
    ]
  },
  metrics: {
    title: ["Remplissez votre horaire", "avec de simples SMS."],
    subtitle:
      "Open Spot vous aide a capter l'interet, avertir au bon moment et recuperer plus de revenu avec moins de travail.",
    cards: [
      {
        title: "Reponses en temps reel",
        text: "Voyez qui a repondu OUI des que votre liste d'attente repond."
      },
      {
        title: "Revenu recupere",
        text: "Suivez le revenu recupere grace aux ouvertures de derniere minute remplies."
      },
      {
        title: "Confirmation manuelle",
        text: "Votre equipe choisit qui obtient le rendez-vous. Personne n'est confirme sans revision."
      },
      {
        title: "Temps moyen de remplissage",
        text: "Voyez la vitesse a laquelle les ouvertures de derniere minute sont remplies apres l'envoi du SMS."
      },
      {
        title: "Creneaux remplis",
        text: "Suivez le nombre de rendez-vous annules que vous avez reussi a remplir."
      }
    ],
    visuals: {
      yesReplies: "Reponses OUI",
      vsYesterday: "+24% vs hier",
      revenueSaved: "Revenu recupere",
      thisMonth: "Ce mois-ci",
      reviewed: "Revise",
      confirmation: "Confirmation",
      fasterThisWeek: "22% plus rapide cette semaine",
      filledSpots: "creneaux remplis",
      thisWeek: "18% cette semaine"
    }
  },
  setup: {
    tag: "Configuration simple",
    title: ["Gardez votre systeme de rendez-vous.", "Recuperez les places libres."],
    subtitle:
      "Open Spot fonctionne autour de votre workflow existant, pour que votre equipe remplisse les annulations de derniere minute sans changer la facon dont les clients reservent.",
    cards: [
      {
        icon: "calendar",
        title: "Aucune migration requise",
        text: "Continuez a utiliser votre systeme actuel. Open Spot intervient seulement lorsqu'une place se libere."
      },
      {
        icon: "bell",
        title: "Concu pour les annulations",
        text: "Lancez une alerte SMS ciblee lorsqu'un rendez-vous devient disponible."
      },
      {
        icon: "message",
        title: "Les clients repondent par SMS",
        text: "Les clients interesses repondent directement de leur telephone. Aucune application a telecharger."
      },
      {
        icon: "shield",
        title: "Vous gardez le controle",
        text: "Revisez les reponses et choisissez manuellement qui sera confirme."
      }
    ]
  },
  how: {
    tag: "Comment ca marche",
    title: ["De l'annulation", "a la confirmation", "en trois etapes", "simples."],
    steps: [
      {
        number: "01",
        title: "Envoyer l'alerte",
        text: "Avertissez les clients interesses en quelques secondes lorsqu'une place se libere."
      },
      {
        number: "02",
        title: "Reviser les reponses",
        text: "Voyez les reponses dans une file claire et revisez qui est disponible."
      },
      {
        number: "03",
        title: "Confirmer le client",
        text: "Choisissez le meilleur client et confirmez le rendez-vous manuellement."
      }
    ],
    mockups: {
      detected: "Place disponible detectee",
      detectedTime: "Demain a 10 h",
      replyReceived: "Reponse recue",
      available: "Disponible",
      review: "Reviser",
      appointment: "14 mai · 10 h · Facial 60 min",
      confirm: "Confirmer Sarah"
    }
  },
  revenue: {
    badge: "CALCULATEUR",
    title: ["Estimez le revenu que", "vous pourriez récupérer"],
    subtitle:
      "Entrez quelques chiffres simples et découvrez combien d'argent vos annulations de dernière minute vous coûtent chaque mois.",
    averageServiceCost: "Coût moyen du service",
    lostPerWeek: "Places de dernière minute perdues par semaine",
    recoveryEstimate: "Estimation de récupération",
    notePrefix: "Basé sur une estimation de",
    noteSuffix: "de récupération",
    recoveredRevenue: "Revenu potentiel récupéré",
    monthlyAtRiskBeforeRecovery: "de revenu mensuel à risque avant récupération.",
    primaryCta: "Réserver un appel",
    secondaryCta: "Voir comment ça fonctionne",
    perMonth: "par mois"
  },
  pricing: {
    tag: "Prix",
    title: ["Tarification personnalisee pour", "chaque commerce sur rendez-vous."],
    subtitle:
      "Chaque equipe a des besoins differents. Reservez un appel et nous vous guiderons dans Open Spot, repondrons a vos questions et adapterons la configuration a votre workflow, votre volume et vos objectifs.",
    leftTitle: ["Trouvons la", "bonne configuration"],
    leftText: [
      "Open Spot s'adapte a la facon dont votre commerce fonctionne.",
      "Nous vous aidons a choisir les bons outils, flux,",
      "et la capacite SMS pour generer des rendez-vous",
      "et reduire les absences."
    ],
    bullets: [
      "Recommandations de configuration personnalisees",
      "Volume SMS adapte a vos besoins",
      "Workflow adapte a votre commerce"
    ],
    pill: "Reserver un appel",
    rightTitle: ["Parlez-nous de votre commerce et", "nous recommanderons la meilleure configuration."],
    options: [
      "Emplacement unique ou multi-emplacements",
      "Volume SMS faible ou eleve",
      "Accompagnement de deploiement sur mesure"
    ],
    primaryCta: "Reserver un appel",
    secondaryCta: "Contacter les ventes",
    primaryHref: "/book-call",
    secondaryHref: "/contact"
  },
  testimonials: {
    title: "Ce que les equipes locales disent d'Open Spot.",
    text:
      "Des histoires humaines d'equipes sur rendez-vous qui utilisent les SMS bases sur le consentement pour recuperer les annulations de derniere minute tout en gardant la confirmation finale entre leurs mains.",
    cards: [
      {
        ...openSpotCopy.testimonials.cards[0],
        role: "Proprietaire de salon",
        business: "Salon de coiffure",
        quote:
          "Quand une coloration est annulee, je ne veux pas que mon equipe texte les clients un par un. Open Spot envoie une alerte propre, montre qui repond et nous laisse choisir le bon client.",
        resultBadge: "Coloration recuperee",
        imageAlt: "Portrait representatif d'une proprietaire de salon"
      },
      {
        ...openSpotCopy.testimonials.cards[1],
        role: "Gestionnaire de barbershop",
        business: "Barbershop",
        quote:
          "Entre les walk-ins et les rendez-vous, on ne peut pas courir apres chaque chaise vide. Les reponses arrivent maintenant au meme endroit et je confirme quand ca fait vraiment du sens.",
        resultBadge: "Chaise remplie",
        imageAlt: "Portrait representatif d'un gestionnaire de barbershop"
      },
      {
        ...openSpotCopy.testimonials.cards[2],
        role: "Coordonnatrice de clinique",
        business: "Clinique beaute",
        quote:
          "On perdait des facials en fin de journee parce que la reception etait deja occupee. Open Spot ajoute une couche simple pres de notre calendrier, sans devenir un autre outil de reservation.",
        resultBadge: "Place tardive recuperee",
        imageAlt: "Portrait representatif d'une coordonnatrice de clinique beaute"
      },
      {
        ...openSpotCopy.testimonials.cards[3],
        role: "Receptionniste de spa",
        business: "Spa",
        quote:
          "Nos clientes regulieres aiment savoir quand une place se libere. Les SMS bases sur le consentement restent personnels, et on decide toujours qui sera confirme.",
        resultBadge: "Revision manuelle gardee",
        imageAlt: "Portrait representatif d'une receptionniste de spa"
      }
    ]
  },
  faq: {
    tag: "FAQ",
    title: "Questions avant votre premier creneau.",
    text:
      "Ce que les equipes locales doivent savoir avant d'utiliser des SMS bases sur le consentement pour recuperer les annulations.",
    items: [
      {
        question: "Est-ce qu'Open Spot remplace mon systeme de rendez-vous?",
        answer:
          "Non. Open Spot est concu pour fonctionner a cote de votre systeme actuel, pas pour le remplacer. Vous gardez votre calendrier, votre processus et votre equipe. Open Spot aide seulement a recuperer les annulations de derniere minute en avisant les clients consentants et en organisant les reponses."
      },
      {
        question: "Comment Open Spot aide-t-il a remplir une annulation?",
        answer:
          "Lorsqu'une place se libere, votre equipe cree un creneau avec le service, l'heure et les details utiles. Open Spot envoie une alerte SMS aux clients qui ont accepte ces mises a jour. Les clients repondent par texto et votre equipe choisit qui confirmer manuellement."
      },
      {
        question: "Les clients sont-ils confirmes sans validation?",
        answer:
          "Non. Open Spot garde la confirmation finale entre les mains du commerce. Meme si plusieurs clients repondent rapidement, votre equipe revise les reponses et confirme le client qui convient le mieux a l'horaire, au service et a la disponibilite."
      },
      {
        question: "Les clients doivent-ils telecharger une application?",
        answer:
          "Non. Les clients recoivent et repondent par SMS regulier. L'experience reste simple et ne demande pas de creer un compte ou d'apprendre une nouvelle plateforme."
      },
      {
        question: "Comment Open Spot gere-t-il le consentement SMS?",
        answer:
          "Open Spot devrait etre utilise seulement avec des clients qui ont accepte de recevoir des mises a jour SMS liees aux rendez-vous de votre commerce. Le produit est concu pour des workflows SMS bases sur le consentement, pas pour du cold texting ou du spam de masse."
      },
      {
        question: "Que se passe-t-il si plusieurs clients repondent?",
        answer:
          "Les reponses sont regroupees au meme endroit pour eviter les textos disperses. Vous pouvez reviser les reponses, comparer le moment ou l'ajustement, puis confirmer le bon client."
      },
      {
        question: "Puis-je commencer avec une petite liste?",
        answer:
          "Oui. Open Spot peut commencer avec une petite liste de clients consentants ou un groupe de clientes fideles. Une seule annulation recuperee peut deja creer de la valeur."
      },
      {
        question: "Open Spot est-il un outil de marketing SMS?",
        answer:
          "Non. Open Spot ne sert pas a envoyer des promotions de masse. Il se concentre sur un workflow concret: aider les commerces sur rendez-vous a recuperer les places causees par des annulations, absences ou trous d'horaire."
      },
      {
        question: "Pour quels commerces Open Spot est-il concu?",
        answer:
          "Open Spot est concu pour les commerces locaux sur rendez-vous comme les salons, barbershops, cliniques beaute, spas, studios bien-etre et equipes similaires."
      },
      {
        question: "A quelle vitesse une equipe peut-elle commencer?",
        answer:
          "Une equipe peut commencer avec un workflow simple: creer un creneau, avertir les clients consentants, reviser les reponses et confirmer manuellement."
      }
    ]
  },
  final: {
    title: "Pret a recuperer votre prochaine annulation?",
    text:
      "Lancez un workflow SMS simple qui garde votre systeme de rendez-vous, votre equipe et votre confirmation manuelle en place.",
    primary: "Demander un appel"
  },
  footer: {
    line: "Recuperez les annulations de derniere minute par SMS.",
    columns: [
      ["Produit", "Fonctionnalites", "Comment ca marche", "Prix"],
      ["Entreprise", "Contact", "Support"],
      ["Legal", "Confidentialite", "Conditions", "Consentement SMS"]
    ]
  }
} as const;

const copy = {
  en: openSpotCopy,
  fr: openSpotFrCopy
} as const;

type TemplateCopy = (typeof copy)[Locale];

const socialProofAvatars = [
  {
    alt: "Appointment team member",
    src: "/lunera-style/avatars/review-1.jpg"
  },
  {
    alt: "Salon team member",
    src: "/lunera-style/avatars/review-2.jpg"
  },
  {
    alt: "Clinic team member",
    src: "/lunera-style/avatars/review-3.jpg"
  }
] as const;

export function LuneraOpenSpotTemplate({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.classList.add("is-reveal-ready");

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-lunera-reveal]")
    );

    if (media.matches) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();

      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
        item.classList.add("is-visible");
      }

      observer.observe(item);
    });

    return () => observer.disconnect();
  }, [locale]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (media.matches) {
      return;
    }

    let animationFrame = 0;

    function updateProgress() {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        rootRef.current?.style.setProperty(
          "--lunera-progress",
          Math.min(1, Math.max(0, progress)).toFixed(4)
        );
      });
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return (
    <div
      className="lunera-template min-h-screen overflow-hidden bg-white text-[#05070a]"
      ref={rootRef}
      style={{ "--lunera-progress": 0 } as CSSProperties}
    >
      <FloatingNavbar locale={locale} t={t} />
      <main>
        <Hero locale={locale} t={t} />
        <OpenSpotMetricsShowcase locale={locale} />
        <RevenueCalculatorSection locale={locale} t={t} />
        <BookingFlowSection locale={locale} />
        <SetupSection t={t} />
        <HowItWorks t={t} />
        <PersonalizedPricingSection t={t} />
        <Testimonials t={t} />
        <Faq t={t} />
        <FinalCta t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}

function FloatingNavbar({ locale, t }: { locale: Locale; t: TemplateCopy }) {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-3 sm:top-5">
      <div className="mx-auto flex min-h-[3.45rem] w-[calc(100vw-1.5rem)] max-w-[54rem] items-center justify-between gap-2 rounded-full border border-white/90 bg-white/94 px-3 py-2 shadow-[0_16px_44px_rgba(15,23,42,0.11)] backdrop-blur-2xl sm:min-h-[3.75rem] sm:w-[calc(100vw-2rem)] sm:px-4">
        <Link
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-full text-[0.94rem] font-bold text-[#07090f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3478ff]"
          href="/"
        >
          <OpenSpotMark />
          <span className="whitespace-nowrap">Open Spot</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          <NavLink href="#features">{t.nav.features}</NavLink>
          <NavLink href="#how-it-works">{t.nav.how}</NavLink>
          <NavLink href="#pricing">{t.nav.pricing}</NavLink>
          <NavLink href="/contact">{t.nav.contact}</NavLink>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher
            className="hidden border-slate-200/80 bg-white/90 shadow-[0_10px_24px_rgba(15,23,42,0.08)] min-[440px]:inline-flex"
            initialLocale={locale}
          />
          <Link
            className="inline-flex min-h-[2.38rem] items-center justify-center rounded-full bg-black px-3.5 text-[0.78rem] font-bold text-white shadow-[0_12px_26px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 sm:min-h-[2.5rem] sm:px-4"
            href={loginHref}
          >
            {t.nav.primary}
          </Link>
        </div>
      </div>
    </header>
  );
}

function OpenSpotMark() {
  return (
    <span aria-hidden="true" className="lunera-brand-mark">
      <span className="lunera-brand-stroke lunera-brand-stroke-top" />
      <span className="lunera-brand-stroke lunera-brand-stroke-bottom" />
    </span>
  );
}

function NavLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      className="rounded-full px-3 py-2 text-[0.82rem] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
      href={href}
    >
      {children}
    </Link>
  );
}

function Hero({ locale, t }: { locale: Locale; t: TemplateCopy }) {
  return (
    <section
      className="lunera-hero-section relative isolate overflow-hidden px-4 pt-24 sm:pt-28"
      data-lunera-hero
      id="features"
    >
      <div className="lunera-hero-sky absolute inset-0 -z-20" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(223,243,255,0.96)_0%,rgba(234,248,255,0.82)_44%,rgba(255,255,255,0)_86%)]" />
      <div className="mx-auto max-w-[70rem] text-center">
        <h1
          className="lunera-hero-title mx-auto max-w-[61rem] text-balance text-5xl font-black leading-[0.96] text-[#040507] sm:text-6xl lg:text-7xl"
          data-lunera-reveal
        >
          {t.hero.title.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </h1>
        <p
          className="lunera-hero-subtitle mx-auto mt-5 max-w-[19.5rem] text-balance px-1 text-base font-medium leading-7 text-[#526173] sm:max-w-[44rem] sm:text-lg"
          data-lunera-reveal
        >
          {t.hero.subtitle}
        </p>
      </div>
      <HeroPhoneMockup locale={locale} />
      <div className="lunera-hero-lower-content">
        <HeroSocialProof label={t.hero.socialProof} />
        <HeroCtaRow t={t} />
        <CategoryStrip items={t.hero.categories} />
      </div>
      <HeroCloudBlend />
    </section>
  );
}

function HeroPhoneMockup({ locale }: { locale: Locale }) {
  return (
    <div className="lunera-hero-visual-scene" data-lunera-reveal>
      <div className="lunera-phone-depth-layer">
        <SmsConversationPhone locale={locale} />
      </div>
    </div>
  );
}

function HeroSocialProof({ label }: { label: string }) {
  return (
    <div className="lunera-hero-social-proof" data-lunera-reveal>
      <div className="lunera-avatar-stack" aria-hidden="true">
        {socialProofAvatars.map((avatar) => (
          <span key={avatar.src}>
            <Image
              alt={avatar.alt}
              className="open-spot-social-avatar"
              height={44}
              src={avatar.src}
              width={44}
            />
          </span>
        ))}
      </div>
      <div>
        <div className="lunera-stars" aria-label="Five star social proof">
          {"★★★★★"}
        </div>
        <p>{label}</p>
      </div>
    </div>
  );
}

function HeroCtaRow({ t }: { t: TemplateCopy }) {
  return (
    <div
      className="lunera-hero-cta-row relative z-40 mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row"
      data-lunera-reveal
    >
      <Link className="lunera-cta-primary bg-[#3478ff]" href={loginHref}>
        {t.hero.primary}
      </Link>
      <Link className="lunera-cta-secondary" href="#how-it-works">
        {t.hero.secondary}
      </Link>
    </div>
  );
}

function CategoryStrip({ items }: { items: readonly string[] }) {
  return (
    <div className="open-spot-category-marquee relative z-40 mx-auto" aria-label="Appointment business types">
      <div className="open-spot-category-marquee-track">
        <div className="open-spot-category-marquee-group">
          {items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div aria-hidden="true" className="open-spot-category-marquee-group">
          {items.map((item) => (
            <span key={`duplicate-${item}`}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroCloudBlend() {
  return (
    <div aria-hidden="true" className="lunera-hero-cloud-blend lunera-cloud-occlusion-system">
      <div className="lunera-cloud-blob lunera-cloud-blob-left" />
      <div className="lunera-cloud-blob lunera-cloud-blob-center" />
      <div className="lunera-cloud-blob lunera-cloud-blob-right" />
      <div className="lunera-cloud-gradient-whiteout" />
    </div>
  );
}

function SetupIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "calendar":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
          <rect height="22" rx="3.5" stroke="currentColor" strokeWidth="2.6" width="22" x="5" y="6.5" />
          <path d="M10.5 4.5v5M21.5 4.5v5M5.5 13h21" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
          <path d="M11 18h3M18 18h3M11 23h3M18 23h3" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
        </svg>
      );
    case "bell":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
          <path
            d="M9 22.5h14l-1.3-2.4a6.7 6.7 0 0 1-.8-3.2v-3.2a4.9 4.9 0 0 0-9.8 0v3.2c0 1.1-.3 2.2-.8 3.2L9 22.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.6"
          />
          <path d="M13.7 25.2a2.6 2.6 0 0 0 4.6 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
        </svg>
      );
    case "message":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
          <path
            d="M7 15.7c0-5 4.1-8.7 9.1-8.7s8.9 3.7 8.9 8.5-4 8.4-9 8.4c-1.2 0-2.4-.2-3.4-.7L8 25l1.3-4A8.1 8.1 0 0 1 7 15.7Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.6"
          />
          <path d="M12.4 15.8h.1M16 15.8h.1M19.6 15.8h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="3.4" />
        </svg>
      );
    case "shield":
    default:
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
          <path
            d="M16 4.5 25 8v7.1c0 5.8-3.6 10.2-9 12.4-5.4-2.2-9-6.6-9-12.4V8l9-3.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2.6"
          />
          <path d="m12.2 15.9 2.5 2.5 5.4-5.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
        </svg>
      );
  }
}

function SetupSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="open-spot-setup-section">
      <div className="open-spot-setup-panel">
        <span className="open-spot-setup-pill" data-lunera-reveal>
          {t.setup.tag}
        </span>
        <h2 className="open-spot-setup-title" data-lunera-reveal>
          {t.setup.title.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </h2>
        <p className="open-spot-setup-subtitle" data-lunera-reveal>
          {t.setup.subtitle}
        </p>
        <div className="open-spot-setup-grid">
          {t.setup.cards.map((card) => (
            <article className="open-spot-setup-card" data-lunera-reveal key={card.title}>
              <div className="open-spot-setup-icon">
                <SetupIcon icon={card.icon} />
              </div>
              <h3 className="open-spot-setup-card-title">{card.title}</h3>
              <p className="open-spot-setup-card-copy">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ t }: { t: TemplateCopy }) {
  return (
    <section className="open-spot-how-section bg-white px-4 py-20 sm:py-24" id="how-it-works">
      <div className="open-spot-how-shell mx-auto grid">
        <div className="open-spot-how-copy" data-lunera-reveal>
          <span className="open-spot-how-pill">
            {t.how.tag}
          </span>
          <h2 className="open-spot-how-title">
            {t.how.title.map((line) => (
              <span
                className={cn("block", line.includes("confirmation") && "open-spot-how-title-nowrap")}
                key={line}
              >
                {line}
              </span>
            ))}
          </h2>
        </div>
        <div className="open-spot-how-cards">
          {t.how.steps.map((step, index) => (
            <article className="open-spot-how-card" data-lunera-reveal key={step.number}>
              <div className="open-spot-how-card-header">
                <div className="open-spot-how-icon" aria-hidden="true">
                  <StepIcon index={index} />
                  {index === 0 ? "!" : index === 1 ? "2" : "✓"}
                </div>
                <div>
                  <h3 className="open-spot-how-card-title">{step.title}</h3>
                  <p className="open-spot-how-card-copy">
                    {step.text}
                  </p>
                </div>
              </div>
              <StepMiniUi index={index} t={t} />
              <span className="open-spot-how-step-number">
                {step.number}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg fill="none" viewBox="0 0 24 24">
        <path
          d="M7.6 10.1a4.4 4.4 0 0 1 8.8 0v2.6l1.2 2H6.4l1.2-2v-2.6Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M10 17.2a2.1 2.1 0 0 0 4 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg fill="none" viewBox="0 0 24 24">
        <path
          d="M8.5 10.8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15.5 11.5a2.45 2.45 0 1 0 0-4.9 2.45 2.45 0 0 0 0 4.9ZM3.8 18.8c.55-2.9 2.2-4.35 4.7-4.35s4.15 1.45 4.7 4.35M12.8 18.8c.42-2.2 1.75-3.32 3.8-3.32 1.62 0 2.78.68 3.47 2.05"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
        />
      </svg>
    );
  }

  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path
        d="m6.8 12.4 3.15 3.15 7.25-7.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function StepMiniUi({ index, t }: { index: number; t: TemplateCopy }) {
  if (index === 0) {
    return (
      <div className="open-spot-how-mockup open-spot-how-alert-mockup">
        <div className="open-spot-how-alert-row">
          <span className="open-spot-how-alert-dot" aria-hidden="true">
            <StepIcon index={0} />
          </span>
          <div>
            <p>{t.how.mockups.detected}</p>
            <span>{t.how.mockups.detectedTime}</span>
          </div>
        </div>
        <div className="open-spot-how-message-box">
          <div>
            <span className="open-spot-how-skeleton-line is-long" />
            <span className="open-spot-how-skeleton-line is-short" />
          </div>
          <span className="open-spot-how-send" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12.4 18.8 5.7l-4.4 12.6-2.45-4.55L5 12.4Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="open-spot-how-mockup open-spot-how-replies-mockup">
        {[
          ["SM", "Sarah M.", t.how.mockups.replyReceived],
          ["JL", "Jamie L.", t.how.mockups.available],
          ["MC", "Maria C.", t.how.mockups.review]
        ].map(([initials, name, status]) => (
          <div className="open-spot-how-reply-row" key={name}>
            <span className="open-spot-how-initials">
              {initials}
            </span>
            <span className="open-spot-how-reply-name">{name}</span>
            <span className={cn("open-spot-how-reply-badge", status === t.how.mockups.review && "is-neutral")}>
              {status}
            </span>
            <span className="open-spot-how-chevron" aria-hidden="true">›</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="open-spot-how-mockup open-spot-how-confirm-mockup">
      <div className="open-spot-how-confirm-person">
        <span className="open-spot-how-confirm-avatar">
          SM
        </span>
        <div>
          <p>Sarah M.</p>
          <span>{t.how.mockups.appointment}</span>
        </div>
      </div>
      <button
        className="open-spot-how-confirm-button"
        type="button"
      >
        <span aria-hidden="true">✓</span>
        {t.how.mockups.confirm}
      </button>
    </div>
  );
}

function RevenueCalculatorSection({ locale, t }: { locale: Locale; t: TemplateCopy }) {
  const [averageServiceCost, setAverageServiceCost] = useState(110);
  const [lastMinuteSpots, setLastMinuteSpots] = useState(4);
  const [recoveryEstimate, setRecoveryEstimate] = useState(30);
  const { monthlyRevenueAtRisk, recoveredRevenue } = calculateRevenueEstimate({
    averageServicePrice: averageServiceCost,
    lostSpotsPerWeek: lastMinuteSpots,
    recoveryRate: recoveryEstimate
  });

  return (
    <section className="open-spot-revenue-section" id="revenue-calculator">
      <span className="open-spot-revenue-sky" aria-hidden="true" />
      <span className="open-spot-revenue-clouds" aria-hidden="true" />
      <div className="open-spot-revenue-shell" data-lunera-reveal>
        <div className="open-spot-revenue-heading">
          <span className="open-spot-calculator-pill">
            <CalculatorIcon />
            {t.revenue.badge}
          </span>
          <h2 className="open-spot-revenue-title">
            {t.revenue.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="open-spot-revenue-subtitle">
            {t.revenue.subtitle}
          </p>
        </div>

        <div className="open-spot-revenue-card">
          <div className="open-spot-revenue-controls">
            <RevenueSlider
              ariaLabel={t.revenue.averageServiceCost}
              displayValue={formatRevenueAmount(averageServiceCost, locale)}
              icon={<TagIcon />}
              label={t.revenue.averageServiceCost}
              max={200}
              min={25}
              onChange={setAverageServiceCost}
              step={5}
              ticks={[
                { value: 25, label: locale === "fr" ? "25 $" : "$25" },
                { value: 50, label: locale === "fr" ? "50 $" : "$50" },
                { value: 100, label: locale === "fr" ? "100 $" : "$100" },
                { value: 150, label: locale === "fr" ? "150 $" : "$150" },
                { value: 200, label: locale === "fr" ? "200 $" : "$200" }
              ]}
              value={averageServiceCost}
            />
            <RevenueSlider
              ariaLabel={t.revenue.lostPerWeek}
              displayValue={String(lastMinuteSpots)}
              icon={<CalendarIcon />}
              label={t.revenue.lostPerWeek}
              max={20}
              min={1}
              onChange={setLastMinuteSpots}
              step={1}
              ticks={[
                { value: 1, label: "1" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
                { value: 15, label: "15" },
                { value: 20, label: "20" }
              ]}
              value={lastMinuteSpots}
            />
            <RevenueSlider
              ariaLabel={t.revenue.recoveryEstimate}
              displayValue={`${recoveryEstimate} %`}
              icon={<TrendingIcon />}
              label={t.revenue.recoveryEstimate}
              max={100}
              min={10}
              onChange={setRecoveryEstimate}
              step={1}
              ticks={[
                { value: 10, label: "10 %" },
                { value: 25, label: "25 %" },
                { value: 50, label: "50 %" },
                { value: 75, label: "75 %" },
                { value: 100, label: "100 %" }
              ]}
              value={recoveryEstimate}
            />

            <div className="open-spot-revenue-note">
              <InfoIcon />
              <p>
                {t.revenue.notePrefix} <strong>{recoveryEstimate} %</strong> {t.revenue.noteSuffix}
              </p>
            </div>
          </div>

          <ResultMetricCard
            atRiskLabel={t.revenue.monthlyAtRiskBeforeRecovery}
            atRiskValue={formatRevenueAmount(monthlyRevenueAtRisk, locale)}
            label={t.revenue.recoveredRevenue}
            period={t.revenue.perMonth}
            primaryCta={t.revenue.primaryCta}
            recoveredValue={formatRevenueAmount(recoveredRevenue, locale)}
            secondaryCta={t.revenue.secondaryCta}
          />
        </div>
      </div>
    </section>
  );
}

function RevenueSlider({
  ariaLabel,
  displayValue,
  icon,
  label,
  max,
  min,
  onChange,
  step,
  ticks,
  value
}: {
  ariaLabel?: string;
  displayValue: string;
  icon: ReactNode;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  ticks: Array<{ label: string; value: number }>;
  value: number;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const sliderProgress = sliderPercent({ max, min, value });
  const sliderStyle = { "--slider-progress": `${sliderProgress}%` } as CSSProperties;
  const resolvedAriaLabel = ariaLabel ?? label;

  function setDragging(nextDragging: boolean) {
    isDraggingRef.current = nextDragging;
    setIsDragging(nextDragging);
  }

  function getValueFromClientX(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect || rect.width <= 0) {
      return value;
    }

    return sliderValueFromClientX({
      clientX,
      fallbackValue: value,
      max,
      min,
      step,
      trackLeft: rect.left,
      trackWidth: rect.width
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(getValueFromClientX(event.clientX));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) {
      return;
    }

    onChange(getValueFromClientX(event.clientX));
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragging(false);
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    setDragging(true);
    onChange(getValueFromClientX(event.clientX));
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) {
      return;
    }

    onChange(getValueFromClientX(event.clientX));
  }

  function stopMouseDragging() {
    setDragging(false);
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    onChange(getValueFromClientX(event.clientX));
  }

  function handleInputPointerDown(event: PointerEvent<HTMLInputElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.stopPropagation();
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(getValueFromClientX(event.clientX));
  }

  function handleInputPointerMove(event: PointerEvent<HTMLInputElement>) {
    if (!isDraggingRef.current) {
      return;
    }

    event.stopPropagation();
    onChange(getValueFromClientX(event.clientX));
  }

  function stopInputDragging(event: PointerEvent<HTMLInputElement>) {
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragging(false);
  }

  function handleInputMouseDown(event: MouseEvent<HTMLInputElement>) {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    setDragging(true);
    onChange(getValueFromClientX(event.clientX));
  }

  function handleInputMouseMove(event: MouseEvent<HTMLInputElement>) {
    if (!isDraggingRef.current) {
      return;
    }

    event.stopPropagation();
    onChange(getValueFromClientX(event.clientX));
  }

  function stopInputMouseDragging(event: MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
    setDragging(false);
  }

  function handleInputClick(event: MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
    onChange(getValueFromClientX(event.clientX));
  }

  return (
    <div className="open-spot-slider-control">
      <div className="open-spot-slider-label-row">
        <span className="open-spot-slider-icon" aria-hidden="true">
          {icon}
        </span>
        <p className="open-spot-slider-label">{label}</p>
        <span className="open-spot-slider-value" aria-live="polite">
          {displayValue}
        </span>
      </div>
      <div
        className="open-spot-slider-input-wrap"
        data-dragging={isDragging ? "true" : "false"}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseLeave={stopMouseDragging}
        onMouseMove={handleMouseMove}
        onMouseUp={stopMouseDragging}
        onPointerCancel={stopDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        ref={trackRef}
        style={sliderStyle}
      >
        <div className="open-spot-slider-track" aria-hidden="true">
          <span className="open-spot-slider-track-active" />
          <span className="open-spot-slider-marker" />
        </div>
        <input
          aria-label={resolvedAriaLabel}
          aria-valuemax={max}
          aria-valuemin={min}
          aria-valuenow={value}
          aria-valuetext={displayValue}
          className="revenue-calculator-range revenue-slider-native"
          max={max}
          min={min}
          onClick={handleInputClick}
          onChange={(event) => onChange(Number(event.target.value))}
          onInput={(event) => onChange(Number(event.currentTarget.value))}
          onMouseDown={handleInputMouseDown}
          onMouseLeave={stopInputMouseDragging}
          onMouseMove={handleInputMouseMove}
          onMouseUp={stopInputMouseDragging}
          onPointerCancel={stopInputDragging}
          onPointerDown={handleInputPointerDown}
          onPointerMove={handleInputPointerMove}
          onPointerUp={stopInputDragging}
          step={step}
          type="range"
          value={value}
        />
      </div>
      <div className="open-spot-slider-ticks" aria-hidden="true">
        {ticks.map((tick) => (
          <span key={`${tick.value}-${tick.label}`}>{tick.label}</span>
        ))}
      </div>
    </div>
  );
}

function ResultMetricCard({
  atRiskLabel,
  atRiskValue,
  label,
  period,
  primaryCta,
  recoveredValue,
  secondaryCta
}: {
  atRiskLabel: string;
  atRiskValue: string;
  label: string;
  period: string;
  primaryCta: string;
  recoveredValue: string;
  secondaryCta: string;
}) {
  return (
    <aside className="open-spot-revenue-results">
      <div className="open-spot-result-card">
        <p className="open-spot-result-label">{label}</p>
        <p className="open-spot-result-value" aria-live="polite">
          {recoveredValue}
        </p>
        <span className="open-spot-result-period">{period}</span>
      </div>

      <p className="open-spot-result-risk">
        <strong>{atRiskValue}</strong> {atRiskLabel}
      </p>

      <Link className="open-spot-result-primary" href="/book-call">
        <span>{primaryCta}</span>
        <ArrowRightIcon />
      </Link>

      <Link className="open-spot-result-secondary" href="#how-it-works">
        <PlayIcon />
        <span>{secondaryCta}</span>
      </Link>
    </aside>
  );
}

function CalculatorIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="3" stroke="currentColor" strokeWidth="2" width="14" x="5" y="4" />
      <path d="M9 8h6M9 12h2M13 12h2M9 16h2M13 16h2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4.7 12.1 12 4.8h6.3v6.3L11 18.4a2 2 0 0 1-2.8 0l-3.5-3.5a2 2 0 0 1 0-2.8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="16" cy="8" r="1.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11v6M12 7.5v.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4 15.5l5-5 4 4 7-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M15 7.5h5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="15" rx="3" stroke="currentColor" strokeWidth="2" width="16" x="4" y="5" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m10 8.8 5.1 3.2-5.1 3.2V8.8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PersonalizedPricingSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="open-spot-personalized-pricing" id="pricing">
      <div className="open-spot-pricing-heading" data-lunera-reveal>
        <span className="open-spot-pricing-badge">{t.pricing.tag}</span>
        <h2 className="open-spot-pricing-title">
          {t.pricing.title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <p className="open-spot-pricing-subtitle">{t.pricing.subtitle}</p>
      </div>

      <div className="open-spot-pricing-panel" data-lunera-reveal>
        <div className="open-spot-pricing-column open-spot-pricing-column-left">
          <span className="open-spot-pricing-main-icon" aria-hidden="true">
            <PricingCalendarIcon />
          </span>
          <h3 className="open-spot-pricing-left-title">
            {t.pricing.leftTitle.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h3>
          <p className="open-spot-pricing-left-text">
            {t.pricing.leftText.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <ul className="open-spot-pricing-bullets">
            {t.pricing.bullets.map((bullet) => (
              <li key={bullet}>
                <span className="open-spot-pricing-check" aria-hidden="true">
                  <PricingCheckIcon />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="open-spot-pricing-column open-spot-pricing-column-right">
          <span className="open-spot-pricing-call-pill">{t.pricing.pill}</span>
          <h3 className="open-spot-pricing-right-title">
            {t.pricing.rightTitle.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h3>
          <div className="open-spot-pricing-options">
            {t.pricing.options.map((option, index) => (
              <div className="open-spot-pricing-option" key={option}>
                <span className="open-spot-pricing-option-icon" aria-hidden="true">
                  <PricingOptionIcon index={index} />
                </span>
                <span>{option}</span>
              </div>
            ))}
          </div>
          <Link
            aria-label="Book a call about Open Spot pricing"
            className="open-spot-pricing-primary"
            href={t.pricing.primaryHref}
          >
            <span>{t.pricing.primaryCta}</span>
            <span className="open-spot-pricing-arrow" aria-hidden="true">
              <PricingArrowIcon />
            </span>
          </Link>
          <Link
            aria-label="Contact sales about Open Spot pricing"
            className="open-spot-pricing-secondary"
            href={t.pricing.secondaryHref}
          >
            {t.pricing.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricingCalendarIcon() {
  return (
    <svg fill="none" viewBox="0 0 48 48">
      <rect height="27" rx="6" stroke="currentColor" strokeWidth="3" width="30" x="7" y="11" />
      <path d="M14 7v9M30 7v9M8 19h28" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <circle cx="34" cy="34" r="8" fill="#f7fbff" stroke="currentColor" strokeWidth="3" />
      <path d="M34 30v4.4l3 1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function PricingCheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path d="m7 12.2 3.1 3.1L17 8.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

function PricingOptionIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg fill="none" viewBox="0 0 24 24">
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
        <circle cx="12" cy="10" r="2.1" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg fill="none" viewBox="0 0 24 24">
        <path d="M6 19V9M12 19V5M18 19v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
        <path d="M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
      </svg>
    );
  }

  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path d="M5 13v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M7 12H6a2 2 0 0 0-2 2v1.5a2 2 0 0 0 2 2h1v-5.5ZM17 12h1a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2h-1v-5.5ZM17 17.5c0 2-1.4 3-4.2 3H11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function PricingArrowIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}
function Testimonials({ t }: { t: TemplateCopy }) {
  return (
    <section className="open-spot-testimonials-section">
      <SectionHeading subtitle={t.testimonials.text} title={t.testimonials.title} />
      <div className="open-spot-testimonials-grid">
        {t.testimonials.cards.map((testimonial) => (
          <article className="open-spot-testimonial-card" data-lunera-reveal key={testimonial.name}>
            <span className="open-spot-testimonial-shine" aria-hidden="true" />
            <div className="open-spot-testimonial-header">
              <div className="open-spot-testimonial-photo-wrap">
                <Image
                  alt={testimonial.imageAlt}
                  className="open-spot-testimonial-photo"
                  height={96}
                  sizes="96px"
                  src={testimonial.image}
                  width={96}
                />
              </div>
              <div className="open-spot-testimonial-person">
                <h3>{testimonial.name}</h3>
                <p>{testimonial.role}</p>
                <span>{testimonial.business}</span>
              </div>
            </div>
            <div className="open-spot-testimonial-quote-wrap">
              <span className="open-spot-testimonial-quote-mark" aria-hidden="true">
                &ldquo;
              </span>
              <p className="open-spot-testimonial-quote">&ldquo;{testimonial.quote}&rdquo;</p>
            </div>
            <div className="open-spot-testimonial-footer">
              <span className="open-spot-testimonial-badge">{testimonial.resultBadge}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq({ t }: { t: TemplateCopy }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="open-spot-faq-section" id="faq">
      <div className="open-spot-faq-shell">
        <div className="open-spot-faq-copy">
          <span className="lunera-pill" data-lunera-reveal>
            {t.faq.tag}
          </span>
          <h2 className="open-spot-faq-title" data-lunera-reveal>
            {t.faq.title}
          </h2>
          <p className="open-spot-faq-subtitle" data-lunera-reveal>
            {t.faq.text}
          </p>
        </div>
        <div className="open-spot-faq-panel" data-lunera-reveal>
          {t.faq.items.map((item, index) => {
            const isOpen = index === openIndex;
            const answerId = `open-spot-faq-answer-${index}`;
            const triggerId = `open-spot-faq-trigger-${index}`;

            return (
              <article
                className="open-spot-faq-item"
                data-open={isOpen ? "true" : "false"}
                key={item.question}
              >
                <button
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="open-spot-faq-trigger"
                  id={triggerId}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  type="button"
                >
                  <span>{item.question}</span>
                  <span className="open-spot-faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                <div
                  aria-labelledby={triggerId}
                  className="open-spot-faq-answer"
                  id={answerId}
                  role="region"
                >
                  <div className="open-spot-faq-answer-inner">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 pb-20 pt-6">
      <div
        className="mx-auto max-w-[72rem] rounded-[2rem] bg-[#050505] px-6 py-16 text-center text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:px-10 sm:py-20"
        data-lunera-reveal
      >
        <h2 className="mx-auto max-w-[50rem] text-4xl font-black leading-tight sm:text-6xl">
          {t.final.title}
        </h2>
        <p className="mx-auto mt-6 max-w-[40rem] text-base font-medium leading-7 text-white/65">
          {t.final.text}
        </p>
        <Link className="lunera-cta-light mt-9" href="/book-call">
          {t.final.primary}
        </Link>
      </div>
    </section>
  );
}

function Footer({ t }: { t: TemplateCopy }) {
  return (
    <footer className="bg-[#050505] px-4 py-12 text-white">
      <div className="mx-auto grid max-w-[72rem] gap-10 md:grid-cols-[1.45fr_1fr_1fr_1fr]">
        <div>
          <Link className="inline-flex items-center gap-2.5 text-[1.05rem] font-black" href="/">
            <OpenSpotMark />
            <span>Open Spot</span>
          </Link>
          <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-white/55">
            {t.footer.line}
          </p>
          <p className="mt-8 text-xs font-bold text-white/35">
            © 2026 Open Spot. All rights reserved.
          </p>
        </div>
        {t.footer.columns.map(([title, ...links]) => (
          <FooterColumn key={title} links={links} title={title} />
        ))}
      </div>
    </footer>
  );
}

function FooterColumn({ links, title }: { links: readonly string[]; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-black text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {links.map((label) => (
          <Link
            className="text-sm font-bold text-white/50 transition hover:text-white"
            href={footerHref(label)}
            key={label}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function footerHref(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === "features") return "#features";
  if (normalized === "fonctionnalites") return "#features";
  if (normalized === "how it works") return "#how-it-works";
  if (normalized === "comment ca marche") return "#how-it-works";
  if (normalized === "pricing") return "#pricing";
  if (normalized === "prix") return "#pricing";
  if (normalized === "contact") return "/contact";
  if (normalized === "support") return "/contact";
  if (normalized === "privacy") return "/privacy";
  if (normalized === "confidentialite") return "/privacy";
  if (normalized === "terms") return "/terms";
  if (normalized === "conditions") return "/terms";
  if (normalized === "sms consent") return "/privacy";
  if (normalized === "consentement sms") return "/privacy";

  return "/";
}

function SectionHeading({
  subtitle,
  tag,
  title
}: {
  subtitle?: string;
  tag?: string;
  title: readonly string[] | string;
}) {
  const lines = Array.isArray(title) ? title : [title];

  return (
    <div className="mx-auto max-w-[48rem] text-center">
      {tag ? (
        <span className="lunera-pill" data-lunera-reveal>
          {tag}
        </span>
      ) : null}
      <h2
        className={cn(
          "text-4xl font-black leading-[1.04] text-[#05070a] sm:text-5xl",
          tag && "mt-7"
        )}
        data-lunera-reveal
      >
        {lines.map((line) => (
          <span className="block" key={line}>
            {line}
          </span>
        ))}
      </h2>
      {subtitle ? (
        <p className="mx-auto mt-5 max-w-[42rem] text-base font-medium leading-7 text-slate-500" data-lunera-reveal>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
