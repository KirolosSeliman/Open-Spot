"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

type SceneState =
  | "cancelled"
  | "manual_stress"
  | "targeting_appears"
  | "targeting_selects"
  | "sms_sent"
  | "replies"
  | "merchant_validates"
  | "recovered";

type RecoveryStoryStep = {
  id: string;
  label: string;
  title: string;
  text: string;
  sceneState: SceneState;
};

export const recoveryStorySteps: RecoveryStoryStep[] = [
  {
    id: "annulation",
    label: "Annulation",
    title: "Une annulation de dernière minute, ça fait mal.",
    text: "Une chaise vide, c'est du temps perdu et du revenu qui disparaît.",
    sceneState: "cancelled"
  },
  {
    id: "stress-manuel",
    label: "Stress",
    title: "Texter tout le monde à la main, ce n'est pas une solution.",
    text: "Trop lent pour vous. Trop fatigant pour vos clients.",
    sceneState: "manual_stress"
  },
  {
    id: "ciblage-assiste",
    label: "Ciblage",
    title: "Open Spot prépare une liste admissible.",
    text: "Les critères de service et de consentement aident à choisir qui contacter.",
    sceneState: "targeting_appears"
  },
  {
    id: "ciblage",
    label: "Ciblage",
    title: "Les bons clients sont priorisés.",
    text: "Open Spot aide à éviter d'envoyer des notifications à des clients non admissibles.",
    sceneState: "targeting_selects"
  },
  {
    id: "sms-cibles",
    label: "SMS ciblés",
    title: "Moins de messages inutiles. Plus de pertinence.",
    text: "Les clients les plus susceptibles d'être intéressés sont priorisés.",
    sceneState: "sms_sent"
  },
  {
    id: "reponses",
    label: "Réponses",
    title: "Vos clients répondent simplement par SMS.",
    text: "Aucune app à installer. Aucun processus compliqué.",
    sceneState: "replies"
  },
  {
    id: "validation",
    label: "Validation",
    title: "Vous gardez le contrôle.",
    text: "Les réponses sont classées, mais c'est vous qui choisissez qui confirmer.",
    sceneState: "merchant_validates"
  },
  {
    id: "recupere",
    label: "Récupéré",
    title: "Une annulation devient une deuxième chance.",
    text: "Le créneau vide peut redevenir un rendez-vous rempli.",
    sceneState: "recovered"
  }
];

const sceneOrder = recoveryStorySteps.map((step) => step.sceneState);

const manualChannels = ["Téléphone", "DM", "Contacts", "47 clients?"];

const targetRows = [
  ["A réservé il y a 5 jours", "Skip"],
  ["N’a pas réservé depuis 3 semaines", "SMS"],
  ["Intéressé par coupe/barbe", "SMS"]
] as const;

const replyRows = [
  ["Sarah", "OUI", "14:03"],
  ["Lina", "OUI", "14:06"],
  ["Marc", "OUI", "14:08"]
] as const;

