const aiCards = [
  {
    title: "Historique de rendez-vous",
    text: "Evitez de relancer quelqu'un qui vient tout juste de reserver."
  },
  {
    title: "Pertinence du service",
    text: "Priorisez les clients interesses par le bon type de rendez-vous."
  },
  {
    title: "Moins de fatigue",
    text: "Reduisez les notifications inutiles pour proteger votre liste SMS."
  },
  {
    title: "Controle humain",
    text: "Les criteres aident a preparer la liste. Le commerce choisit qui confirmer."
  }
];

export function AiTargetingSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="grid gap-8 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Ciblage IA planifie
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            Des SMS plus pertinents, sans promesse automatique.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Open Spot est pense pour enrichir plus tard la preparation de liste
            avec de l&apos;aide par IA. Aujourd&apos;hui, la logique reste centree sur
            les services choisis, les preferences, le consentement SMS et la
            validation manuelle du commerce.
          </p>
          <p className="mt-4 rounded-lg border border-[#f0d9b8] bg-[#fff7ed] px-4 py-3 text-sm font-semibold leading-6 text-[#8a4b11]">
            L&apos;IA ne confirme pas de rendez-vous et ne remplace pas la decision
            humaine. Vous gardez le dernier mot.
          </p>
        </div>

        <div>
          <AiDecisionPanel />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {aiCards.map((card) => (
              <article
                className="rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                key={card.title}
              >
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AiDecisionPanel() {
  return (
    <div
      aria-label="Exemple illustre de ciblage: certains clients ne sont pas priorises, d'autres peuvent recevoir un SMS."
      className="rounded-2xl border border-[#cfe1dc] bg-[#edf7f4] p-4"
      role="img"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center text-xs font-bold leading-4 text-[var(--primary-strong)] shadow-sm">
          Liste
          <br />
          SMS
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">
            Qui devrait recevoir le SMS?
          </p>
          <p className="text-xs leading-5 text-[var(--muted)]">
            Un exemple de priorisation, pas une decision automatique.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {[
          ["Ariane", "Reserve il y a 6 jours", "Pas prioritaire"],
          ["Maya", "Pas venue depuis 3 semaines", "Bonne candidate"],
          ["Noah", "Service different", "A verifier"]
        ].map(([name, detail, status]) => (
          <div
            className="grid gap-3 rounded-xl bg-white p-3 text-sm shadow-sm sm:grid-cols-[0.8fr_1fr_auto] sm:items-center"
            key={name}
          >
            <p className="font-bold text-[var(--foreground)]">{name}</p>
            <p className="text-[var(--muted)]">{detail}</p>
            <span className="rounded-full bg-[#f1f3ef] px-3 py-1 text-xs font-bold text-[var(--foreground)]">
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
