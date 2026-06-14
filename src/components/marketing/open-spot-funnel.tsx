"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";

type Locale = "fr" | "en";

const copy = {
  fr: {
    nav: {
      how: "Comment ça marche",
      why: "Pourquoi Open Spot",
      pricing: "Prix",
      login: "Connexion",
      signup: "Créer un compte",
      call: "Réserver un appel",
      switchLabel: "English"
    },
    hero: {
      eyebrow: "Alertes SMS pour annulations de dernière minute",
      title: "Vos annulations ne devraient pas rester des pertes.",
      subtitle:
        "Quand une place se libère, Open Spot vous aide à lancer une alerte SMS aux bons clients. Ils répondent, vous choisissez qui confirmer, et votre créneau peut redevenir un rendez-vous.",
      primary: "Réserver un appel",
      secondary: "Voir comment ça fonctionne",
      chips: [
        "Aucune app client",
        "Validation manuelle",
        "SMS avec consentement",
        "Adapté à votre commerce"
      ],
      visual: {
        cancelled: "Créneau annulé",
        subtitle: "Un créneau vient de se libérer",
        service: "Coupe régulière",
        duration: "45 min",
        button: "Lancer l’alerte",
        targetedTitle: "Clients ciblés",
        targetedCount: "3",
        sendTitle: "Envoi des alertes",
        sendStatus: "SMS en cours",
        repliesTitle: "Réponses des clients",
        replyOne: "Oui, je peux venir !",
        replyTwo: "Oui, dispo à 14 h 30",
        replyThree: "Merci mais pas dispo aujourd’hui",
        repliesNote: "Les réponses arrivent en temps réel.",
        targetingTitle: "Ciblage par critères",
        targetingInsightOne: "Critère : client volontaire sur la liste SMS",
        targetingInsightTwo: "Critère : intérêt pour ce service",
        targetingInsightThree:
          "Vous envoyez l’alerte aux clients admissibles, puis vous choisissez qui confirmer.",
        manual: "Vous confirmez manuellement",
        recovered: "Créneau récupéré",
        confirmed: "Le rendez-vous est confirmé.",
        controlNote:
          "Vous gardez le contrôle : la confirmation du rendez-vous se fait toujours manuellement.",
        clients: [
          {
            initials: "MA",
            name: "Maya",
            label: "Prioritaire",
            detail: "Client priorisé : n’a pas réservé depuis 2 semaines",
            status: "Envoi…"
          },
          {
            initials: "SA",
            name: "Sarah",
            label: "Intéressée par ce service",
            detail: "N’a pas réservé depuis 10 jours",
            status: "Prêt"
          },
          {
            initials: "LI",
            name: "Lina",
            label: "Cliente fidèle",
            detail: "N’a pas réservé depuis 3 semaines",
            status: "Prêt"
          }
        ]
      }
    },
    sectors: {
      title: "Pensé pour les commerces qui vivent par rendez-vous.",
      items: [
        "Salons de coiffure",
        "Barbiers",
        "Esthétique",
        "Ongleries",
        "Spas",
        "Autres commerces à rendez-vous"
      ]
    },
    problem: {
      title:
        "Une annulation, ce n’est pas juste une case vide. C’est du temps, de l’énergie et du revenu qui disparaissent.",
      text:
        "Vous avez déjà payé le local, l’équipe est prête, le temps est réservé. Quand le créneau reste vide, la perte est réelle. Open Spot transforme ce moment de stress en action simple : lancer une alerte aux clients qui veulent vraiment une place.",
      before: "Avant",
      after: "Après",
      beforeItems: ["14 h 30 — Annulé", "Revenu perdu", "Texter à la main"],
      afterItems: [
        "14 h 30 — Récupéré",
        "Client confirmé",
        "Liste alertée en quelques secondes"
      ]
    },
    workflow: {
      title:
        "De la place vide au client confirmé, sans changer votre système de rendez-vous.",
      note:
        "Open Spot ne remplace pas votre calendrier. Il s’ajoute à votre façon de travailler.",
      steps: [
        ["Lancer l’alerte", "Vous partez du créneau annulé, sans changer votre calendrier."],
        ["Alertes envoyées", "Open Spot prépare une alerte SMS ciblée pour les bons contacts."],
        ["Réponses reçues", "Les réponses arrivent clairement, dans l’ordre."],
        ["Confirmation manuelle", "Vous choisissez la personne à confirmer."]
      ]
    },
    targeting: {
      badge: "Ciblage contrôlé",
      title: "Contactez les bons clients sans spammer toute votre liste",
      text:
        "Open Spot s’appuie sur les services, les préférences et le consentement SMS pour vous aider à contacter des clients admissibles, sans promettre de décision automatique.",
      example:
        "Exemple : cibler les clients inscrits à la liste d’attente qui ont choisi ce type de service.",
      aiRoadmap:
        "Direction produit: l'aide par IA est prevue pour enrichir ce ciblage plus tard. Aujourd'hui, Open Spot reste base sur le consentement, les services et la validation manuelle.",
      note: "Zéro réservation automatique. Vous restez maître de votre agenda.",
      benefits: [
        [
          "Ciblage pertinent",
          "Les services choisis par les clients aident à préparer une alerte plus pertinente."
        ],
        [
          "Réponse plus rapide",
          "Les alertes partent en quelques secondes aux bons contacts."
        ],
        [
          "Vous gardez le contrôle",
          "Vous confirmez chaque créneau. Rien n’est réservé sans votre accord."
        ]
      ],
      rows: [
        ["Coupe régulière", "Service compatible"],
        ["Maya", "Intéressée"],
        ["Consentement SMS", "Actif"],
        ["Confirmation", "Manuelle"]
      ],
      workflow: [
        "Lancer l’alerte",
        "Alertes envoyées",
        "Réponses reçues",
        "Confirmation manuelle"
      ],
      secondary: "Découvrir comment ça fonctionne"
    },
    personalization: {
      title: "Chaque commerce fonctionne différemment. Open Spot s’adapte au vôtre.",
      text:
        "Votre liste client, vos services, vos horaires, votre façon de confirmer les rendez-vous. L’appel sert à comprendre votre réalité et à brancher Open Spot proprement, sans vous forcer à changer de système.",
      cards: [
        "Vos services",
        "Votre liste client",
        "Votre langue",
        "Vos règles de confirmation",
        "Votre volume d’annulations",
        "Votre façon de travailler"
      ]
    },
    metrics: {
      title:
        "Voyez ce qui partait en pertes devenir des rendez-vous récupérés.",
      disclaimer:
        "Exemple illustratif. Les résultats dépendent de votre volume d’annulations, de votre liste client et de vos services.",
      cards: [
        ["Annulations", "18"],
        ["Alertes envoyées", "42"],
        ["Réponses reçues", "16"],
        ["Créneaux récupérés", "9"]
      ]
    },
    trust: {
      title: "Simple pour vous. Respectueux pour vos clients.",
      text:
        "Open Spot doit être utilisé avec des clients qui ont accepté de recevoir des messages. Le produit est pensé pour protéger la confiance, pas pour brûler votre liste client.",
      cards: [
        "Consentement SMS clair",
        "Désinscription STOP",
        "Pas d’app à installer",
        "Validation manuelle",
        "Pas de spam",
        "Vous gardez votre système actuel"
      ]
    },
    pricing: {
      badge: "Tarification",
      title: "Une tarification adaptee a votre commerce",
      price: "Discutee apres echange",
      commission:
        "+ commission sur rendez-vous récupéré, discutée selon votre fonctionnement",
      text:
        "L’appel permet de vérifier votre volume, vos services et la meilleure façon de connecter Open Spot à votre commerce.",
      ready: "Je suis prêt à récupérer mes annulations",
      questions: "Parler à quelqu’un",
      trust: ["Sans engagement", "Mise en place rapide", "Adapté à votre commerce"]
    },
    final: {
      title: "Prêt à transformer vos annulations en rendez-vous récupérés ?",
      text:
        "Réservez un appel. On regarde votre commerce, vos services, vos annulations et la meilleure façon de connecter Open Spot à votre réalité.",
      ready: "Je suis prêt à récupérer mes annulations",
      questions: "Parler à quelqu’un"
    }
  },
  en: {
    nav: {
      how: "How it works",
      why: "Why Open Spot",
      pricing: "Pricing",
      login: "Sign in",
      signup: "Create account",
      call: "Book a call",
      switchLabel: "Français"
    },
    hero: {
      eyebrow: "SMS alerts for last-minute cancellations",
      title: "Your cancellations shouldn’t stay lost revenue.",
      subtitle:
        "When a spot opens up, Open Spot helps you send an SMS alert to the right customers. They reply, you choose who to confirm, and an empty slot can become a booked appointment again.",
      primary: "Book a call",
      secondary: "See how it works",
      chips: [
        "No customer app",
        "Manual validation",
        "Consent-based SMS",
        "Built around your business"
      ],
      visual: {
        cancelled: "Cancelled spot",
        subtitle: "A spot just opened up",
        service: "Regular haircut",
        duration: "45 min",
        button: "Launch alert",
        targetedTitle: "Targeted customers",
        targetedCount: "3",
        sendTitle: "Alert delivery",
        sendStatus: "SMS in progress",
        repliesTitle: "Customer replies",
        replyOne: "Yes, I can come in!",
        replyTwo: "Yes, 2:30 works",
        replyThree: "Thanks, but not today",
        repliesNote: "Replies arrive in real time.",
        targetingTitle: "Criteria-based targeting",
        targetingInsightOne: "Criteria: opted-in waitlist customer",
        targetingInsightTwo: "Signal: interest in this service",
        targetingInsightThree:
          "You send the alert to eligible customers, then choose who to confirm.",
        manual: "You confirm manually",
        recovered: "Spot recovered",
        confirmed: "The appointment is confirmed.",
        controlNote:
          "You keep control: the appointment confirmation is always handled manually.",
        clients: [
          {
            initials: "MA",
            name: "Maya",
            label: "Priority",
            detail: "Prioritized customer: has not booked in 2 weeks",
            status: "Sending..."
          },
          {
            initials: "SA",
            name: "Sarah",
            label: "Interested in this service",
            detail: "Has not booked in 10 days",
            status: "Ready"
          },
          {
            initials: "LI",
            name: "Lina",
            label: "Loyal customer",
            detail: "Has not booked in 3 weeks",
            status: "Ready"
          }
        ]
      }
    },
    sectors: {
      title: "Built for businesses that run on appointments.",
      items: [
        "Hair salons",
        "Barbers",
        "Beauty studios",
        "Nail salons",
        "Spas",
        "Other appointment-based businesses"
      ]
    },
    problem: {
      title:
        "A cancellation is not just an empty box. It is time, energy, and revenue disappearing.",
      text:
        "You already paid for the space, the team is ready, and the time was reserved. When the spot stays empty, the loss is real. Open Spot turns that stressful moment into one simple action: alert customers who truly want a spot.",
      before: "Before",
      after: "After",
      beforeItems: ["2:30 PM — Cancelled", "Lost revenue", "Manual texting"],
      afterItems: [
        "2:30 PM — Recovered",
        "Customer confirmed",
        "List alerted in seconds"
      ]
    },
    workflow: {
      title:
        "From empty spot to confirmed customer, without changing your booking system.",
      note:
        "Open Spot does not replace your calendar. It fits into the way you already work.",
      steps: [
        ["Launch the alert", "You start from the cancelled spot without changing your calendar."],
        ["Alerts sent", "Open Spot prepares a targeted SMS alert for the right contacts."],
        ["Replies received", "Replies arrive clearly, in order."],
        ["Manual confirmation", "You choose who to confirm."]
      ]
    },
    targeting: {
      badge: "Controlled targeting",
      title: "Contact the right customers without blasting your full list",
      text:
        "Open Spot uses services, preferences, and SMS consent to help you contact eligible customers without promising automated decisions.",
      example:
        "Example: target waitlist customers who selected this type of service.",
      aiRoadmap:
        "Product direction: AI assistance is planned to improve this targeting later. Today, Open Spot remains based on consent, services, and manual validation.",
      note: "Zero automatic booking. You stay in control of your calendar.",
      benefits: [
        [
          "Relevant targeting",
          "Customer-selected services help prepare a more relevant alert."
        ],
        [
          "Faster response",
          "Alerts go out in seconds to the right contacts."
        ],
        [
          "You keep control",
          "You confirm every spot. Nothing is booked without your approval."
        ]
      ],
      rows: [
        ["Regular haircut", "Compatible service"],
        ["Maya", "Interested"],
        ["SMS consent", "Active"],
        ["Confirmation", "Manual"]
      ],
      workflow: [
        "Launch the alert",
        "Alerts sent",
        "Replies received",
        "Manual confirmation"
      ],
      secondary: "See how it works"
    },
    personalization: {
      title: "Every business works differently. Open Spot adapts to yours.",
      text:
        "Your customer list, services, schedule, and confirmation rules. The call helps us understand your reality and connect Open Spot cleanly without forcing you to change systems.",
      cards: [
        "Your services",
        "Your customer list",
        "Your language",
        "Your confirmation rules",
        "Your cancellation volume",
        "Your way of working"
      ]
    },
    metrics: {
      title: "See what used to become losses turn into recovered appointments.",
      disclaimer:
        "Illustrative example. Results depend on your cancellation volume, customer list, and services.",
      cards: [
        ["Cancellations", "18"],
        ["Alerts sent", "42"],
        ["Replies received", "16"],
        ["Spots recovered", "9"]
      ]
    },
    trust: {
      title: "Simple for you. Respectful for your customers.",
      text:
        "Open Spot should be used with customers who agreed to receive messages. The product is designed to protect trust, not burn through your customer list.",
      cards: [
        "Clear SMS consent",
        "STOP unsubscribe",
        "No app to install",
        "Manual validation",
        "No spam",
        "Keep your current system"
      ]
    },
    pricing: {
      badge: "Pricing",
      title: "Pricing adapted to your business",
      price: "Discussed after a conversation",
      commission:
        "+ recovered-booking commission, discussed based on your workflow",
      text:
        "The call helps verify your volume, services, and the best way to connect Open Spot to your business.",
      ready: "I’m ready to recover cancellations",
      questions: "Talk to someone",
      trust: ["No commitment", "Fast setup", "Adapted to your business"]
    },
    final: {
      title: "Ready to turn cancellations into recovered appointments?",
      text:
        "Book a call. We’ll look at your business, services, cancellations, and the best way to connect Open Spot to your reality.",
      ready: "I’m ready to recover cancellations",
      questions: "Talk to someone"
    }
  }
} as const;

