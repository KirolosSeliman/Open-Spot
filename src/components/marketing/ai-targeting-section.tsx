const aiCards = [
  {
    title: "Historique de rendez-vous",
    text: "Évitez de relancer quelqu'un qui vient tout juste de réserver."
  },
  {
    title: "Pertinence du service",
    text: "Priorisez les clients intéressés par le bon type de rendez-vous."
  },
  {
    title: "Moins de fatigue",
    text: "Réduisez les notifications inutiles pour protéger votre liste SMS."
  },
  {
    title: "Contrôle humain",
    text: "L'IA aide à cibler. Le commerce choisit qui confirmer."
  }
];

export function AiTargetingSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24">
      <div className="grid gap-8 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Ciblage intelligent
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            Des SMS plus intelligents, pas plus nombreux.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            L&apos;agent IA aide à cibler les clients les plus pertinents selon
            le contexte du commerce, l&apos;historique de rendez-vous et le type
            de service. L&apos;objectif: moins de notifications inutiles, plus
            de respect pour vos clients, et un meilleur signal pour remplir le
            bon créneau.
          </p>
          <p className="mt-4 rounded-lg border border-[#f0d9b8] bg-[#fff7ed] px-4 py-3 text-sm font-semibold leading-6 text-[#8a4b11]">
            L&apos;IA n&apos;est pas une promesse magique et ne prend pas la
            décision à votre place. Elle aide à prioriser; vous gardez le
            dernier mot.
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
      aria-label="Exemple illustré de ciblage: certains clients ne sont pas priorisés, d'autres peuvent recevoir un SMS."
      className="rounded-2xl border border-[#cfe1dc] bg-[#edf7f4] p-4"
      role="img"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center text-xs font-bold leading-4 text-[var(--primary-strong)] shadow-sm">
          Agent
          <br />
          IA
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">
            Qui devrait recevoir le SMS?
          </p>
          <p className="text-xs leading-5 text-[var(--muted)]">
            Un exemple de priorisation, pas une décision automatique.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {[
          ["Ariane", "Réservé il y a 6 jours", "Pas prioritaire"],
          ["Maya", "Pas venue depuis 3 semaines", "Bonne candidate"],
          ["Noah", "Service différent", "À vérifier"]
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
