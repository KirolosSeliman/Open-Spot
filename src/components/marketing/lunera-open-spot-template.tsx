"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SmsConversationPhone } from "@/components/marketing/sms-conversation-phone";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

const copy = {
  fr: {
    nav: {
      features: "Fonctions",
      tools: "Outils",
      how: "Comment ca marche",
      pricing: "Tarifs",
      resources: "Guides",
      login: "Connexion",
      primary: "Creer un compte"
    },
    hero: {
      eyebrow: "Built for appointment-based businesses",
      title: "Transformez les annulations en rendez-vous remplis.",
      subtitle:
        "Open Spot aide les salons, barbiers, cliniques et commerces locaux a texter leur liste d'attente, recevoir les reponses et confirmer manuellement le meilleur client avant que le creneau soit perdu.",
      primary: "Creer un compte",
      secondary: "Voir comment ca marche",
      badges: [
        "No marketplace. No complex booking flow.",
        "Manual confirmation by your team"
      ],
      proof: "Built for salons, barbers, clinics and local appointment-based businesses."
    },
    logos: [
      "Salons",
      "Barbers",
      "Clinics",
      "Spas",
      "Beauty studios",
      "Care teams"
    ],
    features: {
      tag: "Features",
      title: "Everything you need to recover empty appointment slots.",
      cards: [
        [
          "Send SMS alerts in seconds",
          "Create an opening, choose the eligible list, and notify clients before the slot goes cold.",
          "Waitlist notified"
        ],
        [
          "Collect YES replies",
          "Clients answer OUI, YES, or 1 by SMS. Replies stay grouped in your dashboard.",
          "2 clients replied"
        ],
        [
          "Choose who to confirm",
          "Replies are visible and ranked, but your team always makes the final confirmation.",
          "Manual confirmation"
        ],
        [
          "Keep the waitlist organized",
          "Separate consent, services, and response history so every opening is easier to fill.",
          "Consent checked"
        ],
        [
          "Track recovered value",
          "Show the impact of filled cancellations without adding payment or finance workflows.",
          "$85 recovered"
        ]
      ]
    },
    tools: {
      tag: "Integrations",
      title: "Works beside the tools you already use.",
      text:
        "Open Spot does not replace your calendar, POS, or booking software. It adds the fast SMS recovery layer for last-minute openings.",
      cards: [
        "Calendar",
        "Booking app",
        "Client list",
        "SMS",
        "Waitlist",
        "QR code",
        "Consent",
        "Replies",
        "Dashboard",
        "Team review",
        "Open spot",
        "Follow-up",
        "Services",
        "Opt-out",
        "Reports",
        "Manual pick"
      ]
    },
    how: {
      tag: "How it works",
      title: "From cancellation to confirmed client in minutes.",
      steps: [
        [
          "01",
          "Client cancels.",
          "A same-day slot opens and your team creates an Open Spot alert."
        ],
        [
          "02",
          "You send one SMS.",
          "Eligible clients receive a clear message and reply by SMS if they want the spot."
        ],
        [
          "03",
          "Clients reply YES.",
          "Replies are collected in one queue with the appointment time and service context."
        ],
        [
          "04",
          "You manually confirm.",
          "Open Spot never confirms automatically. Your team chooses the best fit."
        ]
      ]
    },
    pricing: {
      tag: "Pricing",
      title: "Simple plans, clear value.",
      cards: [
        [
          "Starter",
          "For one location testing SMS recovery.",
          ["SMS waitlist", "Opening alerts", "Reply queue", "Manual confirmation", "Basic recovery view"],
          "Start a pilot"
        ],
        [
          "Growth",
          "For teams recovering multiple cancellations each week.",
          ["Everything in Starter", "Customer import controls", "Consent-aware targeting", "Recovered value reporting", "Setup support"],
          "Talk to the team"
        ],
        [
          "Scale",
          "For multi-location operators or custom workflows.",
          ["Location controls", "Team workflows", "Operational review", "Volume planning", "Priority support"],
          "Contact us"
        ]
      ]
    },
    results: {
      title: "Real recovery workflows for real appointment teams.",
      text:
        "Open Spot is built around the moment a local business would otherwise start calling clients one by one.",
      cards: [
        ["Salon", "A color appointment cancels in the morning. The waitlist receives one SMS and the team picks who to confirm."],
        ["Barber", "A 4:30 PM haircut opens. Replies arrive by SMS while the barber keeps serving clients."],
        ["Clinic", "A treatment slot becomes available. Eligible clients reply and staff manually confirms the right fit."],
        ["Spa", "A same-day opening is recovered without moving clients into a marketplace or new booking flow."]
      ],
      stats: [
        ["85", "Dollars recovered on one haircut slot"],
        ["2 min", "To send a focused SMS alert"],
        ["100%", "Manual final confirmation"]
      ]
    },
    faq: {
      tag: "FAQ",
      title: "Questions before your first SMS sends.",
      text: "Open Spot keeps merchant control intact and respects SMS consent.",
      items: [
        ["Does Open Spot replace my booking system?", "No. Your calendar, POS, and booking tools stay in place. Open Spot handles the SMS recovery workflow."],
        ["Is the first customer who replies automatically confirmed?", "No. Replies are ranked by received time, but the business always chooses who to confirm."],
        ["Can I message every imported client?", "No. Clients need valid SMS consent before they receive opening alerts."],
        ["What happens if someone replies STOP?", "They are opted out and must be excluded from future sends."],
        ["Do clients need an app?", "No. Clients receive and answer a normal SMS."],
        ["Is there payment automation?", "No. Open Spot is focused on filling the opening and keeping confirmation manual."]
      ]
    },
    resources: {
      tag: "Blog",
      title: "Guides to recover more appointments.",
      cards: [
        ["How to reduce lost cancellations", "A practical workflow for reacting fast when a slot opens."],
        ["Managing SMS consent properly", "Why clean consent keeps your waitlist useful and compliant."],
        ["Building a useful waitlist", "How QR signups and service interests improve recovery messages."]
      ]
    },
    final: {
      title: "Stop losing revenue to last-minute cancellations.",
      text:
        "Open Spot gives your team a simple SMS workflow to recover open slots before they disappear.",
      primary: "Start with Open Spot",
      secondary: "See how it works"
    },
    footer: {
      line: "Fill last-minute cancellations with one simple SMS.",
      product: "Platform",
      account: "Account",
      legal: "Legal",
      privacy: "Privacy",
      terms: "Terms"
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
      primary: "Get early access"
    },
    hero: {
      eyebrow: "Built for appointment-based businesses",
      title: "Turn last-minute cancellations into booked appointments.",
      subtitle:
        "Open Spot helps salons, barbers, clinics and local appointment-based businesses text their waitlist, collect replies, and manually confirm the best client before the spot is lost.",
      primary: "Get early access",
      secondary: "See how it works",
      badges: [
        "No marketplace. No complex booking flow.",
        "Manual confirmation by your team"
      ],
      proof: "Built for salons, barbers, clinics and local appointment-based businesses."
    },
    logos: [
      "Salons",
      "Barbers",
      "Clinics",
      "Spas",
      "Beauty studios",
      "Care teams"
    ],
    features: {
      tag: "Features",
      title: "Everything you need to recover empty appointment slots.",
      cards: [
        [
          "Send SMS alerts in seconds",
          "Create an opening, choose the eligible list, and notify clients before the slot goes cold.",
          "Waitlist notified"
        ],
        [
          "Collect YES replies",
          "Clients answer OUI, YES, or 1 by SMS. Replies stay grouped in your dashboard.",
          "2 clients replied"
        ],
        [
          "Choose who to confirm",
          "Replies are visible and ranked, but your team always makes the final confirmation.",
          "Manual confirmation"
        ],
        [
          "Keep the waitlist organized",
          "Separate consent, services, and response history so every opening is easier to fill.",
          "Consent checked"
        ],
        [
          "Track recovered value",
          "Show the impact of filled cancellations without adding payment or finance workflows.",
          "$85 recovered"
        ]
      ]
    },
    tools: {
      tag: "Integrations",
      title: "Works beside the tools you already use.",
      text:
        "Open Spot does not replace your calendar, POS, or booking software. It adds the fast SMS recovery layer for last-minute openings.",
      cards: [
        "Calendar",
        "Booking app",
        "Client list",
        "SMS",
        "Waitlist",
        "QR code",
        "Consent",
        "Replies",
        "Dashboard",
        "Team review",
        "Open spot",
        "Follow-up",
        "Services",
        "Opt-out",
        "Reports",
        "Manual pick"
      ]
    },
    how: {
      tag: "How it works",
      title: "From cancellation to confirmed client in minutes.",
      steps: [
        [
          "01",
          "Client cancels.",
          "A same-day slot opens and your team creates an Open Spot alert."
        ],
        [
          "02",
          "You send one SMS.",
          "Eligible clients receive a clear message and reply by SMS if they want the spot."
        ],
        [
          "03",
          "Clients reply YES.",
          "Replies are collected in one queue with the appointment time and service context."
        ],
        [
          "04",
          "You manually confirm.",
          "Open Spot never confirms automatically. Your team chooses the best fit."
        ]
      ]
    },
    pricing: {
      tag: "Pricing",
      title: "Simple plans, clear value.",
      cards: [
        [
          "Starter",
          "For one location testing SMS recovery.",
          ["SMS waitlist", "Opening alerts", "Reply queue", "Manual confirmation", "Basic recovery view"],
          "Start a pilot"
        ],
        [
          "Growth",
          "For teams recovering multiple cancellations each week.",
          ["Everything in Starter", "Customer import controls", "Consent-aware targeting", "Recovered value reporting", "Setup support"],
          "Talk to the team"
        ],
        [
          "Scale",
          "For multi-location operators or custom workflows.",
          ["Location controls", "Team workflows", "Operational review", "Volume planning", "Priority support"],
          "Contact us"
        ]
      ]
    },
    results: {
      title: "Real recovery workflows for real appointment teams.",
      text:
        "Open Spot is built around the moment a local business would otherwise start calling clients one by one.",
      cards: [
        ["Salon", "A color appointment cancels in the morning. The waitlist receives one SMS and the team picks who to confirm."],
        ["Barber", "A 4:30 PM haircut opens. Replies arrive by SMS while the barber keeps serving clients."],
        ["Clinic", "A treatment slot becomes available. Eligible clients reply and staff manually confirms the right fit."],
        ["Spa", "A same-day opening is recovered without moving clients into a marketplace or new booking flow."]
      ],
      stats: [
        ["85", "Dollars recovered on one haircut slot"],
        ["2 min", "To send a focused SMS alert"],
        ["100%", "Manual final confirmation"]
      ]
    },
    faq: {
      tag: "FAQ",
      title: "Questions before your first SMS sends.",
      text: "Open Spot keeps merchant control intact and respects SMS consent.",
      items: [
        ["Does Open Spot replace my booking system?", "No. Your calendar, POS, and booking tools stay in place. Open Spot handles the SMS recovery workflow."],
        ["Is the first customer who replies automatically confirmed?", "No. Replies are ranked by received time, but the business always chooses who to confirm."],
        ["Can I message every imported client?", "No. Clients need valid SMS consent before they receive opening alerts."],
        ["What happens if someone replies STOP?", "They are opted out and must be excluded from future sends."],
        ["Do clients need an app?", "No. Clients receive and answer a normal SMS."],
        ["Is there payment automation?", "No. Open Spot is focused on filling the opening and keeping confirmation manual."]
      ]
    },
    resources: {
      tag: "Blog",
      title: "Guides to recover more appointments.",
      cards: [
        ["How to reduce lost cancellations", "A practical workflow for reacting fast when a slot opens."],
        ["Managing SMS consent properly", "Why clean consent keeps your waitlist useful and compliant."],
        ["Building a useful waitlist", "How QR signups and service interests improve recovery messages."]
      ]
    },
    final: {
      title: "Stop losing revenue to last-minute cancellations.",
      text:
        "Open Spot gives your team a simple SMS workflow to recover open slots before they disappear.",
      primary: "Start with Open Spot",
      secondary: "See how it works"
    },
    footer: {
      line: "Fill last-minute cancellations with one simple SMS.",
      product: "Platform",
      account: "Account",
      legal: "Legal",
      privacy: "Privacy",
      terms: "Terms"
    }
  }
} as const;

