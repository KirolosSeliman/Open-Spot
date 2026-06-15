"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

const copy = {
  fr: {
    nav: {
      features: "Fonctions",
      tools: "Outils",
      how: "Comment ça marche",
      pricing: "Tarifs",
      resources: "Guides",
      login: "Connexion",
      primary: "Créer un compte"
    },
    hero: {
      eyebrow: "SMS de récupération pour commerces à rendez-vous",
      title: "Remplissez vos annulations de dernière minute par SMS.",
      subtitle:
        "Open Spot contacte vos clients consentants, classe les réponses et vous laisse choisir qui confirmer — sans changer votre système de rendez-vous.",
      primary: "Créer un compte",
      secondary: "Voir comment ça marche",
      microcopy:
        "Aucune app client. Aucun changement à votre calendrier. Validation toujours manuelle."
    },
    mockup: {
      cancellation: "Annulation aujourd’hui",
      appointment: "14 h 30 · Coupe homme",
      eligible: "24 clients admissibles",
      replies: "3 réponses reçues",
      manual: "Validation manuelle requise",
      rows: [
        ["Maya L.", "OUI", "14:03"],
        ["Sarah P.", "YES", "14:05"],
        ["Lina R.", "1", "14:07"]
      ],
      revenue: "Revenu récupéré estimé : 85 $",
      stop: "STOP respecté"
    },
    categories: {
      headline: "Pour les commerces qui vivent de leur horaire.",
      chips: [
        "Salons",
        "Barbiers",
        "Esthétique",
        "Massothérapie",
        "Soins",
        "Cliniques",
        "Services à rendez-vous",
        "Studios beauté"
      ]
    },
    features: {
      title: "Tout ce qu’il faut pour récupérer une plage perdue.",
      cards: [
        ["SMS aux clients consentants", "Envoyez une ouverture seulement aux clients qui ont accepté de recevoir vos messages."],
        ["Réponses centralisées", "Les réponses OUI, YES ou 1 apparaissent dans votre tableau de bord, classées par heure de réception."],
        ["Validation manuelle", "Vous choisissez le client à confirmer. Open Spot ne confirme jamais automatiquement."],
        ["QR liste d’attente", "Placez un QR code dans votre commerce pour recueillir les inscriptions et le consentement SMS."],
        ["Import contrôlé", "Importez vos clients existants sans les considérer comme consentants par défaut."],
        ["Revenu récupéré", "Suivez les rendez-vous sauvés et l’argent récupéré grâce aux ouvertures remplies."]
      ]
    },
    tools: {
      title: "Gardez vos outils actuels.",
      text:
        "Open Spot ne remplace pas votre calendrier, votre caisse ou votre logiciel de réservation. Il ajoute une couche SMS simple pour récupérer les ouvertures de dernière minute.",
      cards: [
        "Votre calendrier actuel",
        "Votre système de réservation",
        "Votre téléphone",
        "Votre liste de clients",
        "SMS",
        "Tableau de bord Open Spot",
        "QR code",
        "Consentement"
      ]
    },
    how: {
      title: "De l’annulation à la confirmation, en trois étapes.",
      steps: [
        ["01", "Un client s’inscrit", "Il rejoint votre liste d’attente via QR code ou import contrôlé avec consentement."],
        ["02", "Vous créez une ouverture", "Lorsqu’une annulation arrive, vous préparez le SMS et l’envoyez aux clients admissibles."],
        ["03", "Vous validez manuellement", "Les réponses arrivent dans le dashboard. Vous choisissez qui confirmer."]
      ]
    },
    pricing: {
      title: "Des forfaits simples avant de parler facturation.",
      cards: [
        [
          "Pilote",
          "Pour tester Open Spot avec un commerce à rendez-vous.",
          ["Liste d’attente SMS", "QR code", "Création d’ouvertures", "Réponses visibles", "Validation manuelle"],
          "Démarrer un pilote"
        ],
        [
          "Croissance",
          "Pour les commerces qui veulent récupérer plus d’annulations chaque mois.",
          [
            "Tout dans Pilote",
            "Import clients",
            "Reporting revenu récupéré",
            "Support configuration",
            "Workflows SMS avancés selon disponibilité réelle"
          ],
          "Parler à l’équipe"
        ],
        [
          "Sur mesure",
          "Pour réseaux, équipes multi-emplacements ou besoins SMS spécifiques.",
          ["Plusieurs emplacements si supportés", "Support opérationnel", "Paramètres SMS adaptés", "Analyse de volume"],
          "Nous contacter"
        ]
      ]
    },
    useCases: {
      title: "Conçu pour les annulations qui arrivent au mauvais moment.",
      cards: [
        ["Salon", "Une coloration est annulée le matin même. Open Spot aide à proposer la plage aux clients admissibles."],
        ["Barbier", "Un créneau de coupe se libère dans l’après-midi. Les réponses arrivent par SMS et le barbier choisit qui confirmer."],
        ["Esthétique", "Une cliente annule un soin à la dernière minute. La liste d’attente peut être contactée rapidement."],
        ["Soins", "Une plage devient disponible et peut être offerte aux clients intéressés sans appeler tout le monde un par un."]
      ]
    },
    faq: {
      title: "Questions avant d’envoyer vos premiers SMS.",
      text: "Open Spot garde le contrôle du côté marchand et respecte le consentement SMS.",
      items: [
        ["Est-ce qu’Open Spot remplace mon système de réservation ?", "Non. Vous gardez votre calendrier, votre système de caisse ou votre outil de réservation actuel. Open Spot sert à récupérer les annulations et gérer les réponses SMS."],
        ["Le premier client qui répond est-il confirmé automatiquement ?", "Non. Les réponses sont classées par heure de réception, mais vous gardez toujours le contrôle final."],
        ["Puis-je envoyer des SMS à tous mes clients importés ?", "Non. Les clients doivent avoir un consentement SMS valide avant de recevoir des messages."],
        ["Que se passe-t-il si un client répond STOP ?", "Il est désinscrit et doit être exclu des prochains envois SMS."],
        ["Mes clients doivent-ils télécharger une application ?", "Non. Les clients interagissent par SMS."],
        ["Est-ce que je dois changer mon calendrier actuel ?", "Non. Open Spot s’ajoute à votre workflow actuel."]
      ]
    },
    resources: {
      title: "Guides pour récupérer plus de rendez-vous.",
      cards: [
        ["Comment réduire les annulations perdues", "Des pratiques simples pour réagir vite lorsqu’une plage se libère."],
        ["Bien gérer le consentement SMS", "Pourquoi les clients doivent accepter clairement vos messages."],
        ["Construire une liste d’attente utile", "Comment transformer votre QR code en source de rendez-vous récupérés."]
      ]
    },
    final: {
      title: "Récupérez votre prochaine annulation avant qu’elle devienne une perte.",
      text:
        "Créez une ouverture, contactez les clients admissibles et gardez le contrôle sur la confirmation.",
      primary: "Créer un compte",
      secondary: "Voir le fonctionnement"
    },
    footer: {
      line: "Récupération d’annulations par SMS pour commerces à rendez-vous.",
      product: "Produit",
      account: "Compte",
      legal: "Légal",
      privacy: "Confidentialité",
      terms: "Conditions"
    }
  },
  en: {
    nav: {
      features: "Features",
      tools: "Tools",
      how: "How it works",
      pricing: "Pricing",
      resources: "Guides",
      login: "Sign in",
      primary: "Create account"
    },
    hero: {
      eyebrow: "SMS recovery for appointment-based businesses",
      title: "Fill last-minute cancellations by SMS.",
      subtitle:
        "Open Spot contacts opted-in customers, ranks replies, and lets you choose who to confirm — without replacing your appointment system.",
      primary: "Create account",
      secondary: "See how it works",
      microcopy: "No customer app. No calendar migration. Always manual validation."
    },
    mockup: {
      cancellation: "Cancellation today",
      appointment: "2:30 PM · Men’s haircut",
      eligible: "24 eligible customers",
      replies: "3 replies received",
      manual: "Manual validation required",
      rows: [
        ["Maya L.", "OUI", "2:03 PM"],
        ["Sarah P.", "YES", "2:05 PM"],
        ["Lina R.", "1", "2:07 PM"]
      ],
      revenue: "Estimated recovered revenue: $85",
      stop: "STOP respected"
    },
    categories: {
      headline: "For businesses that depend on a full schedule.",
      chips: [
        "Salons",
        "Barbers",
        "Beauty",
        "Massage therapy",
        "Care services",
        "Clinics",
        "Appointment-based teams",
        "Beauty studios"
      ]
    },
    features: {
      title: "Everything you need to recover a lost time slot.",
      cards: [
        ["SMS to opted-in customers", "Send openings only to customers who agreed to receive your messages."],
        ["Centralized replies", "YES, OUI, or 1 replies appear in your dashboard, ranked by received time."],
        ["Manual validation", "You choose who to confirm. Open Spot never confirms automatically."],
        ["QR waitlist", "Place a QR code in your business to collect waitlist signups and SMS consent."],
        ["Controlled import", "Import existing customers without treating them as opted in by default."],
        ["Recovered revenue", "Track saved appointments and revenue recovered through filled openings."]
      ]
    },
    tools: {
      title: "Keep your current tools.",
      text:
        "Open Spot does not replace your calendar, POS, or booking software. It adds a simple SMS layer to recover last-minute openings.",
      cards: [
        "Your current calendar",
        "Your booking system",
        "Your phone",
        "Your customer list",
        "SMS",
        "Open Spot dashboard",
        "QR code",
        "Consent"
      ]
    },
    how: {
      title: "From cancellation to confirmation in three steps.",
      steps: [
        ["01", "A customer joins", "They join your waitlist through a QR code or controlled import with consent."],
        ["02", "You create an opening", "When a cancellation happens, you prepare the SMS and send it to eligible customers."],
        ["03", "You validate manually", "Replies appear in the dashboard. You choose who to confirm."]
      ]
    },
    pricing: {
      title: "Simple plans before billing tiers.",
      cards: [
        [
          "Pilot",
          "For testing Open Spot with an appointment-based business.",
          ["SMS waitlist", "QR code", "Opening creation", "Visible replies", "Manual validation"],
          "Start a pilot"
        ],
        [
          "Growth",
          "For businesses that want to recover more cancellations every month.",
          [
            "Everything in Pilot",
            "Customer import",
            "Recovered revenue reporting",
            "Setup support",
            "Advanced SMS workflows when available"
          ],
          "Talk to the team"
        ],
        [
          "Custom",
          "For networks, multi-location teams, or specific SMS needs.",
          ["Multiple locations if supported", "Operational support", "Adapted SMS settings", "Volume analysis"],
          "Contact us"
        ]
      ]
    },
    useCases: {
      title: "Built for cancellations that happen at the worst time.",
      cards: [
        ["Salon", "A color appointment gets cancelled the same morning. Open Spot helps offer the spot to eligible customers."],
        ["Barber", "A haircut slot opens in the afternoon. Replies arrive by SMS and the barber chooses who to confirm."],
        ["Beauty", "A customer cancels a treatment at the last minute. The waitlist can be contacted quickly."],
        ["Care services", "A time slot becomes available and can be offered to interested customers without calling everyone one by one."]
      ]
    },
    faq: {
      title: "Questions before your first SMS sends.",
      text: "Open Spot keeps merchant control intact and respects SMS consent.",
      items: [
        ["Does Open Spot replace my booking system?", "No. You keep your current calendar, POS, or booking tool. Open Spot helps recover cancellations and manage SMS replies."],
        ["Is the first customer who replies automatically confirmed?", "No. Replies are ranked by received time, but you always keep final control."],
        ["Can I send SMS to all imported customers?", "No. Customers must have valid SMS consent before receiving messages."],
        ["What happens if a customer replies STOP?", "They are opted out and must be excluded from future SMS sends."],
        ["Do my customers need to download an app?", "No. Customers interact by SMS."],
        ["Do I need to change my current calendar?", "No. Open Spot adds to your current workflow."]
      ]
    },
    resources: {
      title: "Guides to recover more appointments.",
      cards: [
        ["How to reduce lost cancellations", "Simple practices to react quickly when a time slot opens."],
        ["Managing SMS consent properly", "Why customers must clearly agree to receive your messages."],
        ["Building a useful waitlist", "How to turn your QR code into a source of recovered appointments."]
      ]
    },
    final: {
      title: "Recover your next cancellation before it becomes lost revenue.",
      text: "Create an opening, contact eligible customers, and keep control over confirmation.",
      primary: "Create account",
      secondary: "See how it works"
    },
    footer: {
      line: "SMS cancellation recovery for appointment-based local businesses.",
      product: "Product",
      account: "Account",
      legal: "Legal",
      privacy: "Privacy",
      terms: "Terms"
    }
  }
} as const;

