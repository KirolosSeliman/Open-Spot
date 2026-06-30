"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

type FloatingBadge = {
  label: string;
  tone: "dark" | "green";
};

type PhoneMetricCard = {
  eyebrow: string;
  title: string;
  value: string;
};

type PhoneReply = {
  initials: string;
  message: string;
  name: string;
  status: string;
  tone: "green" | "blue" | "neutral";
};

type SmsConversationPhoneCopy = {
  accessibilityLabel: string;
  businessName: string;
  cancellation: {
    service: string;
    time: string;
    title: string;
  };
  controls: {
    createOpening: string;
    menu: string;
  };
  floatingBadges: FloatingBadge[];
  metrics: {
    filled: PhoneMetricCard;
    revenue: PhoneMetricCard;
  };
  replies: {
    confirm: string;
    count: string;
    items: PhoneReply[];
    title: string;
    viewAll: string;
  };
  statusTime: string;
};

type PhoneMotion = {
  opacity: number;
  scale: number;
  translateY: number;
};

export const smsConversationPhoneCopy = {
  en: {
    accessibilityLabel: "Open Spot SMS reply queue and manual merchant confirmation preview",
    businessName: "Open Spot",
    statusTime: "9:41",
    floatingBadges: [
      { label: "Manual review", tone: "dark" },
      { label: "SMS replies", tone: "dark" }
    ],
    metrics: {
      filled: {
        eyebrow: "Open spots filled this week",
        title: "18",
        value: "+64% from last week"
      },
      revenue: {
        eyebrow: "Revenue recovered",
        title: "$2,340",
        value: "+28%"
      }
    },
    cancellation: {
      title: "New cancellation",
      service: "60-min Massage with Alex",
      time: "Today, 10:30 AM"
    },
    controls: {
      menu: "Menu",
      createOpening: "Create opening"
    },
    replies: {
      title: "Waitlist replies",
      count: "7",
      items: [
        {
          initials: "SM",
          name: "Sarah M.",
          message: "I can come in",
          status: "Reply received",
          tone: "green"
        },
        {
          initials: "MR",
          name: "Mike R.",
          message: "Yes, I'm available",
          status: "Available",
          tone: "blue"
        },
        {
          initials: "JT",
          name: "Jessica T.",
          message: "Interested",
          status: "To confirm",
          tone: "neutral"
        }
      ],
      confirm: "Confirm Sarah M.",
      viewAll: "View all replies"
    }
  },
  fr: {
    accessibilityLabel:
      "Aperçu Open Spot d'une file de réponses SMS et d'une confirmation manuelle par le commerce",
    businessName: "Open Spot",
    statusTime: "9:41",
    floatingBadges: [
      { label: "Révision manuelle", tone: "dark" },
      { label: "Réponses SMS", tone: "dark" }
    ],
    metrics: {
      filled: {
        eyebrow: "Créneaux remplis cette semaine",
        title: "18",
        value: "+64% vs semaine dernière"
      },
      revenue: {
        eyebrow: "Revenu récupéré",
        title: "2 340 $",
        value: "+28%"
      }
    },
    cancellation: {
      title: "Nouvelle annulation",
      service: "Massage 60 min avec Alex",
      time: "Aujourd'hui, 10 h 30"
    },
    controls: {
      menu: "Menu",
      createOpening: "Créer un créneau"
    },
    replies: {
      title: "Réponses de la liste",
      count: "7",
      items: [
        {
          initials: "SM",
          name: "Sarah M.",
          message: "Je peux venir",
          status: "Réponse reçue",
          tone: "green"
        },
        {
          initials: "MR",
          name: "Mike R.",
          message: "Oui, je suis disponible",
          status: "Disponible",
          tone: "blue"
        },
        {
          initials: "JT",
          name: "Jessica T.",
          message: "Intéressée",
          status: "À confirmer",
          tone: "neutral"
        }
      ],
      confirm: "Confirmer Sarah M.",
      viewAll: "Voir toutes les réponses"
    }
  }
} as const satisfies Record<Locale, SmsConversationPhoneCopy>;

const initialMotion: PhoneMotion = {
  opacity: 0.94,
  scale: 0.965,
  translateY: 42
};

