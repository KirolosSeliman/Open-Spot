"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { SmsConversationPhone } from "@/components/marketing/sms-conversation-phone";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

const loginHref = "/sign-in";

const openSpotCopy = {
  nav: {
    features: "Features",
    how: "How it works",
    pricing: "Pricing",
    contact: "Contact",
    primary: "Se connecter"
  },
  hero: {
    title: ["Fill last-minute", "cancellations by SMS."],
    subtitle:
      "Open Spot contacts opted-in customers, ranks replies, and lets you choose who to confirm - without replacing your appointment system.",
    socialProof: "Built for appointment-based teams",
    primary: "Se connecter",
    secondary: "How it works",
    categories: ["Barbers", "Beauty Clinics", "Hair Salons", "Spas", "Nail Studios"]
  },
  metrics: {
    title: ["Fill your schedule", "with simple SMS."],
    subtitle:
      "Open Spot helps you capture interest, notify at the right time, and recover more revenue - with less work."
  },
  setup: {
    tag: "Simple setup",
    title: ["Keep your booking system.", "Fill the empty spots."],
    subtitle:
      "Open Spot adds a simple SMS recovery layer to your existing appointment workflow, so your team can fill cancellations without changing how they already book clients.",
    steps: ["Spot opens", "SMS sent to waitlist", "Replies ranked", "You confirm manually"]
  },
  how: {
    tag: "How It Works",
    title: ["From cancellation", "to confirmation -", "just three", "simple steps."],
    steps: [
      {
        number: "01",
        title: "Send Waitlist Alert",
        text: "Notify interested clients in seconds when a spot opens."
      },
      {
        number: "02",
        title: "Review Replies",
        text: "See responses in one clean queue and spot the best match."
      },
      {
        number: "03",
        title: "Confirm the Client",
        text: "Choose the best fit and confirm the appointment manually."
      }
    ]
  },
  workflow: {
    tag: "Workflow",
    title: "Non-disruptive cancellation recovery",
    text:
      "Open Spot works beside your booking system. You send SMS alerts, review replies, and manually confirm the best client."
  },
  pricing: {
    tag: "Pricing",
    title: "Simple pricing for appointment teams.",
    cards: [
      {
        title: "Starter",
        price: "$0 / mo",
        text: "For testing your waitlist workflow.",
        cta: "Se connecter",
        href: loginHref,
        featured: false,
        features: [
          "Manual opening creation",
          "SMS simulator",
          "Basic waitlist page",
          "Manual confirmation"
        ]
      },
      {
        title: "Growth",
        price: "$49 / mo",
        text: "For appointment-based businesses ready to recover cancellations.",
        cta: "Se connecter",
        href: loginHref,
        featured: true,
        badge: "Best Deal",
        features: [
          "Real SMS alerts",
          "Customer waitlist",
          "Reply tracking",
          "Manual validation",
          "Basic recovered revenue reporting"
        ]
      },
      {
        title: "Scale",
        price: "Custom",
        text: "For teams with multiple locations or higher SMS volume.",
        cta: "Book a call",
        href: "/book-call/questions",
        featured: false,
        features: [
          "Multi-location support",
          "Advanced reporting",
          "Custom onboarding",
          "Priority support"
        ]
      }
    ]
  },
  testimonials: {
    title: "Real results from local teams.",
    text:
      "Representative workflows for local teams using consent-based SMS recovery. Final confirmation always stays with the business.",
    cards: [
      [
        "SO",
        "Salon owner",
        "When a color appointment opens, the team can notify the waitlist quickly and choose the best fit without changing the calendar."
      ],
      [
        "BM",
        "Barber shop manager",
        "Replies land in one place, so the shop can keep serving clients while the next opening gets reviewed."
      ],
      [
        "BC",
        "Beauty clinic coordinator",
        "The manual confirmation step keeps the staff in control when multiple clients want the same slot."
      ],
      [
        "SR",
        "Spa receptionist",
        "Open Spot gives us a clean recovery layer beside the booking system instead of another booking tool to manage."
      ]
    ]
  },
  faq: {
    tag: "FAQ",
    title: "Questions before your first SMS sends.",
    text: "Open Spot keeps merchant control intact and respects SMS consent.",
    items: [
      [
        "Does Open Spot replace my booking system?",
        "No. It works beside your current system."
      ],
      [
        "Are clients confirmed automatically?",
        "No. Your team reviews replies and confirms manually."
      ],
      ["Do clients need an app?", "No. They reply by SMS."],
      [
        "Can I use SMS safely?",
        "Open Spot is designed around consent-based messaging and STOP opt-out handling."
      ],
      [
        "Can I start with a small list?",
        "Yes. You can start with a simple opted-in waitlist."
      ]
    ]
  },
  final: {
    title: "Ready to recover your next cancellation?",
    text:
      "Launch a simple SMS recovery workflow that keeps your booking system, your team, and your manual confirmation step in place.",
    primary: "Se connecter"
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

const copy = {
  en: openSpotCopy,
  fr: openSpotCopy
} as const satisfies Record<Locale, typeof openSpotCopy>;

type TemplateCopy = (typeof copy)[Locale];

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
      <FloatingNavbar t={t} />
      <main>
        <Hero t={t} />
        <MetricsSection t={t} />
        <SetupSection t={t} />
        <HowItWorks t={t} />
        <WorkflowPreview t={t} />
        <Pricing t={t} />
        <Testimonials t={t} />
        <Faq t={t} />
        <FinalCta t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}

function FloatingNavbar({ t }: { t: TemplateCopy }) {
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
        <Link
          className="inline-flex min-h-[2.38rem] shrink-0 items-center justify-center rounded-full bg-black px-3.5 text-[0.78rem] font-bold text-white shadow-[0_12px_26px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 sm:min-h-[2.5rem] sm:px-4"
          href={loginHref}
        >
          {t.nav.primary}
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

function Hero({ t }: { t: TemplateCopy }) {
  return (
    <section
      className="relative isolate overflow-hidden px-4 pb-10 pt-24 sm:pb-14 sm:pt-28"
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
      <HeroPhoneMockup />
      <HeroSocialProof label={t.hero.socialProof} />
      <HeroCtaRow t={t} />
      <CategoryStrip items={t.hero.categories} />
      <HeroCloudBlend />
    </section>
  );
}

function HeroPhoneMockup() {
  return (
    <div className="lunera-hero-visual-scene" data-lunera-reveal>
      <div className="lunera-phone-depth-layer">
        <SmsConversationPhone locale="en" />
      </div>
    </div>
  );
}

function HeroSocialProof({ label }: { label: string }) {
  return (
    <div className="lunera-hero-social-proof" data-lunera-reveal>
      <div className="lunera-avatar-stack" aria-hidden="true">
        {["SA", "MR", "JT", "AL"].map((initials) => (
          <span className="bg-white text-[0.65rem] font-black text-[#3478ff]" key={initials}>
            {initials}
          </span>
        ))}
      </div>
      <div>
        <div className="lunera-stars" aria-label="Five star style social proof">
          *****
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
    <div className="open-spot-category-strip relative z-40 mx-auto mt-11 flex max-w-[54rem] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-black text-slate-400 sm:gap-x-12">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
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

function MetricsSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 py-20 sm:py-28">
      <SectionHeading subtitle={t.metrics.subtitle} title={t.metrics.title} />
      <div className="mx-auto mt-12 grid max-w-[72rem] gap-5 lg:grid-cols-3">
        <DashboardCard
          text="See who replied YES as soon as your waitlist responds."
          title="Real-Time Replies"
          visual={<RepliesVisual />}
        />
        <DashboardCard
          text="Track how much revenue is recovered from filled last-minute openings."
          title="Revenue Saved"
          visual={<RevenueVisual />}
        />
        <DashboardCard
          text="Your team chooses who gets the appointment. No one is confirmed without review."
          title="Manual Confirmation"
          visual={<ManualVisual />}
        />
        <DashboardCard
          className="lg:col-span-1 xl:col-span-1"
          text="See how quickly last-minute openings are filled after your SMS goes out."
          title="Average Fill Time"
          visual={<FillTimeVisual />}
        />
        <DashboardCard
          className="lg:col-span-2"
          text="Track the number of cancelled appointments you've successfully filled."
          title="Successfully Filled Spots"
          visual={<FilledSpotsVisual />}
        />
      </div>
    </section>
  );
}

function DashboardCard({
  className,
  text,
  title,
  visual
}: {
  className?: string;
  text: string;
  title: string;
  visual: ReactNode;
}) {
  return (
    <article
      className={cn(
        "open-spot-dashboard-card min-h-[18rem] rounded-[1.5rem] border border-slate-100 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.07)]",
        className
      )}
      data-lunera-reveal
    >
      <h3 className="text-xl font-black text-[#0a0a0a]">{title}</h3>
      <p className="mt-3 max-w-[19rem] text-sm font-medium leading-6 text-slate-500">{text}</p>
      <div className="mt-7">{visual}</div>
    </article>
  );
}

function RepliesVisual() {
  return (
    <div className="flex items-center gap-5 rounded-[1rem] border border-slate-100 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[conic-gradient(#3478ff_0_78%,#e8f0ff_78%_100%)]">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-xl font-black text-[#3478ff]">
          ...
        </div>
      </div>
      <div>
        <p className="text-4xl font-black text-[#05070a]">128</p>
        <p className="text-sm font-bold text-slate-500">YES replies</p>
        <p className="mt-1 text-xs font-black text-[#22c55e]">+24% vs yesterday</p>
      </div>
    </div>
  );
}

function RevenueVisual() {
  return (
    <div>
      <div className="mb-3 w-fit rounded-[0.8rem] bg-white px-4 py-2 text-center shadow-[0_12px_32px_rgba(52,120,255,0.12)]">
        <p className="text-xs font-black text-[#3478ff]">Revenue saved</p>
        <p className="text-xl font-black">$8.3K</p>
        <p className="text-xs font-bold text-slate-400">This month</p>
      </div>
      <svg aria-hidden="true" className="h-24 w-full" fill="none" viewBox="0 0 360 120">
        <path
          d="M5 92 C45 88 55 70 85 75 C125 82 132 46 170 52 C208 58 214 34 252 38 C292 42 308 18 355 12"
          stroke="#3478ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <circle cx="252" cy="38" fill="#3478ff" r="7" />
      </svg>
    </div>
  );
}

function ManualVisual() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[
        ["Reviewed", "100%"],
        ["Confirmation", "72%"]
      ].map(([label, value]) => (
        <div
          className="rotate-[-2deg] rounded-[1rem] border border-slate-100 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] even:rotate-[3deg]"
          key={label}
        >
          <p className="text-xs font-black text-[#3478ff]">{label}</p>
          <div className="mt-4 grid h-20 place-items-center rounded-full bg-[conic-gradient(#3478ff_0_78%,#eef4ff_78%_100%)]">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-lg font-black">
              {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FillTimeVisual() {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-5xl font-black">18</p>
          <p className="-mt-2 text-lg font-black">min</p>
        </div>
        <p className="rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-black text-[#22c55e]">
          +22% faster this week
        </p>
      </div>
      <div className="mt-8 h-2.5 rounded-full bg-[#e8eef8]">
        <div className="relative h-2.5 w-[58%] rounded-full bg-[#3478ff]">
          <span className="absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-4 border-white bg-[#3478ff] shadow-md" />
        </div>
      </div>
      <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
        <span>0 min</span>
        <span>15 min</span>
        <span>30 min</span>
      </div>
    </div>
  );
}

function FilledSpotsVisual() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:justify-between">
      <div>
        <p className="text-5xl font-black">84</p>
        <p className="text-sm font-bold text-slate-500">filled spots</p>
        <p className="mt-2 text-xs font-black text-[#22c55e]">+18% this week</p>
      </div>
      <div className="grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(from_225deg,#3478ff_0_68%,#edf3ff_68%_100%)] p-5">
        <div className="h-24 w-24 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]" />
      </div>
    </div>
  );
}

function SetupSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-[72rem] rounded-[2.25rem] bg-[#f8fbff] px-5 py-16 text-center sm:px-10 sm:py-20">
        <span className="lunera-pill" data-lunera-reveal>
          {t.setup.tag}
        </span>
        <h2
          className="mx-auto mt-6 max-w-[48rem] text-4xl font-black leading-[1.02] text-[#05070a] sm:text-5xl"
          data-lunera-reveal
        >
          {t.setup.title.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </h2>
        <p
          className="mx-auto mt-6 max-w-[44rem] text-base font-medium leading-7 text-slate-500"
          data-lunera-reveal
        >
          {t.setup.subtitle}
        </p>
        <div className="open-spot-setup-arc mx-auto mt-14 grid max-w-[60rem] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.setup.steps.map((step, index) => (
            <article
              className="relative z-10 rounded-[1.25rem] border border-slate-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-300 ease-out hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(52,120,255,0.16)]"
              data-lunera-reveal
              key={step}
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf5ff] text-lg font-black text-[#3478ff]">
                {index + 1}
              </div>
              <p className="mt-4 text-sm font-black leading-5 text-[#111827]">{step}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 py-20 sm:py-28" id="how-it-works">
      <div className="mx-auto grid max-w-[72rem] gap-10 border-l-4 border-[#141414] pl-6 sm:pl-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <span className="lunera-pill" data-lunera-reveal>
            {t.how.tag}
          </span>
          <h2
            className="mt-8 max-w-[21rem] text-4xl font-black leading-[1.02] text-[#05070a] sm:text-5xl"
            data-lunera-reveal
          >
            {t.how.title.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h2>
        </div>
        <div className="grid gap-6">
          {t.how.steps.map((step, index) => (
            <article className="open-spot-step-card" data-lunera-reveal key={step.number}>
              <div className="flex gap-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-xl font-black text-[#3478ff]">
                  {index === 0 ? "!" : index === 1 ? "2" : "✓"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-black text-[#05070a]">{step.title}</h3>
                  <p className="mt-2 max-w-[25rem] text-sm font-medium leading-6 text-slate-500">
                    {step.text}
                  </p>
                  <StepMiniUi index={index} />
                </div>
              </div>
              <span className="absolute bottom-5 right-5 text-sm font-black text-slate-300">
                {step.number}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepMiniUi({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="mt-6 rounded-[1rem] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="rounded-[0.8rem] bg-[#f8fbff] p-4">
          <p className="text-xs font-black text-[#3478ff]">Spot opening detected</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Tomorrow at 10:00 AM</p>
        </div>
        <div className="mt-3 rounded-[0.8rem] border border-slate-100 p-4">
          <span className="block h-3 w-4/5 rounded-full bg-slate-200" />
          <span className="mt-3 block h-3 w-3/5 rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="mt-6 rounded-[1rem] border border-slate-100 bg-white p-4 shadow-sm">
        {[
          ["SM", "Sarah M.", "Best match"],
          ["JL", "Jamie L.", "Good match"],
          ["MC", "Maria C.", "Review"]
        ].map(([initials, name, status]) => (
          <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0" key={name}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[0.65rem] font-black text-slate-500">
              {initials}
            </span>
            <span className="flex-1 text-xs font-black text-slate-700">{name}</span>
            <span className="rounded-full bg-[#f4f7ff] px-3 py-1 text-[0.62rem] font-black text-[#3478ff]">
              {status}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[1rem] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
          SM
        </span>
        <div>
          <p className="text-sm font-black text-slate-800">Sarah M.</p>
          <p className="text-xs font-bold text-slate-400">May 14 - 10:00 AM - 60 min Facial</p>
        </div>
      </div>
      <button
        className="mt-4 min-h-11 w-full rounded-[0.8rem] bg-[#3478ff] text-sm font-black text-white"
        type="button"
      >
        Confirm Sarah
      </button>
    </div>
  );
}

function WorkflowPreview({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-white px-4 py-20 sm:py-28">
      <div className="mx-auto grid max-w-[72rem] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div data-lunera-reveal>
          <span className="lunera-pill">{t.workflow.tag}</span>
          <h2 className="mt-7 max-w-[33rem] text-4xl font-black leading-[1.04] text-[#05070a] sm:text-5xl">
            {t.workflow.title}
          </h2>
          <p className="mt-5 max-w-[34rem] text-base font-medium leading-7 text-slate-500">
            {t.workflow.text}
          </p>
          <div className="mt-8 grid gap-3 text-sm font-bold text-slate-600">
            <p>Consent-based SMS alerts</p>
            <p>Ranked reply queue for review</p>
            <p>Manual confirmation before any appointment is filled</p>
          </div>
        </div>
        <div className="relative" data-lunera-reveal>
          <div className="rounded-[2rem] border border-slate-100 bg-[#f8fbff] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.07)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-black uppercase text-[#3478ff]">Open Spot queue</p>
                  <p className="mt-1 text-xl font-black text-[#05070a]">New cancellation</p>
                </div>
                <span className="rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-black text-[#22c55e]">
                  7 replies
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {["Sarah M.", "Mike R.", "Jessica T."].map((name, index) => (
                  <div
                    className="flex items-center gap-3 rounded-[1rem] border border-slate-100 p-4"
                    key={name}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef4ff] text-xs font-black text-[#3478ff]">
                      {name.slice(0, 1)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800">{name}</p>
                      <p className="text-xs font-bold text-slate-400">
                        {index === 0 ? "Best match" : index === 1 ? "90% match" : "80% match"}
                      </p>
                    </div>
                    <button
                      className="rounded-full bg-black px-3 py-1 text-xs font-black text-white"
                      type="button"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -right-3 top-8 hidden rounded-full bg-black px-4 py-2 text-xs font-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] sm:block">
            You stay in control
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing({ t }: { t: TemplateCopy }) {
  return (
    <TemplateSection id="pricing">
      <SectionHeading tag={t.pricing.tag} title={t.pricing.title} />
      <div className="mx-auto mt-14 grid max-w-[72rem] gap-5 lg:grid-cols-3">
        {t.pricing.cards.map((card) => (
          <article
            className={cn(
              "open-spot-pricing-card lunera-card flex min-h-[31rem] flex-col p-7",
              card.featured &&
                "scale-[1.02] border-[#3478ff] shadow-[0_28px_80px_rgba(52,120,255,0.2)]"
            )}
            data-lunera-reveal
            key={card.title}
          >
            {"badge" in card ? (
              <span className="mb-5 w-fit rounded-full bg-[#3478ff] px-3 py-1 text-xs font-black text-white">
                {card.badge}
              </span>
            ) : null}
            <h3 className="text-3xl font-black text-[#05070a]">{card.title}</h3>
            <p className="mt-3 min-h-14 text-sm font-medium leading-6 text-slate-500">
              {card.text}
            </p>
            <p className="mt-7 border-t border-slate-100 pt-6 text-4xl font-black text-[#05070a]">
              {card.price}
            </p>
            <Link
              className={cn(
                "mt-6 inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 text-sm font-black transition hover:-translate-y-0.5",
                card.featured ? "bg-[#3478ff] text-white" : "bg-black text-white"
              )}
              href={card.href}
            >
              {card.cta}
            </Link>
            <ul className="mt-7 space-y-4">
              {card.features.map((feature) => (
                <li className="flex gap-3 text-sm font-bold leading-6 text-slate-600" key={feature}>
                  <span className="mt-0.5 text-[#22c55e]">✓</span>
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

function Testimonials({ t }: { t: TemplateCopy }) {
  return (
    <section className="bg-[#f8fbff] px-4 py-20 sm:py-28">
      <SectionHeading subtitle={t.testimonials.text} title={t.testimonials.title} />
      <div className="mx-auto mt-12 grid max-w-[72rem] gap-5 md:grid-cols-2">
        {t.testimonials.cards.map(([initials, role, quote]) => (
          <article
            className="lunera-card p-6 transition duration-300 ease-out hover:-translate-y-2 hover:border-blue-200 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]"
            data-lunera-reveal
            key={role}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#3478ff] text-sm font-black text-white">
                {initials}
              </span>
              <div>
                <h3 className="text-base font-black text-[#05070a]">{role}</h3>
                <p className="text-xs font-bold text-slate-400">Appointment-based team</p>
              </div>
            </div>
            <p className="mt-6 text-base font-medium leading-8 text-slate-600">{quote}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Faq({ t }: { t: TemplateCopy }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-white px-4 py-20 sm:py-28" id="faq">
      <div className="mx-auto grid max-w-[72rem] gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <span className="lunera-pill" data-lunera-reveal>
            {t.faq.tag}
          </span>
          <h2
            className="mt-7 max-w-[29rem] text-4xl font-black leading-tight text-[#05070a] sm:text-5xl"
            data-lunera-reveal
          >
            {t.faq.title}
          </h2>
          <p className="mt-5 max-w-md text-base font-medium leading-7 text-slate-500" data-lunera-reveal>
            {t.faq.text}
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-[#f8fafc] p-3" data-lunera-reveal>
          {t.faq.items.map(([question, answer], index) => {
            const isOpen = index === openIndex;

            return (
              <div className="border-b border-white last:border-b-0" key={question}>
                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-5 rounded-[1rem] bg-white px-5 py-5 text-left text-base font-black text-[#05070a] transition hover:bg-[#f7fbff]"
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
        <Link className="lunera-cta-light mt-9" href={loginHref}>
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
  if (normalized === "how it works") return "#how-it-works";
  if (normalized === "pricing") return "#pricing";
  if (normalized === "contact") return "/contact";
  if (normalized === "support") return "/contact";
  if (normalized === "privacy") return "/privacy";
  if (normalized === "terms") return "/terms";
  if (normalized === "sms consent") return "/privacy";

  return "/";
}

function TemplateSection({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <section className="bg-white px-4 py-20 sm:py-28" id={id}>
      {children}
    </section>
  );
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
