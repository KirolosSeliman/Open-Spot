"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";

type Locale = "fr" | "en";
type BookingKind = "ready" | "questions";

const bookingCopy = {
  fr: {
    nav: {
      switchLabel: "FR / EN",
      home: "Accueil",
      call: "Réserver un appel"
    },
    ready: {
      eyebrow: "Configuration",
      title: "Configurons Open Spot pour votre commerce.",
      subtitle:
        "Vous êtes prêt à récupérer vos annulations. L’appel sert à comprendre votre fonctionnement, vos services, votre liste client et la meilleure façon de connecter Open Spot à votre réalité.",
      primary: "Réserver mon appel de configuration",
      prepTitle: "Ce qu’on prépare ensemble",
      prep: [
        "Vos services",
        "Vos heures",
        "Votre liste client",
        "Vos règles de confirmation",
        "Votre volume d’annulations"
      ],
      whyTitle: "Pourquoi un appel avant de commencer ?",
      why: [
        "Chaque commerce a un fonctionnement différent",
        "L’installation doit être personnalisée",
        "On évite de mal envoyer des SMS",
        "On configure proprement consentement, messages et workflow",
        "Le commerce garde toujours le dernier mot sur la confirmation"
      ]
    },
    questions: {
      eyebrow: "Questions",
      title: "Vous avez des questions ? Parlons-en simplement.",
      subtitle:
        "On vous explique comment Open Spot fonctionne, si c’est adapté à votre commerce, et comment les alertes SMS peuvent aider à remplir vos annulations sans changer votre système actuel.",
      primary: "Réserver un appel découverte",
      prepTitle: "Questions fréquentes",
      prep: [
        "Est-ce que mes clients doivent installer une app ? Non, ils répondent par SMS.",
        "Est-ce que le premier qui répond est confirmé automatiquement ? Non, vous choisissez toujours qui confirmer.",
        "Est-ce que je dois changer mon logiciel de rendez-vous ? Non, Open Spot s’ajoute à votre système actuel.",
        "Comment fonctionne le consentement SMS ? On le clarifie avant d’envoyer des alertes.",
        "Est-ce adapté à mon commerce ? L’appel sert justement à le vérifier."
      ],
      whyTitle: "Ce que l’appel clarifie",
      why: [
        "Votre volume d’annulations",
        "Vos services les plus demandés",
        "Votre liste client ou liste d’attente",
        "La façon de garder la validation manuelle",
        "Le commerce garde toujours le dernier mot sur la confirmation"
      ]
    },
    fallback:
      "Aucun lien de réservation public n’est configuré pour le moment. Cette page explique l’intention de l’appel sans collecte automatique de données ici.",
    bookingReady:
      "Le lien public de réservation est configuré. Aucun script externe n’est intégré à cette page."
  },
  en: {
    nav: {
      switchLabel: "EN / FR",
      home: "Home",
      call: "Book a call"
    },
    ready: {
      eyebrow: "Setup",
      title: "Let’s configure Open Spot for your business.",
      subtitle:
        "You’re ready to recover cancellations. The call helps us understand your workflow, services, customer list, and the best way to connect Open Spot to your reality.",
      primary: "Book my setup call",
      prepTitle: "What we prepare together",
      prep: [
        "Your services",
        "Your hours",
        "Your customer list",
        "Your confirmation rules",
        "Your cancellation volume"
      ],
      whyTitle: "Why a call before getting started?",
      why: [
        "Every business works differently",
        "Setup should be personalized",
        "We avoid sending SMS the wrong way",
        "Consent, messages, and workflow are configured cleanly",
        "The business always keeps the final say on confirmation"
      ]
    },
    questions: {
      eyebrow: "Questions",
      title: "Have questions? Let’s talk simply.",
      subtitle:
        "We’ll explain how Open Spot works, whether it fits your business, and how SMS alerts can help fill cancellations without changing your current system.",
      primary: "Book a discovery call",
      prepTitle: "Frequently asked questions",
      prep: [
        "Do my customers need to install an app? No, they reply by SMS.",
        "Is the first person who replies automatically confirmed? No, you always choose who to confirm.",
        "Do I need to change my booking software? No, Open Spot fits beside your current system.",
        "How does SMS consent work? We clarify it before sending alerts.",
        "Is this right for my business? The call is meant to verify that."
      ],
      whyTitle: "What the call clarifies",
      why: [
        "Your cancellation volume",
        "Your most requested services",
        "Your customer or waitlist setup",
        "How to keep manual validation",
        "The business always keeps the final say on confirmation"
      ]
    },
    fallback:
      "No public booking link is configured yet. This page explains the call intent without automatically collecting data here.",
    bookingReady:
      "The public booking link is configured. No third-party script is embedded on this page."
  }
} as const;

export function OpenSpotBookingPage({ kind }: { kind: BookingKind }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const t = bookingCopy[locale];
  const page = t[kind];
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  const href = bookingUrl || "#booking-link-needed";

  return (
    <>
      <header className="border-b border-white/70 bg-[#fbfaf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link className="rounded-md text-base font-black text-[#14262e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]" href="/">
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
            <Link className="os-primary-cta min-h-10 px-4 py-2 text-sm" href={href} rel={bookingUrl ? "noreferrer" : undefined} target={bookingUrl ? "_blank" : undefined}>
              {t.nav.call}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-18">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="os-reveal">
            <Link className="text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-strong)]" href="/">
              ← {t.nav.home}
            </Link>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-[var(--primary)]">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-[#14262e] sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              {page.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="os-primary-cta" href={href} rel={bookingUrl ? "noreferrer" : undefined} target={bookingUrl ? "_blank" : undefined}>
                {page.primary}
              </Link>
              <Link className="os-secondary-cta" href="/">
                {t.nav.home}
              </Link>
            </div>
            <p className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm font-bold leading-6", bookingUrl ? "border-[#c4ddd5] bg-[#edf7f4] text-[var(--primary-strong)]" : "border-[#eadcc2] bg-[#fff7ed] text-[#8a4b11]")} id="booking-link-needed">
              {bookingUrl ? t.bookingReady : t.fallback}
            </p>
          </div>
          <div className="grid gap-4">
            <InfoPanel title={page.prepTitle} items={page.prep} />
            <InfoPanel title={page.whyTitle} items={page.why} accent />
          </div>
        </section>
      </main>
    </>
  );
}

function InfoPanel({
  title,
  items,
  accent = false
}: {
  title: string;
  items: readonly string[];
  accent?: boolean;
}) {
  return (
    <section className={cn("os-reveal rounded-[2rem] border border-white/70 bg-white/76 p-5 shadow-sm sm:p-7", accent && "bg-[#edf7f4]/80")}>
      <h2 className="text-2xl font-black tracking-tight text-[#14262e]">{title}</h2>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div className="rounded-2xl border border-[#e1e9e5] bg-white px-4 py-3 text-sm font-bold leading-6 text-[#14262e]" key={item}>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
