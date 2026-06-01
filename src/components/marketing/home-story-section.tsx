import { AnimatedRecoveryStory } from "@/components/marketing/animated-recovery-story";

export function HomeStorySection() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24"
      id="comment-ca-marche"
    >
      <div className="border-t border-[var(--line)] pt-10 lg:pt-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
          Comment ça fonctionne
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
          Une annulation. Une alerte ciblée. Une place récupérée.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Une petite histoire en huit moments, pensée pour expliquer le produit
          sans promesse magique&nbsp;: moins d&apos;envoi au hasard, plus de
          contrôle pour le commerce.
        </p>
      </div>

      <AnimatedRecoveryStory />
    </section>
  );
}