const settledMotion: PhoneMotion = {
  opacity: 1,
  scale: 1,
  translateY: 0
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function interpolateMotion(progress: number): PhoneMotion {
  const eased = easeOutCubic(progress);

  return {
    opacity: initialMotion.opacity + (settledMotion.opacity - initialMotion.opacity) * eased,
    scale: initialMotion.scale + (settledMotion.scale - initialMotion.scale) * eased,
    translateY:
      initialMotion.translateY +
      (settledMotion.translateY - initialMotion.translateY) * eased
  };
}

function applyPhoneMotion(node: HTMLElement, progress: number) {
  const motion = interpolateMotion(progress);

  node.style.setProperty("--lunera-phone-progress", progress.toFixed(4));
  node.style.setProperty("--lunera-phone-opacity", motion.opacity.toFixed(4));
  node.style.setProperty("--lunera-phone-scale", motion.scale.toFixed(4));
  node.style.setProperty("--lunera-phone-y", `${motion.translateY.toFixed(2)}px`);
}

export function SmsConversationPhone({ locale }: { locale: Locale }) {
  const copy = smsConversationPhoneCopy[locale];
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = rootRef.current;

    if (!node) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let currentProgress = 0;
    let targetProgress = 0;

    const readScrollProgress = () => {
      const hero = node.closest<HTMLElement>("[data-lunera-hero]");
      const rect = hero?.getBoundingClientRect() ?? node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const revealDistance = viewportHeight * 0.52;
      const rawProgress = Math.abs(Math.min(0, rect.top)) / revealDistance;

      return clamp(rawProgress, 0, 1);
    };

    const tick = () => {
      currentProgress += (targetProgress - currentProgress) * 0.18;

      if (Math.abs(targetProgress - currentProgress) < 0.001) {
        currentProgress = targetProgress;
      }

      applyPhoneMotion(node, currentProgress);

      if (currentProgress === targetProgress) {
        animationFrame = 0;
        return;
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    const requestMotionUpdate = () => {
      if (mediaQuery.matches) {
        return;
      }

      targetProgress = readScrollProgress();

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    const applyReducedMotionPreference = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      if (mediaQuery.matches) {
        currentProgress = 1;
        targetProgress = 1;
        applyPhoneMotion(node, 1);
        return;
      }

      requestMotionUpdate();
    };

    applyPhoneMotion(node, 0);
    applyReducedMotionPreference();
    requestMotionUpdate();

    window.addEventListener("scroll", requestMotionUpdate, { passive: true });
    window.addEventListener("resize", requestMotionUpdate);
    mediaQuery.addEventListener("change", applyReducedMotionPreference);

    return () => {
      window.removeEventListener("scroll", requestMotionUpdate);
      window.removeEventListener("resize", requestMotionUpdate);
      mediaQuery.removeEventListener("change", applyReducedMotionPreference);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  const phoneSceneStyle = {
    "--lunera-phone-opacity": initialMotion.opacity,
    "--lunera-phone-scale": initialMotion.scale,
    "--lunera-phone-y": `${initialMotion.translateY}px`,
    "--lunera-phone-progress": 0
  } as CSSProperties;

  return (
    <figure
      aria-label={copy.accessibilityLabel}
      className="lunera-phone-scene m-0"
      ref={rootRef}
      style={phoneSceneStyle}
    >
      <div aria-hidden="true" className="contents">
        <HeroMetricCard
          className="left-[7%] top-[59%] hidden lg:block"
          eyebrow={copy.metrics.filled.eyebrow}
          title={copy.metrics.filled.title}
          value={copy.metrics.filled.value}
        />
        <HeroMetricCard
          className="right-[9%] top-[34%] hidden lg:block"
          eyebrow={copy.metrics.revenue.eyebrow}
          title={copy.metrics.revenue.title}
          value={copy.metrics.revenue.value}
        />
        {copy.floatingBadges.map((badge, index) => (
          <FloatingSmsBadge badge={badge} index={index} key={badge.label} />
        ))}

        <div className="lunera-phone-motion">
          <div className="lunera-phone-object lunera-phone-natural-mask">
            <div className="lunera-phone-side-rail" />
            <div className="lunera-phone-body">
              <div className="lunera-phone-glass">
                <div className="lunera-phone-screen lunera-phone-screen-overlay">
                  <OpenSpotPhoneScreen copy={copy} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function OpenSpotPhoneScreen({ copy }: { copy: SmsConversationPhoneCopy }) {
  return (
    <>
      <div className="lunera-phone-dynamic-island" />
      <div className="flex items-center justify-between px-5 pb-2 pt-5 text-[0.68rem] font-black text-slate-950">
        <span>{copy.statusTime}</span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-3 rounded-sm border-r-2 border-t-2 border-slate-950/75" />
          <span className="h-2.5 w-4 rounded-sm border border-slate-950/70" />
          <span className="h-2.5 w-1 rounded-sm bg-slate-950/80" />
        </div>
      </div>

      <div className="lunera-phone-app-header flex items-center justify-between px-5 pt-7">
        <span
          aria-label={copy.controls.menu}
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl font-light text-slate-800"
          role="img"
        >
          =
        </span>
        <p className="lunera-phone-app-title text-xl font-bold text-[#11131a]">Open Spot</p>
        <span
          aria-label={copy.controls.createOpening}
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-2xl font-light text-slate-800"
          role="img"
        >
          +
        </span>
      </div>

      <div className="mx-5 mt-5 rounded-[1.45rem] border border-slate-100 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-[#11131a]">{copy.cancellation.title}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {copy.cancellation.service}
            </p>
          </div>
          <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[0.62rem] font-black text-[#3478ff]">
            {copy.cancellation.time}
          </span>
        </div>
      </div>

      <div className="lunera-phone-replies px-5 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-[#11131a]">{copy.replies.title}</p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
            {copy.replies.count}
          </span>
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-[1.2rem] border border-slate-100 bg-white px-3 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          {copy.replies.items.map((reply, index) => (
            <div
              className={cn(
                "lunera-reply-row flex items-center gap-3 py-3",
                index === 2 && "opacity-75"
              )}
              key={reply.name}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-[0.66rem] font-black text-[#3478ff]">
                {reply.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-950">{reply.name}</p>
                <p className="mt-0.5 truncate text-[0.68rem] font-medium text-slate-500">
                  {reply.message}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[0.6rem] font-black",
                  reply.tone === "green" && "bg-[#ecfdf3] text-[#16a34a]",
                  reply.tone === "blue" && "bg-[#f4f7ff] text-[#3478ff]",
                  reply.tone === "neutral" && "bg-slate-100 text-slate-500"
                )}
              >
                {reply.status}
              </span>
            </div>
          ))}
        </div>
        <button
          className="mt-4 min-h-11 w-full rounded-[0.9rem] bg-[#3478ff] text-sm font-black text-white shadow-[0_14px_30px_rgba(52,120,255,0.28)]"
          type="button"
        >
          {copy.replies.confirm}
        </button>
        <p className="mt-3 text-center text-xs font-black text-[#3478ff]">
          {copy.replies.viewAll}
        </p>
      </div>
    </>
  );
}

function HeroMetricCard({
  className,
  eyebrow,
  title,
  value
}: {
  className: string;
  eyebrow: string;
  title: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "lunera-floating-card absolute z-[32] w-[12.25rem] rounded-[1.18rem] border border-white/80 bg-white p-4 text-left shadow-[0_20px_52px_rgba(15,23,42,0.13)]",
        className
      )}
    >
      <p className="text-xs font-black text-slate-400">{eyebrow}</p>
      <p className="mt-2 text-3xl font-black leading-tight text-[#06080d]">{title}</p>
      <p className="mt-2 text-xs font-black leading-5 text-[#22c55e]">{value}</p>
    </div>
  );
}

function FloatingSmsBadge({ badge, index }: { badge: FloatingBadge; index: number }) {
  const positions = [
    "left-[9%] top-[40%] hidden lg:block",
    "right-[11%] top-[72%] hidden lg:block"
  ];

  const toneClass = {
    dark: "border-black bg-black text-white",
    green: "border-[#ccefe6] bg-[#e8fbf5] text-[#08775c]"
  }[badge.tone];

  return (
    <div
      className={cn(
        "lunera-floating-card absolute z-[32] max-w-[12.5rem] rounded-full border px-3.5 py-1.5 text-xs font-black shadow-[0_18px_46px_rgba(15,23,42,0.13)]",
        toneClass,
        positions[index]
      )}
    >
      {badge.label}
    </div>
  );
}
