"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

const openSpotCopy = {
  nav: {
    features: "Features",
    how: "How it works",
    pricing: "Pricing",
    contact: "Contact",
    primary: "Get Early Access"
  },
  hero: {
    title: ["Fill your schedule", "with simple SMS."],
    subtitle: [
      "Open Spot helps you capture interest, notify at the right time,",
      "and recover more revenue\u2014with less work."
    ]
  },
  businessTypes: [
    "Salons",
    "Barbers",
    "Beauty Clinics",
    "Spas",
    "Nail Studios",
    "Hair Stylists",
    "Massage Clinics",
    "Med Spas",
    "Tattoo Studios",
    "Physio Clinics",
    "Chiropractors",
    "Dental Clinics",
    "Estheticians",
    "Lash Studios",
    "Brow Studios",
    "Wellness Studios",
    "Pet Groomers",
    "Personal Trainers",
    "Therapy Clinics",
    "Appointment Teams"
  ],
  features: {
    tag: "Features",
    title: ["Refill cancellations", "with simple SMS."],
    cards: [
      {
        title: "Real-Time Replies",
        text: "See who replied YES as soon as your waitlist responds.",
        label: "2 replies",
        visual: "replies"
      },
      {
        title: "Waitlist Alerts",
        text: "Notify eligible clients when a same-day spot opens.",
        label: "SMS sent",
        visual: "alerts"
      },
      {
        title: "Manual Confirmation",
        text: "Your team chooses who gets the appointment. No one is confirmed without review.",
        label: "Review",
        visual: "review"
      },
      {
        title: "Consent Tracking",
        text: "Keep opt-ins and STOP instructions clear inside your SMS flow.",
        label: "Consent checked",
        visual: "consent"
      },
      {
        title: "Recovered Revenue",
        text: "Track the value of filled cancellations without adding checkout workflows.",
        label: "$85 recovered",
        visual: "recovery"
      }
    ]
  },
  integrations: {
    tag: "Integrations",
    title: ["Works with the tools", "you already use."],
    text: "Connect Open Spot around your calendar, booking flow and SMS workflow.",
    tools: [
      "Calendar",
      "SMS",
      "Waitlist",
      "Booking",
      "Replies",
      "Consent",
      "Team",
      "QR",
      "Services",
      "Reports",
      "Review",
      "Follow-up"
    ]
  },
  how: {
    tag: "How It Works",
    title: ["From cancellation", "to filled spot - just", "three simple steps."],
    steps: [
      {
        number: "01",
        title: "Create an opening",
        text: "A client cancels and your team creates a same-day Open Spot alert.",
        label: "4:30 PM opening"
      },
      {
        number: "02",
        title: "Text your waitlist",
        text: "Eligible clients receive a clear SMS and reply YES if they want the spot.",
        label: "SMS sent"
      },
      {
        number: "03",
        title: "Manually confirm",
        text: "Review the replies and choose who gets the appointment. Open Spot never confirms automatically.",
        label: "Manual confirmation"
      }
    ]
  },
  pricing: {
    tag: "Pricing",
    title: "Simple plans, clear value.",
    cards: [
      {
        title: "Starter",
        price: "Early Access",
        text: "For one location testing SMS recovery.",
        cta: "Start a pilot",
        featured: false,
        features: [
          "SMS waitlist",
          "Opening alerts",
          "Reply queue",
          "Manual confirmation",
          "Basic recovery view"
        ]
      },
      {
        title: "Growth",
        price: "Open Spot",
        text: "For teams recovering multiple cancellations each week.",
        cta: "Talk to the team",
        featured: true,
        features: [
          "Everything in Starter",
          "Customer import controls",
          "Consent-aware targeting",
          "Recovered value reporting",
          "Setup support"
        ]
      },
      {
        title: "Scale",
        price: "Custom",
        text: "For multi-location operators or custom workflows.",
        cta: "Contact us",
        featured: false,
        features: [
          "Location controls",
          "Team workflows",
          "Operational review",
          "Volume planning",
          "Priority support"
        ]
      }
    ]
  },
  results: {
    title: "Real recovery workflows for real appointment teams.",
    text:
      "Open Spot is built around the moment a local business would otherwise start calling clients one by one.",
    cards: [
      [
        "Salon",
        "A color appointment cancels in the morning. The waitlist receives one SMS and the team picks who to confirm."
      ],
      [
        "Barber",
        "A 4:30 PM haircut opens. Replies arrive by SMS while the barber keeps serving clients."
      ],
      [
        "Clinic",
        "A treatment slot becomes available. Eligible clients reply and staff manually confirms the right fit."
      ],
      [
        "Spa",
        "A same-day opening is recovered without moving clients into a new booking flow."
      ]
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
      [
        "Does Open Spot replace my booking system?",
        "No. Your calendar, POS, and booking tools stay in place. Open Spot handles the SMS recovery workflow."
      ],
      [
        "Does Open Spot choose the client for me?",
        "No. Replies are organized for review, but the business always chooses who to confirm."
      ],
      [
        "Can I message every imported client?",
        "No. Clients need valid SMS consent before they receive opening alerts."
      ],
      [
        "What happens if someone replies STOP?",
        "They are opted out and must be excluded from future sends."
      ],
      ["Do clients need an app?", "No. Clients receive and answer a normal SMS."]
    ]
  },
  resources: {
    tag: "Blog",
    title: "Guides to recover more appointments.",
    cards: [
      [
        "How to reduce lost cancellations",
        "A practical workflow for reacting fast when a slot opens."
      ],
      [
        "Managing SMS consent properly",
        "Why clean consent keeps your waitlist useful and compliant."
      ],
      [
        "Building a useful waitlist",
        "How QR signups and service interests improve recovery messages."
      ]
    ]
  },
  final: {
    title: "Stop losing revenue to last-minute cancellations.",
    text:
      "Open Spot gives your team a simple SMS workflow to refill empty appointment slots before they disappear.",
    primary: "Get Early Access",
    secondary: "Contact Sales"
  },
  footer: {
    line: "Fill last-minute cancellations with one simple SMS.",
    product: "Platform",
    resource: "Resource",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms"
  }
} as const;

