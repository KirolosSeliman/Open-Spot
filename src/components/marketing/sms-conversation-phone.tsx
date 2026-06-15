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
    businessInitials: "SE",
    businessName: "Studio Élise",
    statusLabel: "Aujourd’hui · SMS",
    statusTime: "15:31",
    complianceLine: "Réponds STOP pour te désinscrire.",
    inputPlaceholder: "Message SMS",
    messages: [
      {
        from: "business",
        text: "Bonjour Léa, une place vient de se libérer aujourd’hui à 15 h 30 pour coupe + brushing. Réponds OUI si tu es intéressée."
      },
      {
        from: "customer",
        text: "OUI, je suis disponible."
      },
      {
        from: "business",
        text: "Merci! Le salon va confirmer manuellement le rendez-vous."
      }
    ],
    floatingBadges: [
      { label: "Réponse reçue", tone: "green" },
      { label: "À confirmer par le commerce", tone: "dark" },
      { label: "85 $ de revenu à récupérer", tone: "blue" },
      { label: "2 réponses", tone: "white" }
    ]
  },
  en: {
    businessInitials: "SE",
    businessName: "Studio Elise",
    statusLabel: "Today · SMS",
    statusTime: "3:31",
    complianceLine: "Reply STOP to unsubscribe.",
    inputPlaceholder: "SMS message",
    messages: [
      {
        from: "business",
        text: "Hi Lea, a spot just opened today at 3:30 PM for a cut + blowout. Reply YES if you are interested."
      },
      {
        from: "customer",
        text: "YES, I am available."
      },
      {
        from: "business",
        text: "Thanks! The salon will manually confirm the appointment."
      }
    ],
    floatingBadges: [
      { label: "Reply received", tone: "green" },
      { label: "Merchant review needed", tone: "dark" },
      { label: "$85 revenue to recover", tone: "blue" },
      { label: "2 replies", tone: "white" }
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
  opacity: 0.7,
  rotate: 5,
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
      className="relative mx-auto flex min-h-[560px] w-full max-w-5xl items-center justify-center overflow-visible px-2 sm:min-h-[620px] lg:min-h-[680px]"
      ref={rootRef}
      role="img"
    >
      {copy.floatingBadges.map((badge, index) => (
        <FloatingSmsBadge badge={badge} index={index} key={badge.label} />
      ))}

      <div
        className="relative z-10 mx-auto w-full max-w-[21rem] rounded-[3.1rem] border border-black/80 bg-[#070a12] p-2.5 shadow-[0_34px_90px_rgba(15,23,42,0.32)] sm:max-w-[22.5rem] sm:p-3"
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
              <span className="text-2xl font-light leading-none text-[#4f7df3]">‹</span>
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
            ? "rounded-br-md bg-[#4f7df3] text-white"
            : "rounded-bl-md bg-white text-slate-800"
        )}
      >
        {message.text}
      </div>
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
    "left-2 top-16 hidden md:block",
    "right-0 top-24 hidden md:block",
    "bottom-24 left-10 hidden lg:block",
    "bottom-14 right-12 hidden lg:block"
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
        "lunera-floating-card absolute z-20 max-w-[13rem] rounded-[1.25rem] border px-4 py-3 text-sm font-black shadow-[0_22px_55px_rgba(15,23,42,0.14)]",
        toneClass,
        positions[index]
      )}
    >
      {badge.label}
    </div>
  );
}
