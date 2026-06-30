"use client";

import Link from "next/link";

import { BookCallRequestForm } from "@/components/marketing/book-call-request-form";
import type { BookCallRequestLocale } from "@/lib/book-call/validation";

type BookingKind = "ready" | "questions";

const bookingCopy = {
  fr: {
    nav: {
      home: "Accueil"
    },
    eyebrow: "APPEL OPEN SPOT",
    titleLine1: "Parlons de vos",
    titleLine2: "annulations.",
    subtitle:
      "Laissez vos coordonnées et dites-nous brièvement comment votre commerce fonctionne. On vous recontacte pour voir comment Open Spot peut vous aider à récupérer des rendez-vous perdus.",
    contextTitle: "Ce que l’appel sert à clarifier",
    context: [
      { label: "Votre volume d’annulations", icon: "chart" as const },
      { label: "Votre système de rendez-vous actuel", icon: "calendar" as const },
      { label: "Votre liste client ou liste d’attente", icon: "users" as const },
      { label: "Vos besoins de suivi SMS et email", icon: "message" as const }
    ]
  },
  en: {
    nav: {
      home: "Home"
    },
    eyebrow: "OPEN SPOT CALL",
    titleLine1: "Let's talk about your",
    titleLine2: "cancellations.",
    subtitle:
      "Leave your details and briefly tell us how your business works. We'll follow up to see how Open Spot can help recover lost appointments.",
    contextTitle: "What the call clarifies",
    context: [
      { label: "Your cancellation volume", icon: "chart" as const },
      { label: "Your current booking system", icon: "calendar" as const },
      { label: "Your customer or waitlist setup", icon: "users" as const },
      { label: "Your SMS and email follow-up needs", icon: "message" as const }
    ]
  }
} as const;

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M19 12H5M5 12L11 6M5 12L11 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="#07142F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function ContextIcon({ type }: { type: "chart" | "calendar" | "users" | "message" }) {
  const common = {
    className: "h-[17px] w-[17px]",
    fill: "none",
    viewBox: "0 0 24 24"
  };

  if (type === "chart") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="#2563FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (type === "calendar") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect
          height="18"
          rx="2"
          stroke="#2563FF"
          strokeWidth="2"
          width="18"
          x="3"
          y="4"
        />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="#2563FF" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "users") {
    return (
      <svg aria-hidden="true" {...common}>
        <path
          d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
          stroke="#2563FF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="#2563FF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function OpenSpotBookingPage({
  initialLocale = "fr"
}: {
  kind: BookingKind;
  initialLocale?: BookCallRequestLocale;
}) {
  const t = bookingCopy[initialLocale];

  return (
    <main className="min-h-screen bg-[#F8FBFF] text-[#07142F]">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-6 md:px-10 lg:px-[88px] lg:py-[52px]">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-[104px] xl:gap-[112px]">
          <div className="max-w-[560px]">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563FF] transition hover:text-[#1D4ED8]"
              href="/"
            >
              <ArrowLeftIcon />
              {t.nav.home}
            </Link>

            <p className="mt-10 text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#2563FF] sm:mt-12 sm:text-sm">
              {t.eyebrow}
            </p>

            <h1 className="mt-5 text-[clamp(2.375rem,5.5vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#07142F]">
              {t.titleLine1}
              <br />
              {t.titleLine2}
            </h1>

            <p className="mt-6 max-w-[540px] text-[clamp(1.0625rem,1.6vw,1.3125rem)] font-normal leading-[1.62] text-[#50617D]">
              {t.subtitle}
            </p>

            <section className="mt-10 rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:mt-12 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF]">
                  <PhoneIcon />
                </span>
                <h2 className="text-[1.25rem] font-extrabold leading-tight tracking-[-0.02em] text-[#07142F]">
                  {t.contextTitle}
                </h2>
              </div>

              <ul className="mt-5 overflow-hidden rounded-[14px] border border-[#E2E8F0]">
                {t.context.map((item, index) => (
                  <li
                    className={`flex min-h-[66px] items-center gap-3 bg-white px-4 py-3 sm:px-5 ${
                      index > 0 ? "border-t border-[#E2E8F0]" : ""
                    }`}
                    key={item.label}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF]">
                      <ContextIcon type={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-[#07142F]">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="w-full lg:pt-0" id="request-call">
            <BookCallRequestForm locale={initialLocale} />
          </div>
        </div>
      </div>
    </main>
  );
}