const copy = {
  en: openSpotCopy,
  fr: openSpotCopy
} as const satisfies Record<Locale, typeof openSpotCopy>;

type TemplateCopy = (typeof copy)[Locale];

const earlyAccessHref = "/book-call/questions";

export function LuneraOpenSpotTemplate({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const logoStripItems = useMemo(
    () => [...t.businessTypes, ...t.businessTypes, ...t.businessTypes],
    [t.businessTypes]
  );
  const resultCards = useMemo(
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
      className="lunera-template min-h-screen overflow-hidden bg-white text-[#07090f]"
      ref={rootRef}
      style={{ "--lunera-progress": 0 } as CSSProperties}
    >
      <FloatingNavbar t={t} />
      <main>
        <MetricsHeroSection t={t} />
        <LogoStrip items={logoStripItems} />
        <IntegrationsSection t={t} />
        <HowItWorks t={t} />
        <Pricing t={t} />
        <Results resultCards={resultCards} t={t} />
        <Faq t={t} />
        <Resources t={t} />
        <FinalCta t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}

function FloatingNavbar({ t }: { t: TemplateCopy }) {
  return (
    <header className="fixed inset-x-0 top-5 z-50 px-4">
      <div className="mx-auto flex min-h-[3.75rem] max-w-[52.5rem] items-center justify-between gap-3 rounded-full border border-white/90 bg-white/94 px-3.5 py-2 shadow-[0_16px_44px_rgba(15,23,42,0.11)] backdrop-blur-2xl sm:px-4">
        <Link
          className="flex shrink-0 items-center gap-2 rounded-full text-[0.98rem] font-semibold tracking-normal text-[#07090f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4388ff]"
          href="/"
        >
          <OpenSpotMark />
          <span>Open Spot</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          <NavLink href="#features">{t.nav.features}</NavLink>
          <NavLink href="#how">{t.nav.how}</NavLink>
          <NavLink href="#pricing">{t.nav.pricing}</NavLink>
          <NavLink href="/contact">{t.nav.contact}</NavLink>
        </nav>
        <Link
          className="inline-flex min-h-[2.5rem] shrink-0 items-center justify-center rounded-full bg-black px-3.5 text-[0.82rem] font-bold text-white shadow-[0_12px_26px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 sm:px-4"
          href={earlyAccessHref}
        >
          <span>{t.nav.primary}</span>
        </Link>
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

function MetricsHeroSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="open-spot-metrics-hero bg-white px-4 pb-10 pt-28 sm:pt-32" id="features">
      <div className="mx-auto max-w-[70rem]">
        <div className="mx-auto max-w-[44rem] text-center">
          <h1
            className="mx-auto text-balance text-[2.65rem] font-semibold leading-[0.98] tracking-normal text-[#05070b] sm:text-[4rem] lg:text-[4.45rem]"
            data-lunera-reveal
          >
            {t.hero.title.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h1>
          <p
            className="mx-auto mt-5 max-w-[34rem] text-[1rem] font-medium leading-7 text-[#63708b] sm:text-[1.08rem]"
            data-lunera-reveal
          >
            {t.hero.subtitle[0]}
            <br className="hidden sm:block" />
            {t.hero.subtitle[1]}
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-[65rem] gap-5 lg:grid-cols-3">
          <MetricCard
            body="See who replied YES as soon as your waitlist responds."
            title="Real-Time Replies"
            visual={<RealTimeRepliesVisual />}
          />
          <MetricCard
            body="Track how much revenue is recovered from filled last-minute openings."
            title="Revenue Saved"
            visual={<RevenueSavedChart />}
          />
          <MetricCard
            body="Your team chooses who gets the appointment. No one is confirmed without review."
            title="Manual Confirmation"
            visual={<ManualConfirmationVisual />}
          />
        </div>
        <div className="mx-auto mt-5 grid max-w-[65rem] gap-5 lg:grid-cols-2">
          <MetricCard
            body="See how quickly last-minute openings are filled after your SMS goes out."
            title="Average Fill Time"
            variant="wide"
            visual={<AverageFillTimeVisual />}
          />
          <MetricCard
            body="Track the number of cancelled appointments you've successfully filled."
            title="Successfully Filled Spots"
            variant="wide"
            visual={<SuccessfullyFilledSpotsGauge />}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  body,
  title,
  variant,
  visual
}: {
  body: string;
  title: string;
  variant?: "wide";
  visual: ReactNode;
}) {
  return (
    <article
      className={cn(
        "open-spot-metric-card rounded-[1.25rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]",
        variant === "wide"
          ? "min-h-[14.75rem] sm:p-7 lg:grid lg:grid-cols-[1fr_1.18fr] lg:items-center"
          : "min-h-[17.5rem]"
      )}
      data-lunera-reveal
    >
      <div className="relative z-10">
        <h2 className="text-[1.18rem] font-semibold leading-tight text-[#07090f]">{title}</h2>
        <p className="mt-2.5 max-w-[16rem] text-[0.88rem] font-medium leading-6 text-[#4e5a70]">
          {body}
        </p>
      </div>
      {visual}
    </article>
  );
}

function RealTimeRepliesVisual() {
  return (
    <div className="mt-8 flex min-h-[7.2rem] items-center gap-6 rounded-[1rem] border border-slate-100 bg-white px-5 shadow-[0_18px_46px_rgba(15,23,42,0.08)]">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[conic-gradient(#3485ff_0_78%,#edf3fb_78%_100%)] shadow-[inset_0_0_0_7px_#f8fbff]">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#3485ff] text-white shadow-[0_12px_28px_rgba(52,133,255,0.3)]">
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none text-[#05070b]">128</p>
        <p className="mt-3 text-sm font-medium text-[#4e5a70]">YES replies</p>
        <p className="mt-2 text-xs font-semibold text-[#17b35f]">{"\u2191"} 24% vs yesterday</p>
      </div>
    </div>
  );
}

function RevenueSavedChart() {
  return (
    <div className="relative mt-6 min-h-[9rem] overflow-hidden rounded-[1rem]">
      <svg
        aria-hidden="true"
        className="h-[9rem] w-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 320 150"
      >
        <defs>
          <linearGradient id="open-spot-revenue-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3485ff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3485ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 123 C26 111 37 127 62 108 C92 86 102 77 128 78 C156 79 163 69 190 70 C222 71 232 53 256 35 C276 20 291 25 320 10 L320 150 L0 150 Z" fill="url(#open-spot-revenue-fill)" />
        <path className="open-spot-revenue-line" d="M0 123 C26 111 37 127 62 108 C92 86 102 77 128 78 C156 79 163 69 190 70 C222 71 232 53 256 35 C276 20 291 25 320 10" />
        <path d="M0 78 H320" stroke="#edf2f7" strokeDasharray="3 5" />
        <path d="M198 50 V142" stroke="#d8e4f3" />
        <circle cx="198" cy="66" fill="#3485ff" r="7" stroke="white" strokeWidth="3" />
      </svg>
      <div className="absolute left-[43%] top-0 rounded-[0.85rem] border border-slate-100 bg-white/95 px-3 py-2 shadow-[0_16px_38px_rgba(15,23,42,0.1)]">
        <p className="text-[0.68rem] font-semibold text-[#3485ff]">Revenue saved</p>
        <p className="mt-1 text-lg font-semibold leading-none text-[#05070b]">$8.3K</p>
        <p className="mt-1.5 text-[0.68rem] font-medium text-[#64748b]">This month</p>
      </div>
    </div>
  );
}

function ManualConfirmationVisual() {
  return (
    <div className="relative mt-8 flex min-h-[8rem] items-center justify-center">
      <MiniDonutCard label="Reviewed" percent={100} rotation="-6deg" />
      <MiniDonutCard label="Confirmation" offset percent={72} rotation="8deg" />
    </div>
  );
}

function MiniDonutCard({
  label,
  offset,
  percent,
  rotation
}: {
  label: string;
  offset?: boolean;
  percent: number;
  rotation: string;
}) {
  return (
    <div
      className={cn(
        "w-[7.4rem] rounded-[0.85rem] bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.11)]",
        offset && "-ml-3 mt-3"
      )}
      style={{ transform: `rotate(${rotation})` }}
    >
      <p className="text-[0.7rem] font-semibold text-[#2768df]">{label}</p>
      <div
        className="mx-auto mt-3 grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full shadow-[inset_0_0_0_10px_#f1f5f9]"
        style={{ background: `conic-gradient(#3485ff 0 ${percent}%, #eef2f7 ${percent}% 100%)` }}
      >
        <div className="grid h-[2.6rem] w-[2.6rem] place-items-center rounded-full bg-white text-sm font-semibold text-[#164db8]">
          {percent}%
        </div>
      </div>
    </div>
  );
}

function AverageFillTimeVisual() {
  return (
    <div className="mt-7 lg:mt-0">
      <div className="flex items-end gap-2">
        <p className="text-[2.55rem] font-semibold leading-none text-[#05070b]">18</p>
        <p className="pb-1 text-xl font-medium text-[#05070b]">min</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#17b35f]">{"\u2193"} 22% faster this week</p>
      <div className="relative mt-9">
        <div className="h-2.5 rounded-full bg-[#e8eef8]">
          <div className="h-2.5 w-[58%] rounded-full bg-[#3485ff]" />
        </div>
        <span className="absolute left-[56%] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#3485ff] shadow-[0_6px_18px_rgba(52,133,255,0.32)]" />
        <span className="absolute left-[89%] top-[-1.2rem] h-10 border-l border-dashed border-[#aab8cc]" />
        <div className="mt-4 flex justify-between text-xs font-medium text-[#68758e]">
          <span>0 min</span>
          <span>15 min</span>
          <span>30 min</span>
        </div>
      </div>
    </div>
  );
}

function SuccessfullyFilledSpotsGauge() {
  return (
    <div className="relative mt-8 flex min-h-[10.5rem] items-center justify-center lg:mt-0">
      <div className="relative h-[10.5rem] w-[13rem]">
        {Array.from({ length: 54 }).map((_, index) => {
          const active = index < 36;
          const angle = -130 + index * (260 / 53);

          return (
            <span
              aria-hidden="true"
              className={cn("open-spot-gauge-tick", active && "is-active")}
              key={index}
              style={{ transform: `rotate(${angle}deg) translateY(-4.45rem)` }}
            />
          );
        })}
        <div className="absolute inset-0 grid place-items-center pt-4 text-center">
          <div>
            <p className="text-[2.8rem] font-semibold leading-none text-[#05070b]">84</p>
            <p className="mt-2 text-sm font-medium text-[#4e5a70]">filled spots</p>
            <p className="mt-2 text-xs font-semibold text-[#17b35f]">{"\u2191"} 18% this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoStrip({ items }: { items: readonly string[] }) {
  return (
    <section className="bg-white px-4 pb-16 pt-8">
      <div className="lunera-business-marquee" data-lunera-reveal>
        <div className="lunera-business-marquee-track">
          {items.map((item, index) => (
            <span
              className="grid h-9 min-w-[10rem] place-items-center whitespace-nowrap rounded-full px-5 text-sm font-black text-slate-300"
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

function IntegrationsSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-24 sm:py-32" id="tools">
      <SectionHeading tag={t.integrations.tag} title={t.integrations.title} />
      <p
        className="mx-auto mt-5 max-w-[38rem] text-center text-base font-medium leading-7 text-slate-500"
        data-lunera-reveal
      >
        {t.integrations.text}
      </p>
      <div className="lunera-arc-stage mx-auto mt-16" data-lunera-reveal>
        {t.integrations.tools.map((item, index) => (
          <div
            className="lunera-arc-card"
            key={item}
            style={{ "--arc-index": index } as CSSProperties}
          >
            <span>{item.slice(0, 2)}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 py-20 sm:py-32" id="how">
      <div className="mx-auto grid max-w-[70rem] gap-10 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <span className="lunera-pill" data-lunera-reveal>
            {t.how.tag}
          </span>
          <h2
            className="mt-8 text-4xl font-semibold leading-[1.02] tracking-normal text-[#06080d] md:text-5xl"
            data-lunera-reveal
          >
            {t.how.title.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h2>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100" data-lunera-reveal>
            <div className="lunera-scroll-progress h-full rounded-full bg-[#4388ff]" />
          </div>
        </div>
        <div className="space-y-5">
          {t.how.steps.map((step, index) => (
            <article className="lunera-step-card" data-lunera-reveal key={step.number}>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf5ff] text-sm font-black text-[#4388ff]">
                {step.number}
              </span>
              <div>
                <h3 className="text-3xl font-semibold leading-tight text-[#06080d]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-500">{step.text}</p>
                <StepVisual index={index} label={step.label} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepVisual({ index, label }: { index: number; label: string }) {
  return (
    <div className="mt-8 overflow-hidden rounded-[1.5rem] bg-[#f7faff] p-5">
      <div className="mb-5 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
        <span className="text-sm font-black text-[#4388ff]">{label}</span>
        <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">
          {index === 2 ? "Review" : "Ready"}
        </span>
      </div>
      <div className="grid grid-cols-5 items-end gap-3">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            className="lunera-bar block rounded-t-2xl bg-[#4388ff]"
            key={bar}
            style={{
              height: `${44 + ((bar + index) % 4) * 24}px`,
              opacity: 0.34 + bar * 0.13
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
      <div className="mx-auto mt-16 grid max-w-[70rem] gap-5 lg:grid-cols-3">
        {t.pricing.cards.map((card) => (
          <article
            className={cn(
              "lunera-card flex min-h-[31rem] flex-col p-7",
              card.featured && "border-[#4388ff] shadow-[0_28px_80px_rgba(67,136,255,0.2)]"
            )}
            data-lunera-reveal
            key={card.title}
          >
            {card.featured ? (
              <span className="mb-5 w-fit rounded-full bg-[#4388ff] px-3 py-1 text-xs font-black text-white">
                Best fit
              </span>
            ) : null}
            <h3 className="text-3xl font-semibold text-[#06080d]">{card.title}</h3>
            <p className="mt-4 min-h-20 text-sm font-medium leading-7 text-slate-500">
              {card.text}
            </p>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-4xl font-semibold text-[#06080d]">{card.price}</p>
              <p className="mt-2 text-sm font-bold text-slate-400">No fixed public price</p>
            </div>
            <Link
              className={cn(
                "mt-6 inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 text-sm font-black transition hover:-translate-y-0.5",
                card.featured ? "bg-[#4388ff] text-white" : "bg-black text-white"
              )}
              href="/book-call/questions"
            >
              {card.cta}
            </Link>
            <ul className="mt-7 space-y-4">
              {card.features.map((feature) => (
                <li className="flex gap-3 text-sm font-bold leading-6 text-slate-600" key={feature}>
                  <span className="mt-0.5 text-[#4388ff]">+</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </TemplateSection>
  );
}

function Results({
  resultCards,
  t
}: {
  resultCards: readonly (readonly [string, string])[];
  t: TemplateCopy;
}) {
  return (
    <section className="overflow-hidden bg-white px-4 py-20 sm:py-32">
      <div className="mx-auto max-w-[70rem] text-center">
        <h2
          className="mx-auto max-w-[44rem] text-4xl font-semibold leading-tight text-[#06080d] md:text-5xl"
          data-lunera-reveal
        >
          {t.results.title}
        </h2>
        <p
          className="mx-auto mt-5 max-w-[36rem] text-base font-medium leading-7 text-slate-500"
          data-lunera-reveal
        >
          {t.results.text}
        </p>
      </div>
      <div className="lunera-marquee mt-12" data-lunera-reveal>
        <div className="lunera-marquee-track lunera-marquee-slow">
          {resultCards.map(([title, text], index) => (
            <article
              className="w-[22.4rem] shrink-0 rounded-[1.5rem] border border-slate-100 bg-white p-6 shadow-[0_22px_55px_rgba(15,23,42,0.08)]"
              key={`${title}-${index}`}
            >
              <h3 className="text-xl font-semibold text-[#06080d]">{title}</h3>
              <p className="mt-4 text-sm font-medium leading-7 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
      <div
        className="mx-auto mt-16 grid max-w-[48rem] gap-8 text-center sm:grid-cols-3"
        data-lunera-reveal
      >
        {t.results.stats.map(([value, label]) => (
          <div key={label}>
            <p className="text-4xl font-semibold text-[#06080d]">{value}</p>
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
    <section className="bg-white px-4 py-20 sm:py-32" id="faq">
      <div className="mx-auto grid max-w-[70rem] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <span className="lunera-pill" data-lunera-reveal>
            {t.faq.tag}
          </span>
          <h2
            className="mt-7 text-4xl font-semibold leading-tight text-[#06080d] md:text-5xl"
            data-lunera-reveal
          >
            {t.faq.title}
          </h2>
          <p
            className="mt-6 max-w-md text-base font-medium leading-7 text-slate-500"
            data-lunera-reveal
          >
            {t.faq.text}
          </p>
          <Link className="lunera-cta-secondary mt-8" href="/contact" data-lunera-reveal>
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
                  className="flex w-full items-center justify-between gap-5 rounded-[1rem] bg-white px-5 py-5 text-left text-base font-bold text-[#06080d] transition hover:bg-[#f7fbff]"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  type="button"
                >
                  <span>{question}</span>
                  <span className={cn("text-2xl font-light transition", isOpen && "rotate-45")}>
                    +
                  </span>
                </button>
                <div className={cn("lunera-faq-answer", isOpen && "is-open")}>
                  <p className="px-5 pb-6 pt-1 text-sm font-medium leading-7 text-slate-500">
                    {answer}
                  </p>
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
      <div className="mx-auto mt-16 grid max-w-[70rem] gap-5 lg:grid-cols-3">
        {t.resources.cards.map(([title, text], index) => (
          <article
            className="lunera-card min-h-[24rem] overflow-hidden p-0"
            data-lunera-reveal
            key={title}
          >
            <div className="h-44 bg-[linear-gradient(135deg,#dff3ff,#ffffff)] p-6">
              <div className="h-full rounded-[1.5rem] border border-white/80 bg-white/70 p-4 shadow-sm">
                <div className="h-3 w-4/5 rounded-full bg-[#4388ff]/50" />
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
              <h3 className="text-2xl font-semibold leading-tight text-[#06080d]">{title}</h3>
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
        className="mx-auto max-w-[70rem] rounded-[2rem] bg-black px-6 py-16 text-center text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:px-10 sm:py-20"
        data-lunera-reveal
      >
        <h2 className="mx-auto max-w-[53rem] text-4xl font-semibold leading-tight md:text-6xl">
          {t.final.title}
        </h2>
        <p className="mx-auto mt-6 max-w-[38rem] text-base font-medium leading-7 text-white/65">
          {t.final.text}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="lunera-cta-light" href={earlyAccessHref}>
            {t.final.primary}
          </Link>
          <Link className="lunera-cta-dark" href="/contact">
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
      <div className="mx-auto grid max-w-[70rem] gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link
            className="inline-flex items-center gap-2.5 text-[1.05rem] font-semibold text-[#06080d]"
            href="/"
          >
            <OpenSpotMark />
            <span>Open Spot</span>
          </Link>
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
            ["Contact", "/contact"],
            ["Blog", "#resources"],
            [t.nav.primary, earlyAccessHref]
          ]}
          title={t.footer.resource}
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
      <h3 className="text-sm font-black text-[#06080d]">{title}</h3>
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
    <section className="bg-white px-4 py-20 sm:py-32" id={id}>
      {children}
    </section>
  );
}

function SectionHeading({
  tag,
  title
}: {
  tag: string;
  title: readonly string[] | string;
}) {
  const lines = Array.isArray(title) ? title : [title];

  return (
    <div className="mx-auto max-w-[42rem] text-center">
      <span className="lunera-pill" data-lunera-reveal>
        {tag}
      </span>
      <h2
        className="mt-7 text-4xl font-semibold leading-[1.04] tracking-normal text-[#06080d] md:text-5xl"
        data-lunera-reveal
      >
        {lines.map((line) => (
          <span className="block" key={line}>
            {line}
          </span>
        ))}
      </h2>
    </div>
  );
}
