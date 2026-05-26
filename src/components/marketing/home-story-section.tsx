const storySteps = [
  {
    title: "Une annulation de dernière minute, ça fait mal.",
    text: "Une chaise vide, c'est du temps perdu et du revenu qui disparaît.",
    label: "Annulation"
  },
  {
    title: "Texter tout le monde à la main, ce n'est pas une solution.",
    text: "Trop lent pour vous. Trop fatigant pour vos clients.",
    label: "Stress"
  },
  {
    title: "L'agent IA apparaît sans prendre le contrôle.",
    text: "Il aide à lire le contexte, mais le commerce reste celui qui décide.",
    label: "Agent IA"
  },
  {
    title: "L'agent IA cible les bons clients.",
    text: "Il aide à éviter d'envoyer des notifications à des clients qui viennent tout juste de réserver.",
    label: "Ciblage"
  },
  {
    title: "Moins de messages inutiles. Plus de pertinence.",
    text: "Les clients les plus susceptibles d'être intéressés sont priorisés.",
    label: "SMS ciblés"
  },
  {
    title: "Vos clients répondent simplement par SMS.",
    text: "Aucune app à installer. Aucun processus compliqué.",
    label: "Réponses"
  },
  {
    title: "Vous gardez le contrôle.",
    text: "Les réponses sont classées, mais c'est vous qui choisissez qui confirmer.",
    label: "Validation"
  },
  {
    title: "Une annulation devient une deuxième chance.",
    text: "Le créneau vide peut redevenir un rendez-vous rempli.",
    label: "Récupéré"
  }
];

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
          Une annulation. Un agent IA. Une place récupérée.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Une petite histoire en huit moments, pensée pour expliquer le produit
          sans promesse magique&nbsp;: moins d&apos;envoi au hasard, plus de
          contrôle pour le commerce.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <CartoonRecoveryScene />
        </div>
        <div className="grid gap-4">
          {storySteps.map((step, index) => (
            <article
              className="rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              key={step.title}
            >
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#edf7f4] text-sm font-bold text-[var(--primary-strong)]">
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
          ))}
        </div>
      </div>
    </section>
  );
}

function CartoonRecoveryScene() {
  return (
    <div
      aria-label="Scène illustrée: une annulation est ciblée par l'agent IA, les SMS partent, les réponses sont classées, puis le commerce confirme une place."
      className="relative min-h-[520px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[#fffaf1] p-5 shadow-sm"
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
          <span className="rounded-full bg-[#fdebea] px-3 py-1 text-xs font-bold text-[#8a1f17]">
            Annulé
          </span>
        </div>
      </div>

      <div className="absolute left-8 top-28 h-36 w-32 rounded-t-full border-8 border-[#21313b] bg-[#d6ebe4]">
        <div className="absolute left-4 top-16 h-12 w-20 rounded-t-3xl bg-[#b98b61]" />
        <div className="absolute -bottom-7 left-4 h-9 w-24 rounded-b-xl bg-[#21313b]" />
      </div>
      <div className="absolute left-24 top-28 max-w-[180px] rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-5 text-[var(--foreground)] shadow-md">
        Je pourrais texter 47 personnes... ou respirer.
      </div>

      <div className="absolute right-8 top-28 grid h-32 w-32 place-items-center rounded-full border border-[#b9d9cf] bg-[#e9f7f2] shadow-md">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center text-xs font-bold leading-4 text-[var(--primary-strong)]">
          Agent
          <br />
          IA
        </div>
      </div>
      <div className="absolute right-28 top-52 h-10 w-10 rounded-full border border-[#b9d9cf] bg-white" />
      <div className="absolute right-20 top-60 h-6 w-6 rounded-full bg-[#edf7f4]" />

      <div className="absolute left-5 top-[280px] grid w-[46%] gap-2">
        {["Pas pertinent", "Déjà réservé", "Bonne candidate"].map((item, index) => (
          <div
            className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] shadow-sm"
            key={item}
          >
            <span>{item}</span>
            <span
              className={
                index === 2
                  ? "rounded-full bg-[#edf7f4] px-2 py-1 text-[var(--primary-strong)]"
                  : "rounded-full bg-[#f1f3ef] px-2 py-1 text-[var(--muted)]"
              }
            >
              {index === 2 ? "SMS" : "Skip"}
            </span>
          </div>
        ))}
      </div>

      <div className="absolute right-5 top-[284px] grid w-[44%] gap-2">
        {["Oui, je peux venir", "Dispo si plus tard", "Pas cette fois"].map(
          (reply, index) => (
            <div
              className="rounded-xl border border-[#cfe1dc] bg-[#edf7f4] px-3 py-2 text-xs font-bold text-[var(--primary-strong)]"
              key={reply}
            >
              #{index + 1} {reply}
            </div>
          )
        )}
      </div>

      <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-[#21313b] px-4 py-4 text-white shadow-md">
        <p className="text-sm font-bold">Place récupérée, après validation.</p>
        <p className="mt-1 text-xs leading-5 text-[#d6ebe4]">
          Les réponses aident à décider. La confirmation reste humaine.
        </p>
      </div>
    </div>
  );
}
