import { PageShell } from "@/components/layout/page-shell";
import { AiTargetingSection } from "@/components/marketing/ai-targeting-section";
import { HomeStorySection } from "@/components/marketing/home-story-section";
import { ButtonLink } from "@/components/ui/button";

const homepageCopy = {
  hero: {
    eyebrow: "Récupération d'annulations par SMS",
    title: "Remplissez vos annulations de dernière minute par SMS.",
    subtitle:
      "Gardez votre système de rendez-vous actuel. Quand une place se libère, les bons clients sont notifiés par SMS et peuvent réserver rapidement.",
    aiLine:
      "Un agent IA aide à cibler les bons clients pour éviter les notifications inutiles.",
    primaryCta: "Remplir mes annulations",
    secondaryCta: "Voir comment ça fonctionne"
  },
  trustChips: [
    "Pas de nouvelle app client",
    "Gardez votre système actuel",
    "SMS ciblés",
    "Validation par le commerce"
  ]
};

export default function HomePage() {
  return (
    <PageShell>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            {homepageCopy.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            {homepageCopy.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            {homepageCopy.hero.subtitle}
          </p>
          <p className="mt-4 max-w-2xl rounded-lg border border-[#cfe1dc] bg-[#edf7f4] px-4 py-3 text-sm font-semibold leading-6 text-[var(--primary-strong)]">
            {homepageCopy.hero.aiLine}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/remplir-mes-annulations">
              {homepageCopy.hero.primaryCta}
            </ButtonLink>
            <ButtonLink href="#comment-ca-marche" variant="secondary">
              {homepageCopy.hero.secondaryCta}
            </ButtonLink>
          </div>
          <ul className="mt-7 flex flex-wrap gap-2" aria-label="Points de confiance">
            {homepageCopy.trustChips.map((chip) => (
              <li
                className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] shadow-sm"
                key={chip}
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>

        <HeroCartoonPanel />
      </section>

      <HomeStorySection />
      <AiTargetingSection />
    </PageShell>
  );
}

function HeroCartoonPanel() {
  return (
    <div
      aria-label="Illustration: une annulation est récupérée avec un assistant IA et des SMS ciblés."
      className="relative min-h-[440px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[#fffaf1] p-5 shadow-sm"
      role="img"
    >
      <div className="absolute inset-x-5 top-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Aujourd&apos;hui
          </p>
          <p className="text-sm font-bold text-[var(--foreground)]">
            Coupe + barbe · 14 h 30
          </p>
        </div>
        <span className="rounded-full bg-[#fdebea] px-3 py-1 text-xs font-bold text-[#8a1f17]">
          Annulé
        </span>
      </div>

      <div className="absolute left-7 top-32 h-44 w-36 rounded-t-full border-8 border-[#21313b] bg-[#d6ebe4]">
        <div className="absolute left-3 top-20 h-16 w-24 rounded-t-3xl bg-[#b98b61]" />
        <div className="absolute -bottom-8 left-4 h-10 w-28 rounded-b-xl bg-[#21313b]" />
      </div>

      <div className="absolute left-24 top-28 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] shadow-md">
        Ouf... qui peut venir vite&nbsp;?
      </div>

      <div className="absolute right-10 top-28 grid h-28 w-28 place-items-center rounded-full border border-[#b9d9cf] bg-[#e9f7f2] shadow-md">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center text-xs font-bold leading-4 text-[var(--primary-strong)]">
          Agent
          <br />
          IA
        </div>
      </div>

      <div className="absolute right-6 top-64 grid w-56 gap-3">
        {["Maya · coupe récente", "Sam · dispo mardi", "Nora · préfère SMS"].map(
          (customer) => (
            <div
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm"
              key={customer}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#edf7f4] text-xs text-[var(--primary-strong)]">
                SMS
              </span>
              {customer}
            </div>
          )
        )}
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-[#cfe1dc] bg-[#edf7f4] px-4 py-3">
        <p className="text-sm font-bold text-[var(--primary-strong)]">
          Réponse reçue&nbsp;: &quot;Oui, je peux venir.&quot;
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Le commerce garde le contrôle et confirme le bon client.
        </p>
      </div>
    </div>
  );
}