type Copy = (typeof copy)[Locale];

export function OpenSpotFunnel() {
  const [locale, setLocale] = useState<Locale>("fr");
  const t = copy[locale];

  const toggleLocale = () => {
    setLocale((current) => (current === "fr" ? "en" : "fr"));
  };

  return (
    <>
      <MarketingHeader locale={locale} onToggleLocale={toggleLocale} t={t} />
      <main className="overflow-hidden">
        <HeroSection t={t} />
        <SectorSection t={t} />
        <ProblemSection t={t} />
        <WorkflowSection t={t} />
        <PersonalizationSection t={t} />
        <MetricsSection t={t} />
        <TrustSection t={t} />
        <PricingSection t={t} />
        <AiSection t={t} />
        <FinalCtaSection t={t} />
      </main>
    </>
  );
}
function MarketingHeader({
  locale,
  onToggleLocale,
  t
}: {
  locale: Locale;
  onToggleLocale: () => void;
  t: Copy;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-[#fbfaf7]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:flex-nowrap">
        <Link
          className="rounded-md text-base font-black tracking-tight text-[#14262e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
          href="/"
        >
          Open Spot
        </Link>
        <nav
          aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}
          className="hidden items-center gap-1 lg:flex"
        >
          <HeaderLink href="#comment-ca-marche">{t.nav.how}</HeaderLink>
          <HeaderLink href="#pourquoi-open-spot">{t.nav.why}</HeaderLink>
          <HeaderLink href="#prix">{t.nav.pricing}</HeaderLink>
        </nav>
        <div className="flex w-full shrink-0 items-center gap-2 overflow-x-auto sm:w-auto sm:overflow-visible">
          <Link
            className="shrink-0 rounded-full border border-[#d8e3df] bg-white px-3 py-2 text-xs font-bold text-[#254047] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b7cdc6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:text-sm"
            href="/sign-in"
          >
            {t.nav.login}
          </Link>
          <Link
            className="shrink-0 rounded-full bg-[#14262e] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#254047] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14262e] sm:text-sm"
            href="/signup"
          >
            {t.nav.signup}
          </Link>
          <Link
            className="hidden shrink-0 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] md:inline-flex"
            href="/book-call/questions"
          >
            {t.nav.call}
          </Link>
          <button
            aria-label={locale === "fr" ? "Afficher la page en anglais" : "Show page in French"}
            className="shrink-0 rounded-full border border-[#d8e3df] bg-white px-3 py-2 text-xs font-bold text-[#254047] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b7cdc6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            onClick={onToggleLocale}
            type="button"
          >
            {locale === "fr" ? "FR / EN" : "EN / FR"}
          </button>
        </div>
      </div>
    </header>
  );
}
function HeaderLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-white hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      href={href}
    >
      {children}
    </Link>
  );
}

