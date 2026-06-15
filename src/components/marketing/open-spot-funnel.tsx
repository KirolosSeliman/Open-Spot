import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getRequestLocale } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

const marketingCopy = {
  fr: {
    nav: {
      how: "Comment ça marche",
      features: "Pourquoi Open Spot",
      pricing: "Tarifs",
      login: "Connexion",
      signup: "Créer un compte"
    },
    hero: {
      eyebrow: "SMS de récupération pour commerces à rendez-vous",
      title: "Remplissez les annulations sans changer votre système actuel.",
      subtitle:
        "Open Spot aide les salons, barbiers et commerces à rendez-vous à envoyer une alerte SMS aux clients consentants lorsqu’une place se libère. Les réponses sont classées par heure de réception. Vous choisissez toujours qui confirmer.",
      primary: "Réserver un appel",
      secondary: "Voir le fonctionnement",
      proof: ["Validation manuelle", "Clients consentants", "QR liste d’attente", "Aucune app client"],
      manualRule:
        "Un client qui répond OUI, YES ou 1 n’est jamais confirmé automatiquement."
    },
    categories: ["Salons", "Barbiers", "Esthétique", "Ongleries", "Spas", "Soins locaux"],
    problem: {
      kicker: "Le problème",
      title: "Une place vide coûte cher quand l’équipe, le local et le temps sont déjà réservés.",
      text:
        "La plupart des commerces réagissent avec des messages manuels, des appels rapides ou une publication de dernière minute. Open Spot transforme ce moment en un flux simple, traçable et respectueux du consentement SMS.",
      before: ["Annulation à 14 h 30", "Messages envoyés à la main", "Réponses mélangées", "Décision difficile à suivre"],
      after: ["Alerte préparée", "Clients admissibles seulement", "Réponses classées", "Confirmation manuelle"]
    },
    features: {
      kicker: "Produit",
      title: "Un système léger autour de votre façon de travailler.",
      items: [
        ["Alerte SMS ciblée", "Préparez une offre claire pour une ouverture de dernière minute."],
        ["Consentement visible", "Les clients importés ou inscrits gardent un statut de consentement explicite."],
        ["Réponses en file", "OUI, YES et 1 remontent dans une liste lisible, classée par heure."],
        ["Validation manuelle", "Le marchand garde le dernier mot avant toute confirmation."],
        ["QR liste d’attente", "Les clients peuvent s’inscrire eux-mêmes avec consentement SMS."],
        ["Rapports sobres", "Suivez les ouvertures remplies et le revenu récupéré estimé sans promesse garantie."]
      ]
    },
    workflow: {
      kicker: "Comment ça marche",
      title: "Quatre étapes, sans remplacer votre calendrier.",
      steps: [
        ["Créer l’ouverture", "Choisissez le service, l’heure et les détails de la place libérée."],
        ["Préparer l’audience", "Open Spot aide à repérer les clients admissibles et consentants."],
        ["Recevoir les réponses", "Les réponses SMS sont regroupées et classées par heure de réception."],
        ["Confirmer vous-même", "Vous contactez ou confirmez le client choisi, puis le flux reste traçable."]
      ]
    },
    waitlist: {
      kicker: "Liste d’attente QR",
      title: "Un QR code simple pour remplir votre bassin de clients consentants.",
      text:
        "Placez le QR code à la réception. Les clients s’inscrivent eux-mêmes, choisissent leurs intérêts et acceptent les SMS. Ils peuvent se désinscrire avec les mots-clés pris en charge.",
      actions: ["Copier le lien", "Ouvrir la page publique", "Imprimer le QR"]
    },
    sms: {
      kicker: "Flux SMS",
      title: "Les réponses rapides restent sous votre contrôle.",
      bubbles: ["OUI je peux venir", "YES, 14 h 30 works", "1"],
      notes: ["Classé par heure reçue", "Aucune confirmation automatique", "STOP / ARRET / CANCEL respectés"]
    },
    preview: {
      title: "Tableau de bord marchand",
      subtitle: "Vue illustrative, basée sur le flux réel Open Spot.",
      replyQueue: "Réponses",
      metrics: [
        ["Ouvertures", "12"],
        ["Réponses", "38"],
        ["À valider", "5"],
        ["Revenu estimé", "1 240 $"]
      ],
      queue: [
        ["Maya L.", "OUI", "14:03"],
        ["Sarah P.", "YES", "14:05"],
        ["Lina R.", "1", "14:07"]
      ]
    },
    pricing: {
      kicker: "Tarifs",
      title: "Une tarification adaptée au volume réel.",
      text:
        "Pas de faux prix public ni de promesse de revenu garanti. Le bon modèle dépend du volume d’annulations, des services, de l’usage SMS et de la façon dont votre commerce confirme les rendez-vous.",
      cta: "Discuter des tarifs"
    },
    useCases: {
      kicker: "Cas d’usage",
      title: "Conçu pour les commerces où une heure vide compte.",
      items: ["Coupe annulée le jour même", "Soin esthétique libéré", "Place de barbier disponible", "Rappel à une liste d’attente"]
    },
    faq: {
      kicker: "Questions",
      title: "Clair avant de l’utiliser avec vos clients.",
      items: [
        ["Est-ce que le premier client qui répond est confirmé ?", "Non. Les réponses sont classées, mais le marchand valide manuellement."],
        ["Est-ce que les clients doivent installer une app ?", "Non. Ils répondent par SMS."],
        ["Est-ce que Open Spot remplace mon calendrier ?", "Non. Il s’ajoute à votre système actuel."],
        ["Puis-je envoyer à toute ma liste ?", "L’interface doit renforcer l’envoi aux clients admissibles et consentants seulement."]
      ]
    },
    final: {
      title: "Prêt à récupérer plus de places sans perdre le contrôle ?",
      text:
        "Réservez un appel. On regarde votre commerce, vos services, vos annulations et la meilleure façon de brancher Open Spot proprement.",
      primary: "Réserver un appel",
      secondary: "Voir les tarifs"
    },
    footer: {
      line: "SMS-first cancellation recovery for appointment-based local businesses.",
      privacy: "Confidentialité",
      terms: "Conditions"
    }
  },
  en: {
    nav: {
      how: "How it works",
      features: "Product",
      pricing: "Pricing",
      login: "Sign in",
      signup: "Create account"
    },
    hero: {
      eyebrow: "SMS recovery for appointment-based businesses",
      title: "Fill cancellations without changing your current system.",
      subtitle:
        "Open Spot helps salons, barbers, and appointment-based businesses send an SMS alert to opted-in customers when a spot opens up. Replies are ranked by received time. You always choose who to confirm.",
      primary: "Book a call",
      secondary: "See how it works",
      proof: ["Manual validation", "Opted-in customers", "QR waitlist", "No customer app"],
      manualRule:
        "A customer who replies OUI, YES, or 1 is never automatically confirmed."
    },
    categories: ["Salons", "Barbers", "Beauty", "Nails", "Spas", "Local care"],
    problem: {
      kicker: "The problem",
      title: "An empty spot is expensive when the team, space, and time are already booked.",
      text:
        "Most businesses react with manual texts, quick calls, or last-minute posts. Open Spot turns that moment into a simple, traceable flow that respects SMS consent.",
      before: ["2:30 cancellation", "Manual messages", "Mixed replies", "Hard-to-track decision"],
      after: ["Alert prepared", "Eligible customers only", "Replies ranked", "Manual confirmation"]
    },
    features: {
      kicker: "Product",
      title: "A lightweight system around the way you already work.",
      items: [
        ["Targeted SMS alert", "Prepare a clear offer for a last-minute opening."],
        ["Visible consent", "Imported or self-registered customers keep explicit consent states."],
        ["Reply queue", "OUI, YES, and 1 replies surface in a readable time-ranked list."],
        ["Manual validation", "The merchant keeps the final say before any confirmation."],
        ["QR waitlist", "Customers can join the waitlist themselves with SMS consent."],
        ["Clear reporting", "Track filled openings and estimated recovered revenue without guarantees."]
      ]
    },
    workflow: {
      kicker: "How it works",
      title: "Four steps without replacing your calendar.",
      steps: [
        ["Create the opening", "Choose the service, time, and details of the open spot."],
        ["Prepare the audience", "Open Spot helps identify eligible opted-in customers."],
        ["Receive replies", "SMS replies are grouped and ranked by received time."],
        ["Confirm manually", "You contact or confirm the chosen customer, and the flow stays traceable."]
      ]
    },
    waitlist: {
      kicker: "QR waitlist",
      title: "A simple QR code to grow your opted-in customer pool.",
      text:
        "Place the QR code at the front desk. Customers sign themselves up, choose interests, and accept SMS. They can opt out using supported keywords.",
      actions: ["Copy link", "Open public page", "Print QR"]
    },
    sms: {
      kicker: "SMS flow",
      title: "Fast replies stay under your control.",
      bubbles: ["OUI I can come", "YES, 2:30 works", "1"],
      notes: ["Ranked by received time", "No automatic confirmation", "STOP / ARRET / CANCEL respected"]
    },
    preview: {
      title: "Merchant dashboard",
      subtitle: "Illustrative view based on the real Open Spot flow.",
      replyQueue: "Replies",
      metrics: [
        ["Openings", "12"],
        ["Replies", "38"],
        ["To validate", "5"],
        ["Estimated revenue", "$1,240"]
      ],
      queue: [
        ["Maya L.", "OUI", "2:03 PM"],
        ["Sarah P.", "YES", "2:05 PM"],
        ["Lina R.", "1", "2:07 PM"]
      ]
    },
    pricing: {
      kicker: "Pricing",
      title: "Pricing adapted to your business.",
      text:
        "No fake public fixed price and no guaranteed revenue promise. The right model depends on cancellation volume, services, SMS usage, and how your business confirms appointments.",
      cta: "Discuss pricing"
    },
    useCases: {
      kicker: "Use cases",
      title: "Built for businesses where an empty hour matters.",
      items: ["Same-day haircut cancellation", "Beauty service opening", "Barber chair available", "Waitlist follow-up"]
    },
    faq: {
      kicker: "Questions",
      title: "Clear before you use it with customers.",
      items: [
        ["Is the first customer who replies confirmed?", "No. Replies are ranked, but the merchant validates manually."],
        ["Do customers need to install an app?", "No. They reply by SMS."],
        ["Does Open Spot replace my calendar?", "No. It works beside your current system."],
        ["Can I send to my full list?", "The interface should reinforce sending only to eligible opted-in customers."]
      ]
    },
    final: {
      title: "Ready to recover more spots without losing control?",
      text:
        "Book a call. We will look at your business, services, cancellations, and the best way to connect Open Spot cleanly.",
      primary: "Book a call",
      secondary: "See pricing"
    },
    footer: {
      line: "SMS-first cancellation recovery for appointment-based local businesses.",
      privacy: "Privacy",
      terms: "Terms"
    }
  }
} as const;

