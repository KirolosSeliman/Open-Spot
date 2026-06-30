import type { ReactNode } from "react";

import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

const showcaseCopy = {
  en: {
    nav: {
      features: "Features",
      how: "How it works",
      pricing: "Pricing",
      contact: "Contact",
      login: "Log in"
    },
    srTitle: "Open Spot metrics overview",
    metrics: {
      replies: {
        title: "Real-Time Replies",
        text: "See who replied YES as soon as your waitlist responds.",
        value: "12",
        label: "people replied"
      },
      revenue: {
        title: "Revenue Saved",
        text: "Track how much revenue is recovered from filled last-minute openings.",
        value: "$8.3K",
        label: "This month"
      },
      manual: {
        title: "Manual Confirmation",
        text: "Your team chooses who gets the appointment.\nNo one is confirmed without review.",
        label: "Confirmation",
        value: "72%"
      },
      fillTime: {
        title: "Average Fill Time",
        text: "See how quickly last-minute openings are filled after your SMS goes out.",
        value: "18",
        unit: "min",
        improvement: "22% faster this week"
      },
      filled: {
        title: "Successfully Filled Spots",
        text: "Track the number of cancelled appointments you've successfully filled.",
        value: "84",
        label: "filled spots",
        improvement: "18% this week"
      }
    }
  },
  fr: {
    nav: {
      features: "Fonctionnalités",
      how: "Comment ça marche",
      pricing: "Tarifs",
      contact: "Contact",
      login: "Se connecter"
    },
    srTitle: "Vue d'ensemble des métriques Open Spot",
    metrics: {
      replies: {
        title: "Réponses en temps réel",
        text: "Voyez qui a répondu OUI dès que votre liste d’attente réagit.",
        value: "12",
        label: "personnes ont répondu"
      },
      revenue: {
        title: "Revenu récupéré",
        text: "Suivez le revenu récupéré grâce aux créneaux de dernière minute remplis.",
        value: "8,3 k$",
        label: "Ce mois-ci"
      },
      manual: {
        title: "Confirmation manuelle",
        text: "Votre équipe choisit qui obtient le rendez-vous.\nPersonne n’est confirmé sans vérification.",
        label: "Confirmation",
        value: "72 %"
      },
      fillTime: {
        title: "Temps moyen de remplissage",
        text: "Voyez à quelle vitesse les créneaux de dernière minute sont remplis après l’envoi du SMS.",
        value: "18",
        unit: "min",
        improvement: "22 % plus rapide cette semaine"
      },
      filled: {
        title: "Créneaux remplis avec succès",
        text: "Suivez le nombre de rendez-vous annulés que vous avez réussi à remplir.",
        value: "84",
        label: "créneaux remplis",
        improvement: "18 % cette semaine"
      }
    }
  }
} as const;

