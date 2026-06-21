"use client";

import Link from "next/link";
import { useState } from "react";

import { BookCallRequestForm } from "@/components/marketing/book-call-request-form";
import type { BookCallRequestLocale } from "@/lib/book-call/validation";

type BookingKind = "ready" | "questions";

const bookingCopy = {
  fr: {
    nav: {
      switchLabel: "FR / EN",
      home: "Accueil",
      call: "Demander un appel"
    },
    eyebrow: "Appel Open Spot",
    title: "Parlons de vos annulations.",
    subtitle:
      "Laissez vos coordonnées et dites-nous brièvement comment votre commerce fonctionne. On vous recontacte pour voir comment Open Spot peut vous aider à récupérer des rendez-vous perdus.",
    contextTitle: "Ce que l’appel sert à clarifier",
    context: [
      "Votre volume d’annulations",
      "Votre système de rendez-vous actuel",
      "Votre liste client ou liste d’attente",
      "Vos besoins de suivi SMS et email"
    ],
    controlTitle: "Le commerce garde le contrôle",
    control:
      "Open Spot n’envoie aucun SMS marketing depuis ce formulaire et ne confirme jamais automatiquement le premier client qui répond.",
    readyNote:
      "Si vous êtes prêt à configurer Open Spot, donnez les mêmes informations et ajoutez vos disponibilités dans le message."
  },
  en: {
    nav: {
      switchLabel: "EN / FR",
      home: "Home",
      call: "Request a call"
    },
    eyebrow: "Open Spot call",
    title: "Let's talk about your cancellations.",
    subtitle:
      "Leave your details and briefly tell us how your business works. We'll follow up to see how Open Spot can help recover lost appointments.",
    contextTitle: "What the call clarifies",
    context: [
      "Your cancellation volume",
      "Your current booking system",
      "Your customer or waitlist setup",
      "Your SMS and email follow-up needs"
    ],
    controlTitle: "The business stays in control",
    control:
      "Open Spot sends no marketing SMS from this form and never automatically confirms the first client who replies.",
    readyNote:
      "If you are ready to configure Open Spot, use the same form and add your availability in the message."
  }
} as const;

export function OpenSpotBookingPage({ kind }: { kind: BookingKind }) {
  const [locale, setLocale] = useState<BookCallRequestLocale>("fr");
  const t = bookingCopy[locale];

  return (
    <>
      <header className="border-b border-white/70 bg-[#fbfaf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            className="rounded-md text-base font-black text-[#14262e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
            href="/"
          >
            Open Spot
          </Link>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[#d8e3df] bg-white px-3 py-2 text-xs font-bold text-[#254047] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              onClick={() => setLocale((current) => (current === "fr" ? "en" : "fr"))}
              type="button"
            >
              {t.nav.switchLabel}
            </button>
            <Link className="os-primary-cta min-h-10 px-4 py-2 text-sm" href="#request-call">
              {t.nav.call}
            </Link>
          </div>
        </div>
      </header>
      <main className="min-h-screen bg-[linear-gradient(180deg,#fbfaf7_0%,#f3f8f5_48%,#ffffff_100%)] text-[#14262e]">
        <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-16">
          <div className="pt-2">
            <Link
              className="text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-strong)]"
              href="/"
            >
              {"<-"} {t.nav.home}
            </Link>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-[var(--primary)]">
              {t.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-[#14262e] sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              {t.subtitle}
            </p>

            <div className="mt-8 grid gap-4">
              <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm">
                <h2 className="text-xl font-black tracking-tight text-[#14262e]">
                  {t.contextTitle}
                </h2>
                <ul className="mt-4 grid gap-3">
                  {t.context.map((item) => (
                    <li
                      className="rounded-2xl border border-[#e1e9e5] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#14262e]"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-[1.75rem] border border-[#c4ddd5] bg-[#edf7f4] p-5 shadow-sm">
                <h2 className="text-xl font-black tracking-tight text-[#14262e]">
                  {t.controlTitle}
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-[var(--muted)]">
                  {kind === "ready" ? `${t.control} ${t.readyNote}` : t.control}
                </p>
              </section>
            </div>
          </div>

          <div id="request-call">
            <BookCallRequestForm locale={locale} />
          </div>
        </section>
      </main>
    </>
  );
}