type TemplateCopy = (typeof copy)[Locale];
type PricingCard = TemplateCopy["pricing"]["cards"][number];

export function LuneraOpenSpotTemplate({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [progress, setProgress] = useState(0);
  const repeatedCategories = useMemo(
    () => [...t.categories.chips, ...t.categories.chips],
    [t.categories.chips]
  );

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-lunera-reveal]")
    );

    if (prefersReduced) {
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
      { rootMargin: "0px 0px -4% 0px", threshold: 0.01 }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [locale]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      return;
    }

    function updateProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div
      className="lunera-template min-h-screen overflow-hidden bg-[#f6fbff] text-[#0b0d12]"
      style={{ "--lunera-progress": progress } as CSSProperties}
    >
      <FloatingNavbar locale={locale} t={t} />
      <main>
        <Hero t={t} />
        <CategoryMarquee headline={t.categories.headline} items={repeatedCategories} />
        <FeatureGrid t={t} />
        <ToolsOrbit t={t} />
        <HowItWorks t={t} />
        <Pricing t={t} />
        <UseCases t={t} />
        <Faq t={t} />
        <Resources t={t} />
        <FinalCta t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}

function FloatingNavbar({ locale, t }: { locale: Locale; t: TemplateCopy }) {
  return (
    <header className="fixed inset-x-0 top-5 z-50 px-4">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 rounded-full border border-white/80 bg-white/90 px-4 py-2 shadow-[0_18px_55px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        <Link className="flex shrink-0 items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4f7df3]" href="/">
          <Image
            alt="Open Spot"
            className="h-9 w-auto"
            height={72}
            priority
            src="/brand/open-spot-logo-horizontal.svg"
            width={312}
          />
        </Link>
        <nav
          aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}
          className="hidden items-center gap-1 lg:flex"
        >
          <NavLink href="#features">{t.nav.features}</NavLink>
          <NavLink href="#tools">{t.nav.tools}</NavLink>
          <NavLink href="#how">{t.nav.how}</NavLink>
          <NavLink href="#pricing">{t.nav.pricing}</NavLink>
          <NavLink href="#resources">{t.nav.resources}</NavLink>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher initialLocale={locale} />
          <Link className="hidden rounded-full px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 md:inline-flex" href="/sign-in">
            {t.nav.login}
          </Link>
          <Link className="hidden rounded-full bg-black px-4 py-2 text-sm font-black text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-900 sm:inline-flex" href="/signup">
            {t.nav.primary}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link className="rounded-full px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" href={href}>
      {children}
    </Link>
  );
}

