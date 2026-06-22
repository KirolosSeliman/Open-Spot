import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

const bookingFlowCopy = {
  en: {
    eyebrow: "Why Open Spot",
    title: ["Works with the booking", "flow you already use."],
    description: [
      "Open Spot fits around your existing appointment workflow so your team",
      "can fill last-minute cancellations without changing how clients already book."
    ],
    cards: [
      {
        id: "migration",
        icon: <CalendarIcon />,
        lines: ["No migration", "needed"]
      },
      {
        id: "cancellations",
        icon: <BellIcon />,
        lines: ["Built for", "cancellations"]
      },
      {
        id: "sms",
        icon: <ChatDotsIcon />,
        lines: ["Clients reply", "by SMS"]
      },
      {
        id: "control",
        icon: <ShieldCheckLineIcon />,
        lines: ["You stay in", "control"]
      }
    ]
  },
  fr: {
    eyebrow: "Pourquoi Open Spot",
    title: ["Fonctionne avec le flux de réservation que vous utilisez déjà."],
    description: [
      "Open Spot s’ajoute à votre fonctionnement actuel pour aider votre équipe",
      "à remplir les annulations de dernière minute sans changer la façon dont vos clients réservent."
    ],
    cards: [
      {
        id: "migration",
        icon: <CalendarIcon />,
        lines: ["Aucune migration", "nécessaire"]
      },
      {
        id: "cancellations",
        icon: <BellIcon />,
        lines: ["Conçu pour les", "annulations"]
      },
      {
        id: "sms",
        icon: <ChatDotsIcon />,
        lines: ["Les clients répondent", "par SMS"]
      },
      {
        id: "control",
        icon: <ShieldCheckLineIcon />,
        lines: ["Vous gardez le", "contrôle"]
      }
    ]
  }
} as const;

type BookingFlowCopy = (typeof bookingFlowCopy)[Locale];
type BookingFlowCard = BookingFlowCopy["cards"][number];

export function BookingFlowSection({ locale }: { locale: Locale }) {
  const t = bookingFlowCopy[locale];

  return (
    <section
      aria-labelledby="why-open-spot-title"
      className="open-spot-booking-flow-section relative isolate overflow-hidden px-4 py-24 text-[#071126] sm:px-6 lg:py-32"
    >
      <div className="open-spot-booking-flow-dome" aria-hidden="true" />

      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="open-spot-booking-flow-eyebrow">{t.eyebrow}</p>
          <h2 className="open-spot-booking-flow-title" id="why-open-spot-title">
            {t.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="open-spot-booking-flow-description">
            {t.description.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>

        <div className="open-spot-booking-flow-stage hidden lg:block">
          {t.cards.map((card) => (
            <BookingFlowFloatingCard
              card={card}
              className={`open-spot-booking-flow-card--${card.id}`}
              key={card.id}
            />
          ))}
        </div>

        <div className="open-spot-booking-flow-mobile-grid mx-auto mt-14 grid max-w-xl grid-cols-2 gap-4 lg:hidden">
          {t.cards.map((card) => (
            <BookingFlowCardView card={card} key={card.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingFlowFloatingCard({
  card,
  className
}: {
  card: BookingFlowCard;
  className: string;
}) {
  return <BookingFlowCardView card={card} className={className} />;
}

function BookingFlowCardView({
  card,
  className
}: {
  card: BookingFlowCard;
  className?: string;
}) {
  return (
    <article className={cn("open-spot-booking-flow-card", className)}>
      <span className="open-spot-booking-flow-card-icon" aria-hidden="true">
        {card.icon}
      </span>
      <p>
        {card.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
    </article>
  );
}

function CalendarIcon() {
  return (
    <svg fill="none" viewBox="0 0 48 48">
      <path d="M14 9.5v6" stroke="currentColor" strokeLinecap="round" strokeWidth="3.1" />
      <path d="M34 9.5v6" stroke="currentColor" strokeLinecap="round" strokeWidth="3.1" />
      <path
        d="M11.5 14h25A5.5 5.5 0 0 1 42 19.5v18A5.5 5.5 0 0 1 36.5 43h-25A5.5 5.5 0 0 1 6 37.5v-18A5.5 5.5 0 0 1 11.5 14Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.1"
      />
      <path d="M7 24h34" stroke="currentColor" strokeLinecap="round" strokeWidth="3.1" />
      <path d="M15 31h5M28 31h5M15 37h5" stroke="currentColor" strokeLinecap="round" strokeWidth="3.1" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg fill="none" viewBox="0 0 48 48">
      <path
        d="M15 35.5h18.5c2.5 0 3.7-3.1 1.9-4.9-2.1-2.2-3-5.1-3-9.5 0-5.4-3.4-9.6-8.4-9.6s-8.4 4.2-8.4 9.6c0 4.4-.9 7.3-3 9.5-1.8 1.8-.6 4.9 2.4 4.9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.1"
      />
      <path d="M20.5 39.5c.7 1.8 2 2.9 3.5 2.9s2.8-1.1 3.5-2.9" stroke="currentColor" strokeLinecap="round" strokeWidth="3.1" />
    </svg>
  );
}

function ChatDotsIcon() {
  return (
    <svg fill="none" viewBox="0 0 48 48">
      <path
        d="M24 8.5c-9.7 0-16.8 6-16.8 13.8 0 4.1 1.9 7.7 5.1 10.2l-1.2 6.2 6.5-3.2c2 .6 4.2.9 6.4.9 9.7 0 16.8-6.1 16.8-14.1S33.7 8.5 24 8.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.1"
      />
      <path d="M18 23.2h.1M24 23.2h.1M30 23.2h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="4.4" />
    </svg>
  );
}

function ShieldCheckLineIcon() {
  return (
    <svg fill="none" viewBox="0 0 48 48">
      <path
        d="M24 6.5 38 11v10.5c0 9-5.5 15.4-14 18.9C15.5 36.9 10 30.5 10 21.5V11l14-4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.1"
      />
      <path d="m18.4 23.9 3.7 3.8 7.9-8.1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.1" />
    </svg>
  );
}
