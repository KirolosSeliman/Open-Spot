"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

type SmsMessage = {
  from: "business" | "customer";
  text: string;
};

type FloatingBadge = {
  label: string;
  tone: "blue" | "dark" | "green" | "white";
};

type SmsConversationPhoneCopy = {
  businessInitials: string;
  businessName: string;
  statusLabel: string;
  statusTime: string;
  complianceLine: string;
  inputPlaceholder: string;
  messages: SmsMessage[];
  floatingBadges: FloatingBadge[];
};

type PhoneMotion = {
  opacity: number;
  scale: number;
  translateY: number;
};

const phoneCopy = {
  businessInitials: "OS",
  businessName: "Open Spot Salon",
  statusLabel: "Today - SMS",
  statusTime: "4:31",
  complianceLine: "Reply STOP to unsubscribe.",
  inputPlaceholder: "SMS message",
  messages: [
    {
      from: "business",
      text: "Hi Sarah, a spot opened today at 4:30 PM for a haircut. Reply YES if you want it."
    },
    {
      from: "customer",
      text: "YES, I can come."
    },
    {
      from: "business",
      text: "Great - your reply was received. The salon will manually confirm shortly."
    }
  ],
  floatingBadges: [
    { label: "Consent checked", tone: "dark" },
    { label: "Manual confirmation", tone: "dark" },
    { label: "Reply received", tone: "green" },
    { label: "Waitlist notified", tone: "white" }
  ]
} as const satisfies SmsConversationPhoneCopy;

export const smsConversationPhoneCopy = {
  fr: phoneCopy,
  en: phoneCopy
} as const satisfies Record<Locale, SmsConversationPhoneCopy>;

const initialMotion: PhoneMotion = {
  opacity: 0.92,
  scale: 0.94,
  translateY: 124
};

const settledMotion: PhoneMotion = {
  opacity: 1,
  scale: 0.985,
  translateY: -62
};

const responses = [
  ["Sarah M.", "YES", "4:12 PM"],
  ["Mia R.", "YES", "4:14 PM"],
  ["Lea P.", "WAIT", "4:16 PM"]
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
        className="left-[7%] top-[22%] hidden md:block lg:top-[43%]"
        eyebrow="Open slot created"
        title="4:30 PM"
        value="Haircut + brushing"
      />
      <HeroMetricCard
        className="right-[7%] top-[34%] hidden md:block lg:top-[55%]"
        eyebrow="2 replies"
        title="Ready to review"
        value="Manual confirmation"
      />
      {copy.floatingBadges.map((badge, index) => (
        <FloatingSmsBadge badge={badge} index={index} key={badge.label} />
      ))}

      <div className="lunera-phone-motion">
        <div className="lunera-phone-frame-shell lunera-phone-natural-mask">
          <Image
            alt=""
            aria-hidden="true"
            className="lunera-phone-frame-asset"
            height={2100}
            priority
            sizes="(max-width: 767px) 104vw, 26rem"
            src="/lunera-style/phone-frame-reference.png"
            width={973}
          />
          <div className="lunera-phone-screen-overlay">
            <OpenSpotPhoneScreen copy={copy} />
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
      <div className="flex items-center justify-between px-5 pb-3 pt-5 text-[0.72rem] font-black text-slate-950">
        <span>{copy.statusTime}</span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-4 rounded-sm border border-slate-950/70" />
          <span className="h-2.5 w-1 rounded-sm bg-slate-950/80" />
        </div>
      </div>

      <div className="lunera-phone-app-header flex items-center justify-between px-5 pt-9">
        <button
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-2xl font-light text-slate-800"
          type="button"
        >
          {"<"}
        </button>
        <p className="lunera-phone-app-title text-xl font-semibold text-[#11131a]">
          <span>Open </span>
          <span>Spots</span>
        </p>
        <button
          aria-label="Create opening"
          className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-3xl font-light text-slate-800"
          type="button"
        >
          +
        </button>
      </div>

      <div className="lunera-open-slot-card mx-5 mt-7 rounded-[1.6rem] bg-[#555c72] p-5 text-white shadow-[0_18px_40px_rgba(42,51,74,0.24)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-white/65">Open slot</p>
            <p className="lunera-phone-time mt-3 text-4xl font-light tracking-normal">
              <span>4:30 </span>
              <span>PM</span>
            </p>
          </div>
          <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-black">
            Open
          </span>
        </div>
        <p className="lunera-phone-service mt-5 text-lg font-semibold">Haircut + brushing</p>
        <div className="lunera-phone-card-meta mt-5 grid grid-cols-2 gap-3 text-sm">
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
        <p className="text-lg font-semibold text-[#11131a]">Client replies</p>
        <div className="mt-3 space-y-2">
          {responses.map(([name, answer, time]) => (
            <div
              className="lunera-reply-row flex items-center justify-between rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
              key={name}
            >
              <div>
                <p className="text-sm font-black text-slate-950">{name}</p>
                <p className="mt-0.5 text-xs font-bold text-slate-400">{time}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-black",
                  answer === "YES"
                    ? "bg-[#e9fbf4] text-[#0f8a68]"
                    : "bg-[#f2f4f7] text-slate-500"
                )}
              >
                {answer}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-6 rounded-[1.45rem] bg-[#f3f4f7] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#11131a]">Manual confirmation queue</p>
            <p className="mt-1 text-xs font-bold text-slate-400">
              Nothing is confirmed automatically
            </p>
          </div>
          <span className="rounded-full bg-[#4388ff] px-3 py-1 text-xs font-black text-white">
            Review
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
          <div className="h-full w-[62%] rounded-full bg-[#4388ff]" />
        </div>
      </div>

      <p className="px-5 pt-4 text-center text-[0.68rem] font-bold text-slate-400">
        {copy.complianceLine}
      </p>

      <div className="absolute inset-x-0 bottom-0 grid grid-cols-4 gap-1 border-t border-slate-100 bg-white/88 px-4 pb-4 pt-3 text-center text-[0.68rem] font-bold text-slate-400 backdrop-blur">
        {["Home", "Spots", "Replies", "Settings"].map((item) => (
          <span className={cn(item === "Replies" && "text-[#4388ff]")} key={item}>
            {item}
          </span>
        ))}
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
        "lunera-floating-card absolute z-[14] w-[12.25rem] rounded-[1.18rem] border border-white/80 bg-white p-4 text-left shadow-[0_20px_52px_rgba(15,23,42,0.13)]",
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
    "left-[16%] top-[8%] hidden md:block lg:top-[29%]",
    "right-[15%] bottom-[28%] hidden lg:block lg:bottom-[7%]",
    "right-[18%] top-[12%] hidden md:block lg:top-[33%]",
    "left-[13%] bottom-[32%] hidden lg:block lg:bottom-[11%]"
  ];

  const toneClass = {
    blue: "border-[#dbe7ff] bg-[#edf5ff] text-[#254caa]",
    dark: "border-black bg-black text-white",
    green: "border-[#ccefe6] bg-[#e8fbf5] text-[#08775c]",
    white: "border-white bg-white text-slate-950"
  }[badge.tone];

  return (
    <div
      className={cn(
        "lunera-floating-card absolute z-[14] max-w-[11.5rem] rounded-full border px-3.5 py-1.5 text-xs font-black shadow-[0_18px_46px_rgba(15,23,42,0.13)]",
        toneClass,
        positions[index]
      )}
    >
      {badge.label}
    </div>
  );
}