type MarketingCopy = (typeof marketingCopy)[Locale];

export async function OpenSpotFunnel() {
  const locale = await getRequestLocale();
  const t = marketingCopy[locale];

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-[var(--foreground)]">
      <MarketingNavbar locale={locale} t={t} />
      <main>
        <HeroSection t={t} />
        <CategoryStrip t={t} />
        <ProblemSection t={t} />
        <FeatureSection t={t} />
        <WorkflowSection t={t} />
        <WaitlistSection t={t} />
        <SmsFlowSection t={t} />
        <DashboardPreviewSection t={t} />
        <PricingSection t={t} />
        <UseCaseSection t={t} />
        <FaqSection t={t} />
        <FinalCtaSection t={t} />
      </main>
      <MarketingFooter t={t} />
    </div>
  );
}

function MarketingNavbar({ locale, t }: { locale: Locale; t: MarketingCopy }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f7f9fd]/82 backdrop-blur-xl">
      <div className="os-container-wide flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
        <Link className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]" href="/">
          <Image
            alt="Open Spot"
            className="h-10 w-auto"
            height={72}
            priority
            src="/brand/open-spot-logo-horizontal.svg"
            width={312}
          />
        </Link>
        <nav
          aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}
          className="order-3 flex w-full gap-1 overflow-x-auto md:order-2 md:w-auto md:overflow-visible"
        >
          <HeaderLink href="#comment-ca-marche">{t.nav.how}</HeaderLink>
          <HeaderLink href="#produit">{t.nav.features}</HeaderLink>
          <HeaderLink href="#prix">{t.nav.pricing}</HeaderLink>
        </nav>
        <div className="order-2 flex shrink-0 items-center gap-2 md:order-3">
          <LanguageSwitcher initialLocale={locale} />
          <Link className="hidden rounded-full px-4 py-2 text-sm font-black text-[var(--muted)] transition hover:bg-white sm:inline-flex" href="/sign-in">
            {t.nav.login}
          </Link>
          <Link className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(79,125,243,0.22)] transition hover:bg-[var(--primary-strong)]" href="/signup">
            {t.nav.signup}
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="shrink-0 rounded-full px-4 py-2 text-sm font-black text-[var(--muted)] transition hover:bg-white hover:text-[var(--foreground)]" href={href}>
      {children}
    </Link>
  );
}