function Hero({ t }: { t: TemplateCopy }) {
  return (
    <section className="relative min-h-[980px] overflow-hidden px-4 pb-16 pt-32 sm:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,#cfeeff_0%,#eaf7ff_26rem,transparent_46rem),linear-gradient(180deg,#dff3ff_0%,#f8fcff_58%,#ffffff_100%)]" />
      <div className="absolute left-[-8rem] top-[30rem] -z-10 h-72 w-72 rounded-full bg-white blur-2xl" />
      <div className="absolute right-[-8rem] top-[28rem] -z-10 h-72 w-72 rounded-full bg-white blur-2xl" />
      <div className="mx-auto max-w-6xl text-center">
        <p className="lunera-eyebrow mx-auto" data-lunera-reveal>
          {t.hero.eyebrow}
        </p>
        <h1 className="mx-auto mt-7 max-w-5xl text-[clamp(3.2rem,8vw,6.7rem)] font-black leading-[0.92] tracking-[-0.02em]" data-lunera-reveal>
          {t.hero.title}
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg font-medium leading-8 text-slate-600" data-lunera-reveal>
          {t.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" data-lunera-reveal>
          <Link className="lunera-cta-primary" href="/signup">{t.hero.primary}</Link>
          <Link className="lunera-cta-secondary" href="#how">{t.hero.secondary}</Link>
        </div>
        <p className="mx-auto mt-5 max-w-2xl text-sm font-black text-slate-500" data-lunera-reveal>
          {t.hero.microcopy}
        </p>
      </div>
      <div className="mx-auto mt-14 max-w-6xl" data-lunera-reveal>
        <HeroMockup t={t} />
      </div>
    </section>
  );
}

function HeroMockup({ t }: { t: TemplateCopy }) {
  return (
    <div className="relative mx-auto min-h-[520px] max-w-5xl">
      <FloatingMetric className="-left-2 top-24 hidden md:block" label={t.mockup.eligible} value={t.mockup.cancellation} />
      <FloatingMetric className="-right-4 top-20 hidden md:block" label={t.mockup.stop} value={t.mockup.revenue} />
      <FloatingMetric className="bottom-20 left-8 hidden lg:block" label={t.mockup.replies} value={t.mockup.manual} dark />
      <div className="lunera-phone-shell mx-auto">
        <div className="mx-auto h-7 w-36 rounded-b-3xl bg-black" />
        <div className="mt-6 rounded-[2.2rem] bg-[#f7f9fd] p-4 shadow-inner">
          <div className="rounded-[1.7rem] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-[#4f7df3]">{t.mockup.cancellation}</p>
                <h2 className="mt-2 text-2xl font-black">{t.mockup.appointment}</h2>
              </div>
              <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-black text-[#3566dc]">SMS</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat label={t.mockup.eligible} value="24" />
              <MiniStat label={t.mockup.replies} value="3" />
            </div>
            <div className="mt-4 rounded-[1.2rem] border border-[#dbe7ff] bg-[#f2f7ff] p-3 text-sm font-black text-[#254caa]">
              {t.mockup.manual}
            </div>
            <div className="mt-4 space-y-3">
              {t.mockup.rows.map(([name, reply, time], index) => (
                <div className="lunera-reply-row grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3" key={name} style={{ animationDelay: `${index * 220}ms` }}>
                  <span className="text-sm font-black">{name}</span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">{reply}</span>
                  <span className="text-xs font-bold text-slate-400">{time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] bg-black px-4 py-4 text-sm font-black text-white">{t.mockup.revenue}</div>
            <div className="rounded-[1.35rem] bg-[#e8fbf5] px-4 py-4 text-sm font-black text-[#08775c]">{t.mockup.stop}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-3 py-4 shadow-sm">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold leading-4 text-slate-500">{label}</p>
    </div>
  );
}

function FloatingMetric({
  className,
  dark,
  label,
  value
}: {
  className?: string;
  dark?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("lunera-floating-card absolute z-10 max-w-[16rem] rounded-[1.4rem] p-4 shadow-[0_22px_55px_rgba(15,23,42,0.14)]", dark ? "bg-black text-white" : "bg-white/92 text-slate-950", className)}>
      <p className={cn("text-lg font-black leading-6", dark ? "text-white" : "text-slate-950")}>{value}</p>
      <p className={cn("mt-2 text-xs font-bold leading-5", dark ? "text-white/64" : "text-slate-500")}>{label}</p>
    </div>
  );
}

function CategoryMarquee({ headline, items }: { headline: string; items: readonly string[] }) {
  return (
    <section className="bg-white px-4 py-16">
      <p className="mx-auto max-w-3xl text-center text-2xl font-black tracking-[-0.01em] text-slate-950" data-lunera-reveal>
        {headline}
      </p>
      <div className="lunera-marquee mt-10" data-lunera-reveal>
        <div className="lunera-marquee-track">
          {items.map((item, index) => (
            <span className="rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-500 shadow-sm" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid({ t }: { t: TemplateCopy }) {
  return (
    <TemplateSection id="features">
      <SectionHeading title={t.features.title} />
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {t.features.cards.map(([title, text], index) => (
          <article className="lunera-card min-h-[20rem] p-7" data-lunera-reveal key={title}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] text-lg font-black text-[#4f7df3]">
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3 className="mt-8 text-2xl font-black tracking-[-0.01em]">{title}</h3>
            <p className="mt-4 text-base font-medium leading-8 text-slate-500">{text}</p>
            <div className="mt-8 h-24 rounded-[1.4rem] bg-[linear-gradient(135deg,#f7fbff,#edf4ff)] p-4">
              <div className="h-3 w-3/4 rounded-full bg-[#4f7df3]/70" />
              <div className="mt-4 h-3 w-1/2 rounded-full bg-slate-200" />
              <div className="mt-4 h-3 w-5/6 rounded-full bg-slate-200" />
            </div>
          </article>
        ))}
      </div>
    </TemplateSection>
  );
}

function ToolsOrbit({ t }: { t: TemplateCopy }) {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-24 sm:py-32" id="tools">
      <div className="mx-auto max-w-4xl text-center">
        <span className="lunera-pill" data-lunera-reveal>Tools</span>
        <h2 className="mt-7 text-[clamp(2.6rem,6vw,5rem)] font-black leading-[0.95] tracking-[-0.02em]" data-lunera-reveal>
          {t.tools.title}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-500" data-lunera-reveal>
          {t.tools.text}
        </p>
      </div>
      <div className="lunera-orbit mx-auto mt-16 max-w-5xl" data-lunera-reveal>
        {t.tools.cards.map((item, index) => (
          <div className="lunera-tool-card" key={item} style={{ "--tool-index": index } as CSSProperties}>
            <span>{item}</span>
          </div>
        ))}
        <div className="lunera-orbit-center">
          <Image alt="Open Spot" className="h-10 w-auto" height={72} src="/brand/open-spot-logo-horizontal.svg" width={312} />
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 py-20 sm:py-28" id="how">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <span className="lunera-pill" data-lunera-reveal>How it works</span>
          <h2 className="mt-8 text-[clamp(2.5rem,5vw,5rem)] font-black leading-[0.96] tracking-[-0.02em]" data-lunera-reveal>
            {t.how.title}
          </h2>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100" data-lunera-reveal>
            <div className="lunera-scroll-progress h-full rounded-full bg-[#4f7df3]" />
          </div>
        </div>
        <div className="space-y-5">
          {t.how.steps.map(([number, title, text], index) => (
            <article className="lunera-step-card" data-lunera-reveal key={number}>
              <div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-sm font-black text-[#4f7df3]">{number}</span>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-[-0.01em]">{title}</h3>
                <p className="mt-3 text-base font-medium leading-8 text-slate-500">{text}</p>
                <StepVisual index={index} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepVisual({ index }: { index: number }) {
  return (
    <div className="mt-8 rounded-[1.6rem] bg-[#f8fbff] p-5">
      <div className="flex items-end gap-3">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            className="lunera-bar block w-full rounded-t-2xl bg-[#4f7df3]"
            key={bar}
            style={{ height: `${42 + ((bar + index) % 4) * 24}px`, opacity: 0.38 + bar * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}

function Pricing({ t }: { t: TemplateCopy }) {
  return (
    <TemplateSection id="pricing">
      <SectionHeading title={t.pricing.title} />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {t.pricing.cards.map((card, index) => (
          <PricingCard card={card} featured={index === 1} key={card[0]} />
        ))}
      </div>
    </TemplateSection>
  );
}

function PricingCard({ card, featured }: { card: PricingCard; featured?: boolean }) {
  const [title, text, features, cta] = card;

  return (
    <article className={cn("lunera-card flex min-h-[33rem] flex-col p-7", featured && "border-[#4f7df3] shadow-[0_28px_80px_rgba(79,125,243,0.2)]")} data-lunera-reveal>
      {featured ? <span className="mb-5 w-fit rounded-full bg-[#4f7df3] px-3 py-1 text-xs font-black text-white">Best fit</span> : null}
      <h3 className="text-3xl font-black">{title}</h3>
      <p className="mt-4 min-h-20 text-base font-medium leading-8 text-slate-500">{text}</p>
      <div className="mt-6 border-t border-slate-100 pt-6">
        <p className="text-4xl font-black">{featured ? "Open Spot" : "Flexible"}</p>
        <p className="mt-2 text-sm font-bold text-slate-400">No fixed public price</p>
      </div>
      <Link className={cn("mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-black transition hover:-translate-y-0.5", featured ? "bg-[#4f7df3] text-white" : "bg-black text-white")} href="/book-call/questions">
        {cta}
      </Link>
      <ul className="mt-7 space-y-4">
        {features.map((feature) => (
          <li className="flex gap-3 text-sm font-bold leading-6 text-slate-600" key={feature}>
            <span className="mt-0.5 text-[#4f7df3]">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function UseCases({ t }: { t: TemplateCopy }) {
  const repeated = [...t.useCases.cards, ...t.useCases.cards];

  return (
    <section className="overflow-hidden bg-white px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <span className="lunera-pill" data-lunera-reveal>Use cases</span>
          <h2 className="mt-7 text-[clamp(2.3rem,5vw,4.6rem)] font-black leading-[0.98] tracking-[-0.02em]" data-lunera-reveal>
            {t.useCases.title}
          </h2>
        </div>
      </div>
      <div className="lunera-marquee mt-12" data-lunera-reveal>
        <div className="lunera-marquee-track lunera-marquee-slow">
          {repeated.map(([title, text], index) => (
            <article className="w-[21rem] shrink-0 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_22px_55px_rgba(15,23,42,0.08)]" key={`${title}-${index}`}>
              <h3 className="text-2xl font-black">{title}</h3>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ t }: { t: TemplateCopy }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-white px-4 py-20 sm:py-28" id="faq">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <span className="lunera-pill" data-lunera-reveal>FAQ</span>
          <h2 className="mt-7 text-[clamp(2.3rem,5vw,4.6rem)] font-black leading-[0.98] tracking-[-0.02em]" data-lunera-reveal>
            {t.faq.title}
          </h2>
          <p className="mt-6 max-w-md text-lg font-medium leading-8 text-slate-500" data-lunera-reveal>{t.faq.text}</p>
        </div>
        <div className="rounded-[2rem] bg-[#f8fafc] p-3" data-lunera-reveal>
          {t.faq.items.map(([question, answer], index) => {
            const isOpen = index === openIndex;

            return (
              <div className="border-b border-white last:border-b-0" key={question}>
                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-5 rounded-[1.4rem] bg-white px-5 py-5 text-left text-base font-black text-slate-950 transition hover:bg-[#f7fbff]"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  type="button"
                >
                  <span>{question}</span>
                  <span className={cn("text-2xl font-light transition", isOpen && "rotate-45")}>+</span>
                </button>
                <div className={cn("lunera-faq-answer", isOpen && "is-open")}>
                  <p className="px-5 pb-6 pt-1 text-sm font-medium leading-7 text-slate-500">{answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Resources({ t }: { t: TemplateCopy }) {
  return (
    <TemplateSection id="resources">
      <SectionHeading title={t.resources.title} />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {t.resources.cards.map(([title, text]) => (
          <article className="lunera-card min-h-[18rem] p-7" data-lunera-reveal key={title}>
            <div className="h-28 rounded-[1.4rem] bg-[linear-gradient(135deg,#dff3ff,#ffffff)]" />
            <h3 className="mt-7 text-2xl font-black tracking-[-0.01em]">{title}</h3>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-500">{text}</p>
          </article>
        ))}
      </div>
    </TemplateSection>
  );
}

function FinalCta({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 pb-20 pt-6">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-black px-6 py-16 text-center text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:px-10 sm:py-20" data-lunera-reveal>
        <h2 className="mx-auto max-w-5xl text-[clamp(2.4rem,6vw,5.8rem)] font-black leading-[0.95] tracking-[-0.02em]">{t.final.title}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-white/64">{t.final.text}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="lunera-cta-light" href="/signup">{t.final.primary}</Link>
          <Link className="lunera-cta-dark" href="#how">{t.final.secondary}</Link>
        </div>
      </div>
    </section>
  );
}

function Footer({ t }: { t: TemplateCopy }) {
  return (
    <footer className="border-t border-slate-100 bg-white px-4 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Image alt="Open Spot" className="h-10 w-auto" height={72} src="/brand/open-spot-logo-horizontal.svg" width={312} />
          <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-slate-500">{t.footer.line}</p>
        </div>
        <FooterColumn title={t.footer.product} links={[["Features", "#features"], ["Tools", "#tools"], ["Pricing", "#pricing"], ["FAQ", "#faq"]]} />
        <FooterColumn title={t.footer.account} links={[[t.nav.login, "/sign-in"], [t.nav.primary, "/signup"], [t.nav.resources, "#resources"]]} />
        <FooterColumn title={t.footer.legal} links={[[t.footer.privacy, "/privacy"], [t.footer.terms, "/terms"]]} />
      </div>
    </footer>
  );
}

function FooterColumn({ links, title }: { links: Array<[string, string]>; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link className="text-sm font-bold text-slate-500 transition hover:text-slate-950" href={href} key={`${label}-${href}`}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TemplateSection({
  children,
  id
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="bg-white px-4 py-20 sm:py-28" id={id}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <span className="lunera-pill" data-lunera-reveal>Open Spot</span>
      <h2 className="mt-7 text-[clamp(2.4rem,6vw,5.4rem)] font-black leading-[0.95] tracking-[-0.02em]" data-lunera-reveal>
        {title}
      </h2>
    </div>
  );
}