export function AnimatedRecoveryStory() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const activeStep = recoveryStorySteps[activeIndex] ?? recoveryStorySteps[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleMotionPreference();
    mediaQuery.addEventListener("change", handleMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  useEffect(() => {
    const observedSteps = stepRefs.current.filter(Boolean) as HTMLElement[];

    if (observedSteps.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        if (!(visibleEntry.target instanceof HTMLElement)) {
          return;
        }

        const nextIndex = Number(visibleEntry.target.dataset.stepIndex);

        if (Number.isFinite(nextIndex)) {
          setActiveIndex(nextIndex);
        }
      },
      {
        root: null,
        rootMargin: "-28% 0px -52% 0px",
        threshold: [0.2, 0.45, 0.7]
      }
    );

    observedSteps.forEach((step) => observer.observe(step));

    return () => {
      observer.disconnect();
    };
  }, []);

  const progressText = useMemo(
    () => `${activeIndex + 1} / ${recoveryStorySteps.length}`,
    [activeIndex]
  );

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <RecoveryScene
          activeIndex={activeIndex}
          activeState={activeStep.sceneState}
          progressText={progressText}
          reducedMotion={prefersReducedMotion}
        />
      </div>

      <div className="grid gap-4">
        {recoveryStorySteps.map((step, index) => {
          const isActive = index === activeIndex;

          return (
            <article
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "scroll-mt-28 rounded-xl border bg-white p-5 shadow-sm transition",
                isActive
                  ? "border-[var(--primary)] shadow-md"
                  : "border-[var(--line)] hover:-translate-y-0.5 hover:shadow-md",
                prefersReducedMotion && "transition-none hover:translate-y-0"
              )}
              data-step-index={index}
              id={`story-${step.id}`}
              key={step.id}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold",
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[#edf7f4] text-[var(--primary-strong)]"
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">
                    {step.label}
                  </p>
                  <h3 className="mt-1 text-lg font-bold leading-snug text-[var(--foreground)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {step.text}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function RecoveryScene({
  activeIndex,
  activeState,
  progressText,
  reducedMotion
}: {
  activeIndex: number;
  activeState: SceneState;
  progressText: string;
  reducedMotion: boolean;
}) {
  const stateIndex = sceneOrder.indexOf(activeState);
  const isAtLeast = (state: SceneState) => stateIndex >= sceneOrder.indexOf(state);
  const isRecovered = activeState === "recovered";
  const isManualStress = activeState === "manual_stress";
  const showManualClutter = isAtLeast("manual_stress") && !isAtLeast("targeting_selects");

  return (
    <div
      aria-label={`Scène animée: ${recoveryStorySteps[activeIndex]?.title ?? ""}`}
      aria-live="polite"
      className={cn(
        "relative min-h-[940px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[#fffaf1] p-5 shadow-sm sm:min-h-[660px]",
        reducedMotion && "motion-reduce:transition-none"
      )}
      role="img"
    >
      <div className="absolute left-5 right-5 top-5 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Agenda
            </p>
            <p className="text-sm font-bold text-[var(--foreground)]">
              14 h 30 · Coupe express
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              isRecovered
                ? "bg-[#edf7f4] text-[var(--primary-strong)]"
                : "bg-[#fdebea] text-[#8a1f17]"
            )}
          >
            {isRecovered ? "Récupéré" : "Annulé"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "absolute left-6 top-36 h-32 w-28 rounded-t-full border-8 border-[#21313b] bg-[#d6ebe4] transition duration-500 sm:left-8 sm:top-30 sm:h-36 sm:w-32",
          isManualStress && "rotate-[-3deg]",
          isAtLeast("merchant_validates") && "rotate-0 bg-[#cde7df]",
          reducedMotion && "transition-none"
        )}
      >
        <div
          className={cn(
            "absolute -top-8 left-8 h-9 w-9 rounded-full bg-[#cfa176] opacity-0 transition sm:left-10",
            isRecovered && "opacity-100",
            reducedMotion && "transition-none"
          )}
        />
        <div className="absolute left-4 top-16 h-12 w-20 rounded-t-3xl bg-[#b98b61]" />
        <div className="absolute -bottom-7 left-4 h-9 w-24 rounded-b-xl bg-[#21313b]" />
        <div
          className={cn(
            "absolute left-6 top-7 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#8a1f17] opacity-100 transition",
            isRecovered && "opacity-0",
            reducedMotion && "transition-none"
          )}
        >
          vide
        </div>
      </div>

      <div
        className={cn(
          "absolute left-16 right-5 top-28 rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-5 text-[var(--foreground)] shadow-md transition sm:left-24 sm:right-auto sm:max-w-[210px]",
          isManualStress && "translate-y-1 rotate-[-1deg]",
          reducedMotion && "transition-none"
        )}
      >
        {isAtLeast("merchant_validates")
          ? "Je choisis qui confirmer."
          : isAtLeast("targeting_appears")
            ? "Ok, on cible les bonnes personnes."
            : "Je pourrais texter 47 personnes... ou respirer."}
      </div>

      <div
        className={cn(
          "absolute right-6 top-56 grid h-24 w-24 place-items-center rounded-full border border-[#b9d9cf] bg-[#e9f7f2] opacity-0 shadow-md transition duration-500 sm:right-8 sm:top-28 sm:h-32 sm:w-32",
          isAtLeast("targeting_appears") && "opacity-100",
          isAtLeast("targeting_selects") && !reducedMotion && "scale-105 shadow-lg",
          reducedMotion && "transition-none"
        )}
      >
        <div className="absolute -inset-3 rounded-full border border-[#b9d9cf] bg-[#e9f7f2]/35" />
        <div className="absolute -right-2 top-1 h-5 w-5 rounded-full bg-white shadow-sm" />
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center text-xs font-bold leading-4 text-[var(--primary-strong)] sm:h-24 sm:w-24">
          Liste
          <br />
          SMS
        </div>
      </div>

      <div
        aria-hidden={!showManualClutter}
        className={cn(
          "absolute left-5 right-5 top-[320px] grid grid-cols-2 gap-2 opacity-0 transition sm:left-[42%] sm:right-auto sm:top-[258px] sm:w-[34%]",
          showManualClutter && "opacity-100",
          reducedMotion && "transition-none"
        )}
      >
        {manualChannels.map((channel, index) => (
          <div
            className={cn(
              "rounded-xl border border-[#f0d9b8] bg-[#fff7ed] px-3 py-2 text-xs font-bold text-[#8a4b11] shadow-sm",
              !reducedMotion && index % 2 === 0 && "rotate-[-2deg]",
              !reducedMotion && index % 2 === 1 && "rotate-[2deg]"
            )}
            key={channel}
          >
            {channel}
          </div>
        ))}
      </div>

      <div className="absolute left-5 right-5 top-[430px] grid gap-2 sm:right-auto sm:top-[326px] sm:w-[48%]">
        {targetRows.map(([item, status]) => {
          const isSmsCandidate = status === "SMS";
          const isSelected = isAtLeast("targeting_selects") && isSmsCandidate;

          return (
            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] opacity-55 shadow-sm transition",
                isAtLeast("targeting_selects") && "opacity-100",
                isSelected && "ring-2 ring-[var(--primary)]",
                reducedMotion && "transition-none"
              )}
              key={item}
            >
              <span>{item}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  isSelected
                    ? "bg-[#edf7f4] text-[var(--primary-strong)]"
                    : "bg-[#f1f3ef] text-[var(--muted)]"
                )}
              >
                {isAtLeast("targeting_selects") ? status : "..."}
              </span>
            </div>
          );
        })}
      </div>

      <div
        aria-hidden={!isAtLeast("sms_sent")}
        className="absolute left-5 right-5 top-[560px] grid gap-2 sm:left-auto sm:right-6 sm:top-[312px] sm:w-[42%]"
      >
        {["SMS vers Sarah", "SMS vers Lina"].map((message, index) => (
          <div
            className={cn(
              "rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white opacity-0 shadow-md transition duration-500",
              isAtLeast("sms_sent") && "opacity-100",
              isAtLeast("sms_sent") && !reducedMotion && index === 0 && "translate-x-2",
              isAtLeast("sms_sent") && !reducedMotion && index === 1 && "-translate-x-2",
              reducedMotion && "transition-none"
            )}
            key={message}
          >
            {message}
          </div>
        ))}
      </div>

      <div className="absolute left-5 right-5 top-[642px] grid gap-2 sm:left-auto sm:right-6 sm:top-[412px] sm:w-[42%]">
        {replyRows.map(([name, answer, time], index) => {
          const isVisible = isAtLeast("replies") && index <= activeIndex - 5;

          return (
            <div
              className={cn(
                "rounded-xl border border-[#cfe1dc] bg-[#edf7f4] px-3 py-2 text-xs font-bold text-[var(--primary-strong)] opacity-25 transition duration-500",
                isVisible && "opacity-100",
                reducedMotion && "transition-none"
              )}
              key={name}
            >
              #{index + 1} {name} — {answer} — {time}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "absolute left-5 right-5 top-[770px] rounded-xl border border-[#cfe1dc] bg-white px-4 py-3 opacity-0 shadow-sm transition sm:left-5 sm:right-auto sm:top-[470px] sm:w-[48%]",
          isAtLeast("merchant_validates") && "opacity-100",
          reducedMotion && "transition-none"
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Validation humaine
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
          Sarah confirmée
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          Le commerce garde le dernier mot.
        </p>
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-[#21313b] px-4 py-4 text-white shadow-md">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold">
            {isRecovered ? "Place récupérée, après validation." : "Progression"}
          </p>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
            {progressText}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[#d6ebe4]">
          Les réponses aident à décider. La confirmation reste humaine.
        </p>
      </div>

      <div
        aria-hidden={!isRecovered}
        className={cn(
          "absolute right-6 top-24 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-wide text-white opacity-0 shadow-lg transition duration-500",
          isRecovered && "opacity-100",
          isRecovered && !reducedMotion && "-rotate-2 scale-105",
          reducedMotion && "transition-none"
        )}
      >
        Place récupérée
      </div>
    </div>
  );
}