function Section({
  id,
  className,
  children
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn("mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16", className)}
      id={id}
    >
      {children}
    </section>
  );
}

function HeroSection({ t }: { t: Copy }) {
  return (
    <Section className="pt-8 pb-10 sm:pt-10 lg:pt-14 lg:pb-14">
      <div className="os-reveal mx-auto max-w-4xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
          {t.hero.eyebrow}
        </p>
        <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-[#14262e] sm:text-5xl lg:text-6xl">
          {t.hero.title}
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[var(--muted)] sm:text-lg">
          {t.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="os-primary-cta" href="/book-call/questions">
            {t.hero.primary}
          </Link>
          <Link className="os-secondary-cta" href="#comment-ca-marche">
            {t.hero.secondary}
          </Link>
        </div>
        <ul className="mt-7 flex flex-wrap justify-center gap-2" aria-label="Trust indicators">
          {t.hero.chips.map((chip) => (
            <li className="os-chip" key={chip}>
              {chip}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-10 lg:mt-12">
        <HeroMockup t={t} />
      </div>
    </Section>
  );
}

function HeroMockup({ t }: { t: Copy }) {
  return (
    <div
      aria-label="Open Spot product preview showing a merchant launching an alert, receiving SMS replies, and manually confirming a recovered spot."
      className="os-reveal os-hero-mockup mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 p-3 shadow-[0_28px_90px_rgba(36,54,66,0.14)] backdrop-blur sm:p-5 lg:p-6"
      role="img"
    >
      <div className="rounded-[1.65rem] border border-[#e5ebe7] bg-[#fbfaf7] p-3 shadow-sm sm:p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-[#e4ebe7] pb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#14262e] text-xs font-black text-white">
              2C
            </span>
            <div>
              <p className="text-sm font-black text-[#14262e]">Open Spot</p>
              <p className="text-[11px] font-bold text-[var(--muted)]">SMS recovery</p>
            </div>
          </div>
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full border border-[#dce6e2] bg-white text-sm text-[#254047]"
          >
            !
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-[#e2e9e5] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-black text-[#14262e]">
                  {t.hero.visual.cancelled}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                  {t.hero.visual.subtitle}
                </p>
              </div>
              <span className="rounded-full bg-[#fdebea] px-3 py-1 text-sm font-black text-[#8a1f17]">
                14:30
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#edf1ee] bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf5f2] text-sm font-black text-[var(--primary-strong)]"
                >
                  ✂
                </span>
                <div>
                  <p className="text-base font-black text-[#14262e]">
                    {t.hero.visual.service}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[var(--muted)]">
                    {t.hero.visual.duration}
                  </p>
                </div>
              </div>
              <div className="os-launch-button relative rounded-xl bg-[#14262e] px-5 py-3 text-center text-sm font-black text-white shadow-lg">
                {t.hero.visual.button}
                <span className="os-cursor" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="os-recovered-card rounded-2xl border border-[#c8e0d8] bg-[#edf7f4] p-4 shadow-sm sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--primary-strong)]">
              {t.hero.visual.manual}
            </p>
            <p className="mt-3 text-2xl font-black text-[#14262e]">
              {t.hero.visual.recovered}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--muted)]">
              {t.hero.visual.confirmed}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.8fr_1fr]">
          <div className="rounded-2xl border border-[#e2e9e5] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-[#14262e]">
                {t.hero.visual.targetedTitle}
              </p>
              <span className="rounded-full bg-[#eaf5f2] px-2.5 py-1 text-xs font-black text-[var(--primary-strong)]">
                {t.hero.visual.targetedCount}
              </span>
            </div>
            <div className="space-y-2.5">
              {t.hero.visual.clients.map((client, index) => (
                <div
                  className={cn(
                    "os-target-row rounded-xl border border-[#edf1ee] bg-[#fbfaf7] p-3",
                    index === 1 && "os-delay-1",
                    index === 2 && "os-delay-2"
                  )}
                  key={client.name}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#dfece8] text-[11px] font-black text-[#15534b]">
                      {client.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-[#14262e]">{client.name}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--primary-strong)]">
                          SMS
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-black text-[#254047]">{client.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        {client.detail}
                      </p>
                    </div>
                    {index === 0 ? (
                      <span className="os-status-pill shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#8a4b11]">
                        {client.status}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2e9e5] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#14262e]">
                  {t.hero.visual.sendTitle}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                  {t.hero.visual.sendStatus}
                </p>
              </div>
              <span className="os-paper-plane grid h-10 w-10 place-items-center rounded-full bg-[#eef3ff] text-sm font-black text-[#4f61b5]">
                ➤
              </span>
            </div>
            <div className="mt-5 space-y-2" aria-hidden="true">
              <span className="os-motion-line block h-1.5 rounded-full bg-[#cddbd6]" />
              <span className="os-motion-line os-delay-1 block h-1.5 rounded-full bg-[#dbe7e3]" />
              <span className="os-motion-line os-delay-2 block h-1.5 rounded-full bg-[#e8efec]" />
            </div>
            <div className="mt-5 rounded-xl border border-[#edf1ee] bg-[#fbfaf7] p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary-strong)]">
                {t.hero.visual.targetingTitle}
              </p>
              <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-[#254047]">
                <li>{t.hero.visual.targetingInsightOne}</li>
                <li>{t.hero.visual.targetingInsightTwo}</li>
                <li>{t.hero.visual.targetingInsightThree}</li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e2e9e5] bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-[#14262e]">{t.hero.visual.repliesTitle}</p>
            <div className="mt-3 space-y-2">
              <SmsBubble>{t.hero.visual.replyOne}</SmsBubble>
              <SmsBubble delay>{t.hero.visual.replyTwo}</SmsBubble>
              <SmsBubble>{t.hero.visual.replyThree}</SmsBubble>
            </div>
            <p className="mt-3 text-xs font-bold text-[var(--muted)]">
              {t.hero.visual.repliesNote}
            </p>
          </div>
        </div>

        <p className="mt-3 rounded-2xl border border-[#e2e9e5] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#254047]">
          {t.hero.visual.controlNote}
        </p>
      </div>
    </div>
  );
}

function SmsBubble({ children, delay = false }: { children: string; delay?: boolean }) {
  return (
    <div
      className={cn(
        "os-sms-bubble rounded-2xl rounded-bl-md bg-[#fbfaf7] px-3 py-2.5 text-sm font-bold text-[#14262e]",
        delay && "os-delay-2"
      )}
    >
      &quot;{children}&quot;
    </div>
  );
}

function SectorSection({ t }: { t: Copy }) {
  return (
    <Section className="pt-6 lg:pt-8">
      <div className="os-reveal rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-sm sm:p-8">
        <h2 className="max-w-3xl text-2xl font-black tracking-tight text-[#14262e] sm:text-3xl">
          {t.sectors.title}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {t.sectors.items.map((item) => (
            <div className="os-soft-card min-h-24" key={item}>
              <span className="text-sm font-black text-[#14262e]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ProblemSection({ t }: { t: Copy }) {
  return (
    <Section id="pourquoi-open-spot">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="os-reveal">
          <h2 className="text-3xl font-black leading-tight tracking-tight text-[#14262e] sm:text-4xl">
            {t.problem.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-[var(--muted)]">
            {t.problem.text}
          </p>
        </div>
        <div className="os-reveal grid gap-4 sm:grid-cols-2">
          <BeforeAfterCard label={t.problem.before} items={t.problem.beforeItems} tone="bad" />
          <BeforeAfterCard label={t.problem.after} items={t.problem.afterItems} tone="good" />
        </div>
      </div>
    </Section>
  );
}

function BeforeAfterCard({
  label,
  items,
  tone
}: {
  label: string;
  items: readonly string[];
  tone: "bad" | "good";
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white p-5 shadow-sm">
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em]",
          tone === "good" ? "bg-[#eaf5f2] text-[var(--primary-strong)]" : "bg-[#fff1df] text-[#8a4b11]"
        )}
      >
        {label}
      </span>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div className="rounded-2xl bg-[#fbfaf7] px-4 py-3 text-sm font-bold text-[#14262e]" key={item}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowSection({ t }: { t: Copy }) {
  return (
    <Section id="comment-ca-marche">
      <div className="os-section-heading">
        <h2>{t.workflow.title}</h2>
        <p>{t.workflow.note}</p>
      </div>
      <div className="os-workflow-grid mt-10 grid gap-4 md:grid-cols-4">
        {t.workflow.steps.map(([title, text], index) => (
          <article className="os-step-card os-reveal" key={title}>
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function AiSection({ t }: { t: Copy }) {
  return (
    <Section className="pt-8 lg:pt-10">
      <div className="grid gap-8 rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(237,247,244,0.92),rgba(255,247,237,0.7))] p-5 shadow-sm sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
        <div className="os-reveal">
          <p className="inline-flex rounded-full border border-[#c4ddd5] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--primary-strong)]">
            {t.targeting.badge}
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#14262e] sm:text-4xl">
            {t.targeting.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-[var(--muted)]">{t.targeting.text}</p>
          <p className="mt-5 rounded-2xl border border-[#dbe8e4] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#254047]">
            {t.targeting.example}
          </p>
          <p className="mt-3 rounded-2xl border border-[#ead7f7] bg-[#fbf6ff] px-4 py-3 text-sm font-bold leading-6 text-[#5d3478]">
            {t.targeting.aiRoadmap}
          </p>
          <p className="mt-3 rounded-2xl border border-[#c4ddd5] bg-[#fbfffd] px-4 py-3 text-sm font-black leading-6 text-[var(--primary-strong)]">
            {t.targeting.note}
          </p>
          <Link className="os-secondary-cta mt-6" href="#comment-ca-marche">
            {t.targeting.secondary}
          </Link>
        </div>
        <div className="os-reveal rounded-[1.5rem] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {t.targeting.benefits.map(([title, text]) => (
              <div
                className="rounded-2xl border border-[#e5ebe7] bg-[#fbfaf7] p-3"
                key={title}
              >
                <p className="text-sm font-black text-[#14262e]">{title}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[#e5ebe7] bg-[#fbfaf7] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf5f2] text-xs font-black text-[var(--primary-strong)]">
                SMS
              </div>
              <div>
                <p className="text-sm font-black text-[#14262e]">Liste d’attente</p>
                <p className="text-xs text-[var(--muted)]">Aperçu du ciblage</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {t.targeting.rows.map(([label, status]) => (
                <div className="grid gap-2 rounded-2xl border border-[#e5ebe7] bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center" key={label}>
                  <p className="text-sm font-bold text-[#14262e]">{label}</p>
                  <span className="rounded-full bg-[#eaf5f2] px-3 py-1 text-xs font-black text-[var(--primary-strong)]">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {t.targeting.workflow.map((step, index) => (
              <div className="rounded-2xl border border-[#e5ebe7] bg-white p-3" key={step}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eaf5f2] text-xs font-black text-[var(--primary-strong)]">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-black leading-5 text-[#14262e]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function PersonalizationSection({ t }: { t: Copy }) {
  return (
    <Section>
      <div className="os-section-heading">
        <h2>{t.personalization.title}</h2>
        <p>{t.personalization.text}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.personalization.cards.map((card) => (
          <div className="os-soft-card os-reveal" key={card}>
            <span className="text-sm font-black text-[#14262e]">{card}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function MetricsSection({ t }: { t: Copy }) {
  return (
    <Section>
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="os-reveal">
          <h2 className="text-3xl font-black tracking-tight text-[#14262e] sm:text-4xl">
            {t.metrics.title}
          </h2>
          <p className="mt-5 rounded-2xl border border-[#eadcc2] bg-[#fff7ed] px-4 py-3 text-sm font-bold leading-6 text-[#8a4b11]">
            {t.metrics.disclaimer}
          </p>
        </div>
        <div className="os-reveal rounded-[2rem] border border-white/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {t.metrics.cards.map(([label, value], index) => (
              <div className="rounded-3xl bg-[#fbfaf7] p-4" key={label}>
                <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
                <p className="mt-2 text-3xl font-black text-[#14262e]">{value}</p>
                <div className="mt-4 h-2 rounded-full bg-[#e5ebe7]">
                  <div
                    className={cn(
                      "os-graph-bar h-2 rounded-full bg-[var(--primary)]",
                      index === 1 && "os-graph-bar-wide",
                      index === 2 && "os-graph-bar-mid",
                      index === 3 && "os-graph-bar-short"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function TrustSection({ t }: { t: Copy }) {
  return (
    <Section>
      <div className="os-section-heading">
        <h2>{t.trust.title}</h2>
        <p>{t.trust.text}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.trust.cards.map((card) => (
          <div className="os-soft-card os-reveal" key={card}>
            <span className="text-sm font-black text-[#14262e]">{card}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PricingSection({ t }: { t: Copy }) {
  return (
    <Section id="prix" className="pb-8 lg:pb-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white p-6 text-center shadow-[0_24px_70px_rgba(36,54,66,0.12)] sm:p-10">
        <p className="mx-auto inline-flex rounded-full border border-[#c4ddd5] bg-[#edf7f4] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--primary-strong)]">
          {t.pricing.badge}
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#14262e] sm:text-4xl">
          {t.pricing.title}
        </h2>
        <p className="mt-8 text-3xl font-black tracking-tight text-[#14262e] sm:text-4xl">
          {t.pricing.price}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-6 text-[var(--muted)]">
          {t.pricing.commission}
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          {t.pricing.text}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="os-primary-cta" href="/book-call/ready">
            {t.pricing.ready}
          </Link>
          <Link className="os-secondary-cta" href="/book-call/questions">
            {t.pricing.questions}
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Pricing trust indicators">
          {t.pricing.trust.map((item) => (
            <li className="os-chip" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function FinalCtaSection({ t }: { t: Copy }) {
  return (
    <Section className="pb-20 pt-8 lg:pt-10">
      <div className="os-reveal rounded-[2rem] bg-[#14262e] px-5 py-10 text-center text-white shadow-[0_30px_90px_rgba(20,38,46,0.22)] sm:px-8 lg:py-16">
        <h2 className="mx-auto max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
          {t.final.title}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#d6e3df]">
          {t.final.text}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="os-light-cta" href="/book-call/ready">
            {t.final.ready}
          </Link>
          <Link className="os-dark-secondary-cta" href="/book-call/questions">
            {t.final.questions}
          </Link>
        </div>
      </div>
    </Section>
  );
}
