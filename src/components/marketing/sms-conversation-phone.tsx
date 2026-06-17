"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

type FloatingBadge = {
  label: string;
  tone: "dark" | "green";
};

type SmsConversationPhoneCopy = {
  businessName: string;
  statusTime: string;
  floatingBadges: FloatingBadge[];
};

type PhoneMotion = {
  opacity: number;
  scale: number;
  translateY: number;
};

const phoneCopy = {
  businessName: "Open Spot",
  statusTime: "4:31",
  floatingBadges: [
    { label: "Consent checked", tone: "dark" },
    { label: "Reply received", tone: "green" }
  ]
} as const satisfies SmsConversationPhoneCopy;

export const smsConversationPhoneCopy = {
  fr: phoneCopy,
  en: phoneCopy
} as const satisfies Record<Locale, SmsConversationPhoneCopy>;

const initialMotion: PhoneMotion = {
  opacity: 0.98,
  scale: 0.94,
  translateY: 58
};

const settledMotion: PhoneMotion = {
  opacity: 1,
  scale: 1,
  translateY: 48
};

const responses = [
  ["MC", "Maria C.", "I can do that!", "4:32 PM"],
  ["JL", "James L.", "Yes, I'm available.", "4:35 PM"]
] as const;

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
  const rootRef = useRef<HTMLDivElement>(null);

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
    <div
      aria-label={`${copy.businessName} opening dashboard preview with SMS replies and manual merchant confirmation`}
      className="lunera-phone-scene"
      ref={rootRef}
      role="img"
      style={phoneSceneStyle}
    >
      <HeroMetricCard
        className="left-[6%] top-[44%] hidden md:block"
        eyebrow="Open slot created"
        title="4:30 PM"
        value="Haircut + brushing"
      />
      <HeroMetricCard
        className="right-[8%] top-[50%] hidden md:block"
        eyebrow="2 replies"
        title="Ready to fill."
        value="Manual review"
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
  );
}

function OpenSpotPhoneScreen({ copy }: { copy: SmsConversationPhoneCopy }) {
  return (
    <>
      <div className="lunera-phone-dynamic-island" />
      <div className="flex items-center justify-between px-5 pb-3 pt-5 text-[0.68rem] font-black text-slate-950">
        <span>{copy.statusTime}</span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-3 rounded-sm border-t-2 border-r-2 border-slate-950/75" />
          <span className="h-2.5 w-4 rounded-sm border border-slate-950/70" />
          <span className="h-2.5 w-1 rounded-sm bg-slate-950/80" />
        </div>
      </div>

      <div className="lunera-phone-app-header flex items-center justify-between px-5 pt-7">
        <button
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl font-light text-slate-800"
          type="button"
        >
          {"<"}
        </button>
        <p className="lunera-phone-app-title text-xl font-semibold text-[#11131a]">Open Spots</p>
        <button
          aria-label="Create opening"
          className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-2xl font-light text-slate-800"
          type="button"
        >
          +
        </button>
      </div>

      <div className="lunera-open-slot-card mx-5 mt-6 rounded-[1.45rem] bg-[#555c72] p-5 text-white shadow-[0_18px_40px_rgba(42,51,74,0.24)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-white/65">Open slot</p>
            <p className="lunera-phone-time mt-3 text-3xl font-light tracking-normal">4:30 PM</p>
          </div>
          <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black">
            Open
          </span>
        </div>
        <p className="lunera-phone-service mt-5 text-base font-semibold">Haircut + brushing</p>
        <div className="lunera-phone-card-meta mt-5 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-white/45">Replies</p>
            <p className="mt-1 font-semibold">2 replies</p>
          </div>
          <div>
            <p className="text-white/45">Status</p>
            <p className="mt-1 font-semibold">Manual review</p>
          </div>
        </div>
      </div>

      <div className="lunera-phone-replies px-5 pt-6">
        <p className="text-base font-semibold text-[#11131a]">Client replies</p>
        <div className="mt-3 divide-y divide-slate-100">
          {responses.map(([initials, name, message, time], index) => (
            <div
              className={cn(
                "lunera-reply-row flex items-center gap-3 py-3",
                index === 1 && "opacity-35"
              )}
              key={name}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#687083] text-[0.66rem] font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-950">{name}</p>
                <p className="mt-0.5 text-[0.68rem] font-medium text-slate-500">{message}</p>
              </div>
              <span className="text-[0.65rem] font-medium text-slate-400">{time}</span>
            </div>
          ))}
        </div>
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
      <p className="mt-2 text-2xl font-semibold leading-tight text-[#06080d]">{title}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{value}</p>
    </div>
  );
}

function FloatingSmsBadge({
  badge,
  index
}: {
  badge: FloatingBadge;
  index: number;
}) {
  const positions = [
    "left-[16%] top-[28%] hidden md:block",
    "right-[13%] top-[33%] hidden md:block"
  ];

  const toneClass = {
    dark: "border-black bg-black text-white",
    green: "border-[#ccefe6] bg-[#e8fbf5] text-[#08775c]"
  }[badge.tone];

  return (
    <div
      className={cn(
        "lunera-floating-card absolute z-[32] max-w-[11.5rem] rounded-full border px-3.5 py-1.5 text-xs font-black shadow-[0_18px_46px_rgba(15,23,42,0.13)]",
        toneClass,
        positions[index]
      )}
    >
      {badge.label}
    </div>
  );
}