export function OpenSpotMetricsShowcase({ locale }: { locale: Locale }) {
  const t = showcaseCopy[locale];

  return (
    <section
      aria-labelledby="open-spot-metrics-showcase-title"
      className="open-spot-metrics-showcase-page bg-white px-4 text-[#071126]"
      id="metrics-showcase"
    >
      <div className="open-spot-metrics-main mx-auto w-full max-w-[1240px] px-2 sm:px-6">
        <h2 className="sr-only" id="open-spot-metrics-showcase-title">
          {t.srTitle}
        </h2>
        <div className="open-spot-metrics-grid grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
          <MetricCard
            className="open-spot-metric-card--top xl:col-span-4"
            icon={<ChatIcon />}
            text={t.metrics.replies.text}
            title={t.metrics.replies.title}
          >
            <div className="open-spot-replies-figure">
              <p>{t.metrics.replies.value}</p>
              <span>{t.metrics.replies.label}</span>
            </div>
          </MetricCard>

          <MetricCard
            className="open-spot-metric-card--top xl:col-span-4"
            icon={<GrowthIcon />}
            text={t.metrics.revenue.text}
            title={t.metrics.revenue.title}
          >
            <RevenueLineChart label={t.metrics.revenue.label} value={t.metrics.revenue.value} />
          </MetricCard>

          <MetricCard
            className="open-spot-metric-card--top xl:col-span-4"
            icon={<ShieldCheckIcon />}
            text={t.metrics.manual.text}
            title={t.metrics.manual.title}
          >
            <div className="open-spot-confirmation-mini-card">
              <p>{t.metrics.manual.label}</p>
              <ConfirmationRing value={t.metrics.manual.value} />
            </div>
          </MetricCard>

          <MetricCard
            className="open-spot-metric-card--wide xl:col-span-6"
            icon={<ClockIcon />}
            text={t.metrics.fillTime.text}
            title={t.metrics.fillTime.title}
          >
            <AverageFillTimeVisual
              improvement={t.metrics.fillTime.improvement}
              unit={t.metrics.fillTime.unit}
              value={t.metrics.fillTime.value}
            />
          </MetricCard>

          <MetricCard
            className="open-spot-metric-card--wide open-spot-filled-card xl:col-span-6"
            icon={<CircleCheckIcon />}
            text={t.metrics.filled.text}
            title={t.metrics.filled.title}
          >
            <FilledSpotsGauge
              improvement={t.metrics.filled.improvement}
              label={t.metrics.filled.label}
              value={t.metrics.filled.value}
            />
          </MetricCard>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  children,
  className,
  icon,
  text,
  title
}: {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <article className={cn("open-spot-metric-card", className)}>
      <div className="open-spot-metric-card-heading">
        <span className="open-spot-metric-icon" aria-hidden="true">
          {icon}
        </span>
        <h2>{title}</h2>
      </div>
      <p className="open-spot-metric-description">
        {text.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <div className="open-spot-metric-visual">{children}</div>
    </article>
  );
}

function RevenueLineChart({ label, value }: { label: string; value: string }) {
  return (
    <div className="open-spot-revenue-line-visual">
      <div className="open-spot-revenue-tooltip">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      <svg aria-hidden="true" className="open-spot-revenue-line-chart" viewBox="0 0 420 170">
        <defs>
          <linearGradient id="open-spot-revenue-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f78ff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#2f78ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M18 128 C52 121 70 105 102 101 C134 97 146 106 180 96 C214 86 226 70 260 69 C300 68 306 82 342 70 C370 61 384 44 408 38 L408 154 L18 154 Z"
          fill="url(#open-spot-revenue-area)"
        />
        <path d="M20 86 H400" stroke="#dbe4f1" strokeDasharray="3 8" />
        <path d="M268 30 V152" stroke="#dbe4f1" strokeDasharray="3 8" />
        <path
          d="M18 128 C52 121 70 105 102 101 C134 97 146 106 180 96 C214 86 226 70 260 69 C300 68 306 82 342 70 C370 61 384 44 408 38"
          fill="none"
          stroke="#2f78ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <circle cx="268" cy="69" fill="#2f78ff" r="8" />
        <circle cx="268" cy="69" fill="none" r="12" stroke="#ffffff" strokeWidth="5" />
      </svg>
    </div>
  );
}

function ConfirmationRing({ value }: { value: string }) {
  return (
    <div className="open-spot-confirmation-ring">
      <svg aria-hidden="true" viewBox="0 0 120 120">
        <circle className="open-spot-confirmation-ring-track" cx="60" cy="60" r="44" />
        <circle className="open-spot-confirmation-ring-value" cx="60" cy="60" r="44" />
      </svg>
      <strong>{value}</strong>
    </div>
  );
}

function AverageFillTimeVisual({
  improvement,
  unit,
  value
}: {
  improvement: string;
  unit: string;
  value: string;
}) {
  return (
    <div className="open-spot-fill-time-panel">
      <div className="open-spot-fill-time-row">
        <p className="open-spot-fill-time-number">
          {value} <span>{unit}</span>
        </p>
        <span className="open-spot-green-pill">↓ {improvement}</span>
      </div>
      <div className="open-spot-fill-time-track" aria-hidden="true">
        <span />
      </div>
      <div className="open-spot-fill-time-labels" aria-hidden="true">
        <span>0 min</span>
        <span>15 min</span>
        <span>30 min</span>
      </div>
    </div>
  );
}

function FilledSpotsGauge({
  improvement,
  label,
  value
}: {
  improvement: string;
  label: string;
  value: string;
}) {
  const ticks = Array.from({ length: 42 }).map((_, index) => {
    const startAngle = -180;
    const endAngle = 0;
    const angle = startAngle + (index / 41) * (endAngle - startAngle);
    const radians = (angle * Math.PI) / 180;
    const outerRadius = 92;
    const innerRadius = 78;
    const center = 110;

    return {
      active: index < 30,
      x1: center + Math.cos(radians) * innerRadius,
      x2: center + Math.cos(radians) * outerRadius,
      y1: center + Math.sin(radians) * innerRadius,
      y2: center + Math.sin(radians) * outerRadius
    };
  });

  return (
    <div className="open-spot-filled-gauge-wrap">
      <svg aria-hidden="true" className="open-spot-filled-gauge" viewBox="0 0 220 120">
        {ticks.map((tick, index) => (
          <line
            className={cn("open-spot-filled-gauge-tick", tick.active && "is-active")}
            key={index}
            strokeLinecap="round"
            x1={tick.x1}
            x2={tick.x2}
            y1={tick.y1}
            y2={tick.y2}
          />
        ))}
      </svg>
      <div className="open-spot-filled-gauge-copy">
        <p>{value}</p>
        <span>{label}</span>
        <strong>↑ {improvement}</strong>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg fill="none" viewBox="0 0 32 32">
      <path d="M16 6.5c-6.25 0-10.8 3.95-10.8 9.2 0 2.95 1.42 5.48 3.78 7.12l-.9 4.18 4.45-2.38c1.08.24 2.25.36 3.47.36 6.25 0 10.8-3.95 10.8-9.28S22.25 6.5 16 6.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.1" />
    </svg>
  );
}

function GrowthIcon() {
  return (
    <svg fill="none" viewBox="0 0 32 32">
      <path d="M5.5 21.5 12 15l5 5 9.5-10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <path d="M20.5 9.5h6v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 32 32">
      <path d="M16 4.8 25 8v7.2c0 5.85-3.62 10.15-9 12-5.38-1.85-9-6.15-9-12V8l9-3.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
      <path d="m12.4 15.8 2.5 2.5 5-5.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg fill="none" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 10.5v6l4.1 2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function CircleCheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="m11.8 16.3 2.7 2.8 5.9-6.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}