type TemplateCopy = (typeof copy)[Locale];
type PricingCardData = TemplateCopy["pricing"]["cards"][number];

export function LuneraOpenSpotTemplate({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [progress, setProgress] = useState(0);
  const repeatedLogos = useMemo(() => [...t.logos, ...t.logos], [t.logos]);
  const repeatedResults = useMemo(
    () => [...t.results.cards, ...t.results.cards],
    [t.results.cards]
  );

  useEffect(() => {
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
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }
    );

    revealItems.forEach((item) => observer.observe(item));

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
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
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
      className="lunera-template min-h-screen overflow-hidden bg-white text-[#090b10]"
      style={{ "--lunera-progress": progress } as CSSProperties}
    >
      <FloatingNavbar locale={locale} t={t} />
      <main>
        <Hero locale={locale} t={t} />
        <LogoStrip items={repeatedLogos} />
        <FeatureSection t={t} />
        <IntegrationsSection t={t} />
        <HowItWorks t={t} />
        <Pricing t={t} />
        <Results t={t} repeatedResults={repeatedResults} />
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
      <div className="mx-auto flex min-h-[4rem] max-w-[64rem] items-center justify-between gap-3 rounded-full border border-white/80 bg-white/92 px-4 py-2 shadow-[0_18px_55px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
        <Link
          className="flex shrink-0 items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4686fe]"
          href="/"
        >
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
          <Link
            className="hidden rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 md:inline-flex"
            href="/sign-in"
          >
            {t.nav.login}
          </Link>
          <Link
            className="hidden min-h-[2.625rem] items-center rounded-full bg-black px-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 sm:inline-flex"
            href="/signup"
          >
            {t.nav.primary}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
      href={href}
    >
      {children}
    </Link>
  );
}

