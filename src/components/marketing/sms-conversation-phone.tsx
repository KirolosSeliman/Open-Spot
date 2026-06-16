"use client";

import { useEffect, useRef, useState } from "react";
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

export const smsConversationPhoneCopy = {
  fr: {
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
      { label: "Reply received", tone: "green" },
      { label: "Manual confirmation", tone: "dark" },
      { label: "$85 recovered", tone: "blue" },
      { label: "Waitlist notified", tone: "white" }
    ]
  },
  en: {
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
      { label: "Reply received", tone: "green" },
      { label: "Manual confirmation", tone: "dark" },
      { label: "$85 recovered", tone: "blue" },
      { label: "Waitlist notified", tone: "white" }
    ]
  }
} as const satisfies Record<Locale, SmsConversationPhoneCopy>;

type PhoneMotion = {
  opacity: number;
  rotate: number;
  scale: number;
  translateY: number;
};

const initialMotion: PhoneMotion = {
  opacity: 0.72,
  rotate: 4,
  scale: 0.96,
  translateY: 120
};

const settledMotion: PhoneMotion = {
  opacity: 1,
  rotate: 0,
  scale: 1,
  translateY: 0
};

export function SmsConversationPhone({ locale }: { locale: Locale }) {
  const copy = smsConversationPhoneCopy[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState<PhoneMotion>(initialMotion);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;

    const applyReducedMotionPreference = () => {
      const shouldReduceMotion = mediaQuery.matches;
      setReducedMotion(shouldReduceMotion);

      if (shouldReduceMotion) {
        setMotion(settledMotion);
      }
    };

    const updateMotion = () => {
      if (mediaQuery.matches) {
        return;
      }

      const node = rootRef.current;

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const start = viewportHeight * 0.92;
      const end = viewportHeight * 0.32;
      const rawProgress = (start - rect.top) / (start - end);
      const progress = Math.min(1, Math.max(0, rawProgress));
      const eased = 1 - Math.pow(1 - progress, 3);

      setMotion({
        opacity: initialMotion.opacity + (settledMotion.opacity - initialMotion.opacity) * eased,
        rotate: initialMotion.rotate + (settledMotion.rotate - initialMotion.rotate) * eased,
        scale: initialMotion.scale + (settledMotion.scale - initialMotion.scale) * eased,
        translateY:
          initialMotion.translateY +
          (settledMotion.translateY - initialMotion.translateY) * eased
      });
    };

    const requestMotionUpdate = () => {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updateMotion();
      });
    };

    applyReducedMotionPreference();
    updateMotion();

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

  const motionStyle = {
    opacity: motion.opacity,
    transform: `translateY(${motion.translateY}px) rotate(${motion.rotate}deg) scale(${motion.scale})`,
    willChange: reducedMotion ? "auto" : "transform, opacity"
  } satisfies CSSProperties;

  return (
    <div
      aria-label={`${copy.businessName} SMS conversation preview with manual merchant confirmation`}
      className="relative mx-auto flex min-h-[30rem] w-full max-w-[69rem] items-center justify-center overflow-visible px-2 sm:min-h-[32rem]"
      ref={rootRef}
      role="img"
    >
      <HeroMetricCard
        className="left-0 top-16 hidden md:block"
        eyebrow="Open spot"
        title="4:30 PM"
        value="Haircut"
      />
      <HeroMetricCard
        className="right-0 top-28 hidden md:block"
        eyebrow="Replies"
        title="2 clients"
        value="Ready to review"
      />
      {copy.floatingBadges.map((badge, index) => (
        <FloatingSmsBadge badge={badge} index={index} key={badge.label} />
      ))}

      <div
        className="relative z-10 mx-auto w-full max-w-[22rem] rounded-[3.15rem] border border-black/80 bg-[#070a12] p-2.5 shadow-[0_34px_90px_rgba(15,23,42,0.32)] sm:p-3"
        style={motionStyle}
      >
        <div className="relative overflow-hidden rounded-[2.55rem] bg-[#f5f7fb] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="absolute left-1/2 top-2 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-black shadow-[0_6px_16px_rgba(0,0,0,0.28)]" />

          <div className="flex items-center justify-between px-7 pb-2 pt-4 text-[0.72rem] font-black text-slate-950">
            <span>{copy.statusTime}</span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-4 rounded-sm border border-slate-950/70" />
              <span className="h-2.5 w-1 rounded-sm bg-slate-950/80" />
            </div>
          </div>

          <div className="border-b border-slate-200/80 bg-white/86 px-4 pb-3 pt-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-light leading-none text-[#4686fe]">{"<"}</span>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e8fbf5] text-xs font-black text-[#08775c]">
                {copy.businessInitials}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-black text-slate-950">{copy.businessName}</p>
                <p className="mt-0.5 truncate text-xs font-bold text-slate-400">{copy.statusLabel}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-4 py-5">
            <SmsBubble message={copy.messages[0]} />
            <p className="mx-auto max-w-[15rem] py-1 text-center text-[0.68rem] font-bold leading-4 text-slate-400">
              {copy.complianceLine}
            </p>
            <SmsBubble message={copy.messages[1]} />
            <SmsBubble message={copy.messages[2]} />
          </div>

          <div className="px-4 pb-5">
            <div className="flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-400 shadow-sm">
              {copy.inputPlaceholder}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmsBubble({ message }: { message: SmsMessage }) {
  const isCustomer = message.from === "customer";

  return (
    <div className={cn("flex", isCustomer ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold leading-5 shadow-sm",
          isCustomer
            ? "rounded-br-md bg-[#4686fe] text-white"
            : "rounded-bl-md bg-white text-slate-800"
        )}
      >
        {message.text}
      </div>
    </div>
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
        "lunera-floating-card absolute z-20 w-[14rem] rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-[0_24px_70px_rgba(15,23,42,0.14)]",
        className
      )}
    >
      <p className="text-xs font-black text-slate-400">{eyebrow}</p>
      <p className="mt-2 text-3xl font-medium text-[#050608]">{title}</p>
      <p className="mt-2 text-sm font-bold text-slate-500">{value}</p>
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
    "left-[8%] bottom-20 hidden lg:block",
    "right-[10%] bottom-16 hidden lg:block",
    "left-[15%] top-2 hidden md:block",
    "right-[14%] top-5 hidden md:block"
  ];

  const toneClass = {
    blue: "border-[#dbe7ff] bg-[#edf4ff] text-[#254caa]",
    dark: "border-black bg-black text-white",
    green: "border-[#ccefe6] bg-[#e8fbf5] text-[#08775c]",
    white: "border-slate-200 bg-white text-slate-950"
  }[badge.tone];

  return (
    <div
      className={cn(
        "lunera-floating-card absolute z-20 max-w-[13rem] rounded-full border px-4 py-2 text-sm font-black shadow-[0_22px_55px_rgba(15,23,42,0.14)]",
        toneClass,
        positions[index]
      )}
    >
      {badge.label}
    </div>
  );
}
