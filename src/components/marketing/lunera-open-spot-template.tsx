"use client";

import Image from "next/image";
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
      "Open Spot helps you capture interest, notify at the right time, and recover more revenue - with less work."
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
    ]
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
        question: "Are clients confirmed automatically?",
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
          "Replies are collected in one place so your team does not have to manage scattered text messages manually. You can review who replied, compare timing or fit, and then confirm the right client. This prevents the first reply from automatically taking the spot when another client may be a better match."
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
      <HeroPhoneMockup />
      <div className="lunera-hero-lower-content">
        <HeroSocialProof label={t.hero.socialProof} />
        <HeroCtaRow t={t} />
        <CategoryStrip items={t.hero.categories} />
      </div>
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

function MetricsSection({ t }: { t: TemplateCopy }) {
  return (
    <section className="open-spot-metrics-section bg-white px-4 pb-20 pt-24 sm:pb-24 sm:pt-24">
      <div className="open-spot-metrics-heading mx-auto max-w-[48rem] text-center">
        <h2 className="open-spot-metrics-title" data-lunera-reveal>
          {t.metrics.title.map((line) => (
            <span className="block" key={line}>
              {line}
            </span>
          ))}
        </h2>
        <p className="mx-auto mt-5 max-w-[42rem] text-base font-medium leading-7 text-slate-500" data-lunera-reveal>
          {t.metrics.subtitle}
        </p>
      </div>
      <div className="open-spot-metrics-grid mx-auto mt-10 grid max-w-[78rem] gap-6 lg:grid-cols-12">
        <DashboardCard
          className="lg:col-span-4"
          size="top"
          text="See who replied YES as soon as your waitlist responds."
          title="Real-Time Replies"
          visual={<RepliesVisual />}
        />
        <DashboardCard
          className="lg:col-span-4"
          size="top"
          text="Track how much revenue is recovered from filled last-minute openings."
          title="Revenue Saved"
          visual={<RevenueVisual />}
        />
        <DashboardCard
          className="lg:col-span-4"
          size="top"
          text="Your team chooses who gets the appointment. No one is confirmed without review."
          title="Manual Confirmation"
          visual={<ManualVisual />}
        />
        <DashboardCard
          className="open-spot-dashboard-card--fill-time lg:col-span-6"
          size="wide"
          text="See how quickly last-minute openings are filled after your SMS goes out."
          title="Average Fill Time"
          visual={<FillTimeVisual />}
        />
        <DashboardCard
          className="open-spot-dashboard-card--gauge lg:col-span-6"
          size="wide"
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
  size,
  text,
  title,
  visual
}: {
  className?: string;
  size: "top" | "wide";
  text: string;
  title: string;
  visual: ReactNode;
}) {
  const sizeClass =
    size === "wide" ? "open-spot-dashboard-card--wide" : "open-spot-dashboard-card--top";

  return (
    <article
      className={cn(
        "open-spot-dashboard-card group flex flex-col",
        sizeClass,
        className
      )}
      data-lunera-reveal
    >
      <h3 className="open-spot-dashboard-title">{title}</h3>
      <p className="open-spot-dashboard-copy">{text}</p>
      <div className="open-spot-dashboard-visual">{visual}</div>
    </article>
  );
}

function RepliesVisual() {
  return (
    <div className="open-spot-replies-mini">
      <div className="open-spot-replies-donut">
        <div className="open-spot-replies-donut-core">
          ...
        </div>
      </div>
      <div>
        <p className="open-spot-card-number">128</p>
        <p className="open-spot-card-label">YES replies</p>
        <p className="open-spot-card-positive">+24% vs yesterday</p>
      </div>
    </div>
  );
}

function RevenueVisual() {
  return (
    <div className="open-spot-revenue-visual">
      <div className="open-spot-revenue-badge">
        <p className="text-xs font-black text-[#3478ff]">Revenue saved</p>
        <p className="text-xl font-black">$8.3K</p>
        <p className="text-xs font-bold text-slate-400">This month</p>
      </div>
      <svg aria-hidden="true" className="open-spot-revenue-chart" fill="none" viewBox="0 0 360 120">
        <path d="M8 68 H352" stroke="#e8eef8" strokeDasharray="3 6" />
        <path d="M252 26 V112" stroke="#d8e3f4" />
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
    <div className="open-spot-manual-visual">
      {[
        ["Reviewed", "100%"],
        ["Confirmation", "72%"]
      ].map(([label, value]) => (
        <div
          className="open-spot-manual-mini"
          key={label}
        >
          <p className="text-xs font-black text-[#3478ff]">{label}</p>
          <div className="open-spot-manual-donut">
            <div className="open-spot-manual-core">
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
    <div className="open-spot-fill-time-visual">
      <div className="open-spot-fill-time-row">
        <div>
          <p className="open-spot-fill-number">18 <span>min</span></p>
        </div>
        <p className="open-spot-card-positive open-spot-fill-pill">
          ↓ 22% faster this week
        </p>
      </div>
      <div className="open-spot-fill-slider">
        <div className="open-spot-fill-slider-active">
          <span />
        </div>
      </div>
      <div className="open-spot-fill-labels">
        <span>0 min</span>
        <span>15 min</span>
        <span>30 min</span>
      </div>
    </div>
  );
}

function FilledSpotsVisual() {
  return (
    <div className="open-spot-filled-spots-visual">
      <div className="open-spot-gauge">
        <div className="open-spot-gauge-ticks" aria-hidden="true">
          {Array.from({ length: 34 }).map((_, index) => (
            <span
              className={cn("open-spot-gauge-tick", index < 25 && "is-active")}
              key={index}
              style={{ "--tick-index": index } as CSSProperties}
            />
          ))}
        </div>
        <div className="open-spot-gauge-center">
          <p>84</p>
          <span>filled spots</span>
          <strong>↑ 18% this week</strong>
        </div>
      </div>
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
              <StepMiniUi index={index} />
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

function StepMiniUi({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="open-spot-how-mockup open-spot-how-alert-mockup">
        <div className="open-spot-how-alert-row">
          <span className="open-spot-how-alert-dot" aria-hidden="true">
            <StepIcon index={0} />
          </span>
          <div>
            <p>Spot opening detected</p>
            <span>Tomorrow at 10:00 AM</span>
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
          ["SM", "Sarah M.", "Best match"],
          ["JL", "Jamie L.", "Good match"],
          ["MC", "Maria C.", "Review"]
        ].map(([initials, name, status]) => (
          <div className="open-spot-how-reply-row" key={name}>
            <span className="open-spot-how-initials">
              {initials}
            </span>
            <span className="open-spot-how-reply-name">{name}</span>
            <span className={cn("open-spot-how-reply-badge", status === "Review" && "is-neutral")}>
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
          <span>May 14 · 10:00 AM · 60 min Facial</span>
        </div>
      </div>
      <button
        className="open-spot-how-confirm-button"
        type="button"
      >
        <span aria-hidden="true">✓</span>
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