function HeroSection({ t }: { t: MarketingCopy }) {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
      <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_20%_12%,rgba(79,125,243,0.22),transparent_28rem),radial-gradient(circle_at_80%_10%,rgba(24,169,153,0.12),transparent_24rem)]" />
      <div className="os-container-wide grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <p className="os-kicker">{t.hero.eyebrow}</p>
          <h1 className="os-page-title mt-5 max-w-4xl">{t.hero.title}</h1>
          <p className="os-body-large mt-6 max-w-2xl">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="os-primary-cta" href="/book-call/ready">
              {t.hero.primary}
            </Link>
            <Link className="os-secondary-cta" href="#comment-ca-marche">
              {t.hero.secondary}
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {t.hero.proof.map((item) => (
              <span className="os-chip" key={item}>{item}</span>
            ))}
          </div>
          <p className="mt-6 rounded-3xl border border-blue-200 bg-white/82 px-5 py-4 text-sm font-black leading-6 text-[var(--primary-strong)] shadow-sm">
            {t.hero.manualRule}
          </p>
        </div>
        <DashboardMockup t={t} />
      </div>
    </section>
  );
}

function DashboardMockup({ t }: { t: MarketingCopy }) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(circle,rgba(79,125,243,0.22),transparent_62%)] blur-2xl" />
      <div className="rounded-[2.4rem] border border-white/80 bg-white/88 p-4 shadow-[var(--premium-shadow)] sm:p-5">
        <div className="rounded-[2rem] bg-[var(--dark)] p-4 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">{t.preview.title}</p>
              <p className="mt-1 text-xs text-[var(--dark-muted)]">{t.preview.subtitle}</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">Live SMS</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {t.preview.metrics.map(([label, value]) => (
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-3" key={label}>
                <p className="text-[0.68rem] font-bold text-[var(--dark-muted)]">{label}</p>
                <p className="mt-2 text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.78fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black">{t.preview.replyQueue}</p>
                <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-100">manual</span>
              </div>
              <div className="mt-4 space-y-3">
                {t.preview.queue.map(([name, reply, time]) => (
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl bg-white/[0.08] px-3 py-3" key={`${name}-${time}`}>
                    <span className="text-sm font-bold">{name}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[var(--primary-strong)]">{reply}</span>
                    <span className="text-xs text-[var(--dark-muted)]">{time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-sm font-black">{t.sms.kicker}</p>
              <div className="mt-4 space-y-3">
                {t.sms.notes.map((note) => (
                  <div className="rounded-2xl bg-white/[0.08] px-3 py-3 text-xs font-bold text-blue-50" key={note}>{note}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryStrip({ t }: { t: MarketingCopy }) {
  return (
    <section className="os-container-wide pb-16">
      <div className="grid gap-3 rounded-[2rem] border border-[var(--line)] bg-white/78 p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        {t.categories.map((category) => (
          <div className="rounded-3xl bg-slate-50 px-4 py-4 text-center text-sm font-black text-slate-700" key={category}>{category}</div>
        ))}
      </div>
    </section>
  );
}

function ProblemSection({ t }: { t: MarketingCopy }) {
  return (
    <Section id="pourquoi-open-spot">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="os-kicker">{t.problem.kicker}</p>
          <h2 className="os-section-title mt-4">{t.problem.title}</h2>
          <p className="os-body-large mt-5">{t.problem.text}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ListCard title="Before" tone="warning" items={t.problem.before} />
          <ListCard title="After" tone="success" items={t.problem.after} />
        </div>
      </div>
    </Section>
  );
}

function FeatureSection({ t }: { t: MarketingCopy }) {
  return (
    <Section id="produit">
      <SectionIntro kicker={t.features.kicker} title={t.features.title} />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map(([title, text], index) => (
          <article className="os-card p-6" key={title}>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--primary-soft)] text-sm font-black text-[var(--primary-strong)]">{index + 1}</span>
            <h3 className="mt-5 text-xl font-black">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function WorkflowSection({ t }: { t: MarketingCopy }) {
  return (
    <Section id="comment-ca-marche">
      <SectionIntro kicker={t.workflow.kicker} title={t.workflow.title} />
      <div className="os-workflow-grid mt-10 grid gap-4 md:grid-cols-4">
        {t.workflow.steps.map(([title, text], index) => (
          <article className="os-step-card" key={title}>
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function WaitlistSection({ t }: { t: MarketingCopy }) {
  return (
    <Section>
      <div className="grid gap-8 rounded-[2.2rem] border border-[var(--line)] bg-white p-5 shadow-[var(--card-shadow)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="os-kicker">{t.waitlist.kicker}</p>
          <h2 className="os-section-title mt-4">{t.waitlist.title}</h2>
          <p className="os-body-large mt-5">{t.waitlist.text}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {t.waitlist.actions.map((action) => (
              <span className="os-chip" key={action}>{action}</span>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-[var(--dark)] p-5 text-white">
          <div className="mx-auto grid aspect-square max-w-xs place-items-center rounded-[2rem] bg-white p-6">
            <div className="grid h-full w-full grid-cols-5 gap-2">
              {Array.from({ length: 25 }).map((_, index) => (
                <span className={cn("rounded-md", index % 3 === 0 || index % 7 === 0 ? "bg-[var(--primary)]" : "bg-slate-200")} key={index} />
              ))}
            </div>
          </div>
          <p className="mt-5 text-center text-sm font-bold text-[var(--dark-muted)]">open-spot.ca/b/salon/waitlist</p>
        </div>
      </div>
    </Section>
  );
}

function SmsFlowSection({ t }: { t: MarketingCopy }) {
  return (
    <Section>
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="os-kicker">{t.sms.kicker}</p>
          <h2 className="os-section-title mt-4">{t.sms.title}</h2>
          <div className="mt-8 space-y-3">
            {t.sms.bubbles.map((bubble, index) => (
              <div className={cn("max-w-md rounded-3xl px-5 py-4 text-sm font-black shadow-sm", index === 1 ? "ml-auto bg-[var(--primary)] text-white" : "bg-white text-[var(--foreground)]")} key={bubble}>
                {bubble}
              </div>
            ))}
          </div>
        </div>
        <ListCard title={t.sms.kicker} tone="info" items={t.sms.notes} />
      </div>
    </Section>
  );
}

function DashboardPreviewSection({ t }: { t: MarketingCopy }) {
  return (
    <Section>
      <DashboardMockup t={t} />
    </Section>
  );
}

function PricingSection({ t }: { t: MarketingCopy }) {
  return (
    <Section id="prix">
      <div className="mx-auto max-w-4xl rounded-[2.4rem] border border-[var(--line)] bg-white p-6 text-center shadow-[var(--premium-shadow)] sm:p-10">
        <p className="os-kicker">{t.pricing.kicker}</p>
        <h2 className="os-section-title mx-auto mt-4 max-w-2xl">{t.pricing.title}</h2>
        <p className="os-body-large mx-auto mt-5 max-w-2xl">{t.pricing.text}</p>
        <Link className="os-primary-cta mt-8" href="/book-call/questions">{t.pricing.cta}</Link>
      </div>
    </Section>
  );
}

function UseCaseSection({ t }: { t: MarketingCopy }) {
  return (
    <Section>
      <SectionIntro kicker={t.useCases.kicker} title={t.useCases.title} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.useCases.items.map((item) => (
          <div className="os-soft-card" key={item}>
            <span className="text-sm font-black text-[var(--foreground)]">{item}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FaqSection({ t }: { t: MarketingCopy }) {
  return (
    <Section>
      <SectionIntro kicker={t.faq.kicker} title={t.faq.title} />
      <div className="mx-auto mt-10 grid max-w-4xl gap-4">
        {t.faq.items.map(([question, answer]) => (
          <article className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm" key={question}>
            <h3 className="text-lg font-black">{question}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{answer}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function FinalCtaSection({ t }: { t: MarketingCopy }) {
  return (
    <Section className="pb-16">
      <div className="os-premium-bg rounded-[2.4rem] px-5 py-12 text-center shadow-[0_28px_90px_rgba(8,11,18,0.22)] sm:px-8 lg:py-16">
        <h2 className="mx-auto max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{t.final.title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--dark-muted)]">{t.final.text}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="os-light-cta" href="/book-call/ready">{t.final.primary}</Link>
          <Link className="os-dark-secondary-cta" href="/pricing">{t.final.secondary}</Link>
        </div>
      </div>
    </Section>
  );
}

function MarketingFooter({ t }: { t: MarketingCopy }) {
  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="os-container-wide flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Image
            alt="Open Spot"
            className="h-9 w-auto"
            height={72}
            src="/brand/open-spot-logo-horizontal.svg"
            width={312}
          />
          <p className="mt-3 text-sm text-[var(--muted)]">{t.footer.line}</p>
        </div>
        <div className="flex gap-4 text-sm font-black text-[var(--muted)]">
          <Link href="/privacy">{t.footer.privacy}</Link>
          <Link href="/terms">{t.footer.terms}</Link>
        </div>
      </div>
    </footer>
  );
}

function Section({
  children,
  className,
  id
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("os-container-wide py-14 sm:py-20 lg:py-24", className)} id={id}>
      {children}
    </section>
  );
}

function SectionIntro({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="os-section-heading">
      <p className="os-kicker">{kicker}</p>
      <h2 className="mt-4">{title}</h2>
    </div>
  );
}

function ListCard({
  items,
  title,
  tone
}: {
  items: readonly string[];
  title: string;
  tone: "info" | "success" | "warning";
}) {
  const toneClass = {
    info: "bg-blue-50 text-blue-800",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-800"
  }[tone];

  return (
    <article className="rounded-[1.7rem] border border-[var(--line)] bg-white p-5 shadow-sm">
      <span className={cn("rounded-full px-3 py-1 text-xs font-black uppercase", toneClass)}>
        {title}
      </span>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700" key={item}>
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}