function Hero({ locale, t }: { locale: Locale; t: TemplateCopy }) {
  return (
    <section className="relative min-h-[68rem] overflow-hidden px-4 pb-10 pt-36 sm:pt-44">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,#d7f1ff_0%,#eef9ff_24rem,transparent_45rem),linear-gradient(180deg,#f7fcff_0%,#ffffff_74%)]" />
      <div className="mx-auto max-w-[69rem] text-center">
        <p className="lunera-eyebrow mx-auto" data-lunera-reveal>
          {t.hero.eyebrow}
        </p>
        <h1
          className="mx-auto mt-7 max-w-[44rem] text-5xl font-medium leading-[1.1] text-[#050608] md:text-[3.75rem]"
          data-lunera-reveal
        >
          {t.hero.title}
        </h1>
        <p
          className="mx-auto mt-6 max-w-[38rem] text-base font-medium leading-7 text-slate-600 md:text-lg"
          data-lunera-reveal
        >
          {t.hero.subtitle}
        </p>
        <div
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
          data-lunera-reveal
        >
          {t.hero.badges.map((badge) => (
            <span
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm"
              key={badge}
            >
              {badge}
            </span>
          ))}
        </div>
        <div
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          data-lunera-reveal
        >
          <Link className="lunera-cta-primary" href="/signup">
            {t.hero.primary}
          </Link>
          <Link className="lunera-cta-secondary" href="#how">
            {t.hero.secondary}
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[69rem]" data-lunera-reveal>
        <SmsConversationPhone locale={locale} />
      </div>
      <div className="mx-auto mt-3 max-w-[19rem] text-center" data-lunera-reveal>
        <div className="mx-auto mb-2 flex w-fit -space-x-2">
          {["S", "B", "C"].map((label) => (
            <span
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[#edf4ff] text-xs font-black text-[#3565d9] shadow-sm"
              key={label}
            >
              {label}
            </span>
          ))}
        </div>
        <p className="text-sm font-bold leading-6 text-slate-500">{t.hero.proof}</p>
      </div>
    </section>
  );
}

function LogoStrip({ items }: { items: readonly string[] }) {
  return (
    <section className="bg-white px-4 py-16">
      <div className="lunera-marquee" data-lunera-reveal>
        <div className="lunera-marquee-track">
          {items.map((item, index) => (
            <span
              className="grid h-8 min-w-[7.75rem] place-items-center rounded-full border border-slate-200 bg-white px-5 text-xs font-black text-slate-400 shadow-sm"
              key={`${item}-${index}`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureSection({ t }: { t: TemplateCopy }) {
  const [topCards, bottomCards] = [t.features.cards.slice(0, 3), t.features.cards.slice(3)];

  return (
    <TemplateSection id="features">
      <SectionHeading tag={t.features.tag} title={t.features.title} />
      <div className="mx-auto mt-16 grid max-w-[69rem] gap-5 lg:grid-cols-3">
        {topCards.map(([title, text, label], index) => (
          <FeatureCard index={index} key={title} label={label} text={text} title={title} />
        ))}
      </div>
      <div className="mx-auto mt-5 grid max-w-[69rem] gap-5 lg:grid-cols-2">
        {bottomCards.map(([title, text, label], index) => (
          <FeatureCard
            compact
            index={index + topCards.length}
            key={title}
            label={label}
            text={text}
            title={title}
          />
        ))}
      </div>
    </TemplateSection>
  );
}

function FeatureCard({
  compact,
  index,
  label,
  text,
  title
}: {
  compact?: boolean;
  index: number;
  label: string;
  text: string;
  title: string;
}) {
  return (
    <article
      className={cn(
        "lunera-card overflow-hidden p-7",
        compact ? "min-h-[13.5rem] lg:grid lg:grid-cols-[1fr_13rem] lg:items-center" : "min-h-[20.25rem]"
      )}
      data-lunera-reveal
    >
      <div>
        <span className="text-sm font-black text-[#4686fe]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-5 text-2xl font-medium leading-tight text-[#050608]">{title}</h3>
        <p className="mt-4 text-sm font-medium leading-7 text-slate-500">{text}</p>
      </div>
      <div
        className={cn(
          "mt-7 rounded-[1.25rem] bg-[#f6f8fb] p-4",
          compact ? "lg:mt-0" : "min-h-[9rem]"
        )}
      >
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#edf4ff] text-xs font-black text-[#4686fe]">
              OS
            </span>
            <span className="rounded-full bg-black px-3 py-1 text-[0.68rem] font-black text-white">
              {label}
            </span>
          </div>
          <div className="mt-4 h-2.5 w-4/5 rounded-full bg-[#4686fe]/65" />
          <div className="mt-3 h-2.5 w-3/5 rounded-full bg-slate-200" />
          <div className="mt-3 h-2.5 w-11/12 rounded-full bg-slate-200" />
        </div>
      </div>
    </article>
  );
}

function IntegrationsSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-24 sm:py-28" id="tools">
      <SectionHeading tag={t.tools.tag} title={t.tools.title} />
      <p
        className="mx-auto mt-5 max-w-[38rem] text-center text-base font-medium leading-7 text-slate-500"
        data-lunera-reveal
      >
        {t.tools.text}
      </p>
      <div className="lunera-integration-cloud mx-auto mt-16 max-w-[69rem]" data-lunera-reveal>
        {t.tools.cards.map((item, index) => (
          <div
            className="lunera-integration-card"
            key={item}
            style={{ "--tool-index": index } as CSSProperties}
          >
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 py-20 sm:py-28" id="how">
      <div className="mx-auto grid max-w-[69rem] gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <span className="lunera-pill" data-lunera-reveal>
            {t.how.tag}
          </span>
          <h2
            className="mt-8 text-4xl font-medium leading-tight text-[#050608] md:text-5xl"
            data-lunera-reveal
          >
            {t.how.title}
          </h2>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100" data-lunera-reveal>
            <div className="lunera-scroll-progress h-full rounded-full bg-[#4686fe]" />
          </div>
        </div>
        <div className="space-y-5">
          {t.how.steps.map(([number, title, text], index) => (
            <article className="lunera-step-card" data-lunera-reveal key={number}>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf4ff] text-sm font-black text-[#4686fe]">
                {number}
              </span>
              <div>
                <h3 className="text-3xl font-medium leading-tight text-[#050608]">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-500">{text}</p>
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
    <div className="mt-8 rounded-[1.25rem] bg-[#f8fbff] p-5">
      <div className="grid grid-cols-5 items-end gap-3">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            className="lunera-bar block rounded-t-2xl bg-[#4686fe]"
            key={bar}
            style={{
              height: `${42 + ((bar + index) % 4) * 22}px`,
              opacity: 0.38 + bar * 0.12
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Pricing({ t }: { t: TemplateCopy }) {
  return (
    <TemplateSection id="pricing">
      <SectionHeading tag={t.pricing.tag} title={t.pricing.title} />
      <div className="mx-auto mt-16 grid max-w-[69rem] gap-5 lg:grid-cols-3">
        {t.pricing.cards.map((card, index) => (
          <PricingCard card={card} featured={index === 1} key={card[0]} />
        ))}
      </div>
    </TemplateSection>
  );
}

function PricingCard({ card, featured }: { card: PricingCardData; featured?: boolean }) {
  const [title, text, features, cta] = card;

  return (
    <article
      className={cn(
        "lunera-card flex min-h-[31.5rem] flex-col p-7",
        featured && "border-[#4686fe] shadow-[0_28px_80px_rgba(70,134,254,0.2)]"
      )}
      data-lunera-reveal
    >
      {featured ? (
        <span className="mb-5 w-fit rounded-full bg-[#4686fe] px-3 py-1 text-xs font-black text-white">
          Best fit
        </span>
      ) : null}
      <h3 className="text-3xl font-medium text-[#050608]">{title}</h3>
      <p className="mt-4 min-h-20 text-sm font-medium leading-7 text-slate-500">{text}</p>
      <div className="mt-6 border-t border-slate-100 pt-6">
        <p className="text-4xl font-medium text-[#050608]">
          {featured ? "Open Spot" : "Flexible"}
        </p>
        <p className="mt-2 text-sm font-bold text-slate-400">No fixed public price</p>
      </div>
      <Link
        className={cn(
          "mt-6 inline-flex min-h-[2.625rem] items-center justify-center rounded-full px-5 text-sm font-black transition hover:-translate-y-0.5",
          featured ? "bg-[#4686fe] text-white" : "bg-black text-white"
        )}
        href="/book-call/questions"
      >
        {cta}
      </Link>
      <ul className="mt-7 space-y-4">
        {features.map((feature) => (
          <li className="flex gap-3 text-sm font-bold leading-6 text-slate-600" key={feature}>
            <span className="mt-0.5 text-[#4686fe]">+</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Results({
  repeatedResults,
  t
}: {
  repeatedResults: readonly (readonly [string, string])[];
  t: TemplateCopy;
}) {
  return (
    <section className="overflow-hidden bg-white px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-[69rem] text-center">
        <h2 className="mx-auto max-w-[41rem] text-4xl font-medium leading-tight text-[#050608] md:text-5xl" data-lunera-reveal>
          {t.results.title}
        </h2>
        <p className="mx-auto mt-5 max-w-[36rem] text-base font-medium leading-7 text-slate-500" data-lunera-reveal>
          {t.results.text}
        </p>
      </div>
      <div className="lunera-marquee mt-12" data-lunera-reveal>
        <div className="lunera-marquee-track lunera-marquee-slow">
          {repeatedResults.map(([title, text], index) => (
            <article
              className="w-[22.4rem] shrink-0 rounded-[1.25rem] border border-slate-100 bg-white p-6 shadow-[0_22px_55px_rgba(15,23,42,0.08)]"
              key={`${title}-${index}`}
            >
              <h3 className="text-xl font-medium text-[#050608]">{title}</h3>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-16 grid max-w-[48rem] gap-8 text-center sm:grid-cols-3" data-lunera-reveal>
        {t.results.stats.map(([value, label]) => (
          <div key={label}>
            <p className="text-4xl font-medium text-[#050608]">{value}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq({ t }: { t: TemplateCopy }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-white px-4 py-20 sm:py-28" id="faq">
      <div className="mx-auto grid max-w-[69rem] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <span className="lunera-pill" data-lunera-reveal>
            {t.faq.tag}
          </span>
          <h2
            className="mt-7 text-4xl font-medium leading-tight text-[#050608] md:text-5xl"
            data-lunera-reveal
          >
            {t.faq.title}
          </h2>
          <p className="mt-6 max-w-md text-base font-medium leading-7 text-slate-500" data-lunera-reveal>
            {t.faq.text}
          </p>
          <Link className="lunera-cta-secondary mt-8" href="/book-call/questions" data-lunera-reveal>
            Ask a question
          </Link>
        </div>
        <div className="rounded-[1.5rem] bg-[#f8fafc] p-3" data-lunera-reveal>
          {t.faq.items.map(([question, answer], index) => {
            const isOpen = index === openIndex;

            return (
              <div className="border-b border-white last:border-b-0" key={question}>
                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-5 rounded-[1rem] bg-white px-5 py-5 text-left text-base font-bold text-[#050608] transition hover:bg-[#f7fbff]"
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
      <SectionHeading tag={t.resources.tag} title={t.resources.title} />
      <div className="mx-auto mt-16 grid max-w-[69rem] gap-5 lg:grid-cols-3">
        {t.resources.cards.map(([title, text], index) => (
          <article className="lunera-card min-h-[24rem] overflow-hidden p-0" data-lunera-reveal key={title}>
            <div className="h-44 bg-[linear-gradient(135deg,#dff3ff,#ffffff)] p-6">
              <div className="h-full rounded-[1.25rem] border border-white/80 bg-white/70 p-4 shadow-sm">
                <div className="h-3 w-4/5 rounded-full bg-[#4686fe]/50" />
                <div className="mt-4 h-3 w-1/2 rounded-full bg-white" />
                <div className="mt-10 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((item) => (
                    <span
                      className="h-12 rounded-2xl bg-white/85 shadow-sm"
                      key={`${index}-${item}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-7">
              <h3 className="text-2xl font-medium leading-tight text-[#050608]">{title}</h3>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-500">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </TemplateSection>
  );
}

function FinalCta({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 pb-20 pt-6">
      <div
        className="mx-auto max-w-[69rem] rounded-[2rem] bg-black px-6 py-16 text-center text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:px-10 sm:py-20"
        data-lunera-reveal
      >
        <h2 className="mx-auto max-w-[53rem] text-4xl font-medium leading-tight md:text-6xl">
          {t.final.title}
        </h2>
        <p className="mx-auto mt-6 max-w-[38rem] text-base font-medium leading-7 text-white/65">
          {t.final.text}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="lunera-cta-light" href="/signup">
            {t.final.primary}
          </Link>
          <Link className="lunera-cta-dark" href="#how">
            {t.final.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer({ t }: { t: TemplateCopy }) {
  return (
    <footer className="border-t border-slate-100 bg-white px-4 py-10">
      <div className="mx-auto grid max-w-[69rem] gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Image
            alt="Open Spot"
            className="h-10 w-auto"
            height={72}
            src="/brand/open-spot-logo-horizontal.svg"
            width={312}
          />
          <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-slate-500">
            {t.footer.line}
          </p>
        </div>
        <FooterColumn
          links={[
            ["Features", "#features"],
            ["Pricing", "#pricing"],
            ["Integrations", "#tools"],
            ["FAQ", "#faq"]
          ]}
          title={t.footer.product}
        />
        <FooterColumn
          links={[
            [t.nav.login, "/sign-in"],
            [t.nav.primary, "/signup"],
            [t.nav.resources, "#resources"]
          ]}
          title={t.footer.account}
        />
        <FooterColumn
          links={[
            [t.footer.privacy, "/privacy"],
            [t.footer.terms, "/terms"]
          ]}
          title={t.footer.legal}
        />
      </div>
    </footer>
  );
}

function FooterColumn({ links, title }: { links: Array<[string, string]>; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-black text-[#050608]">{title}</h3>
      <div className="mt-4 grid gap-3">
        {links.map(([label, href]) => (
          <Link
            className="text-sm font-bold text-slate-500 transition hover:text-slate-950"
            href={href}
            key={`${label}-${href}`}
          >
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
      {children}
    </section>
  );
}

function SectionHeading({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="mx-auto max-w-[38rem] text-center">
      <span className="lunera-pill" data-lunera-reveal>
        {tag}
      </span>
      <h2
        className="mt-7 text-4xl font-medium leading-tight text-[#050608] md:text-5xl"
        data-lunera-reveal
      >
        {title}
      </h2>
    </div>
  );
}
