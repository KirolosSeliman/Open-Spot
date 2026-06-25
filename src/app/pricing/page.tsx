import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/i18n/locale";

const pricingCopy = {
  fr: {
    eyebrow: "Tarifs",
    title: "Des tarifs adaptes a votre commerce.",
    description:
      "Le modèle commercial est défini après avoir compris votre volume d’annulations, vos services, votre usage SMS et votre façon de confirmer les rendez-vous.",
    cards: [
      ["Point de départ", "Discuté après un appel", "Aucun prix public fixe n’est affiché parce que le bon modèle dépend de votre réalité opérationnelle."],
      ["Usage SMS", "Clair avant l’envoi", "Le volume, les mots-clés d’opt-out et les limites d’usage doivent être compris avant le déploiement."],
      ["Contrôle marchand", "Validation manuelle", "Open Spot ne promet pas de revenu garanti; le commerce garde toujours la validation finale."]
    ],
    bundlesTitle: "Des forfaits simples avant de parler facturation.",
    bundlesDescription:
      "Open Spot reste centré sur la récupération d’annulations par SMS, pas sur une suite CRM complète.",
    bundles: [
      ["Essentiel SMS", "Liste d’attente, consentement, QR code et messages de base."],
      ["Anti No-Show", "Rappels sobres, suivi des réponses et respect des désinscriptions."],
      ["Recovery Pro", "Ouvertures, audiences admissibles, réponses classées et validation manuelle."],
      ["Support opérationnel", "Mise en place adaptée au commerce, sans changer le calendrier actuel."]
    ],
    trust: ["SMS avec consentement", "Le commerce garde le controle", "STOP / ARRET supportes", "Aucune app client", "Validation manuelle"],
    cta: "Discuter des tarifs"
  },
  en: {
    eyebrow: "Pricing",
    title: "Pricing adapted to your business.",
    description:
      "The commercial model is defined after understanding your cancellation volume, services, SMS usage, and confirmation workflow.",
    cards: [
      ["Starting point", "Discussed after a call", "No fixed public price is shown because the right model depends on your operating reality."],
      ["SMS usage", "Clear before sending", "Volume, opt-out keywords, and usage limits should be understood before rollout."],
      ["Merchant control", "Manual validation", "Open Spot does not promise guaranteed revenue; the merchant always keeps final validation."]
    ],
    bundlesTitle: "Simple bundles before billing tiers.",
    bundlesDescription:
      "Open Spot stays focused on SMS cancellation recovery, not a full CRM suite.",
    bundles: [
      ["Essential SMS", "Waitlist, consent, QR code, and core messages."],
      ["Anti No-Show", "Simple reminders, reply tracking, and opt-out respect."],
      ["Recovery Pro", "Openings, eligible audiences, ranked replies, and manual validation."],
      ["Operational support", "Setup adapted to the business without changing the current calendar."]
    ],
    trust: ["SMS with consent", "Merchant keeps control", "STOP / ARRET supported", "No customer app", "Manual validation"],
    cta: "Book a call"
  }
} as const;

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const t = pricingCopy[locale];

  return (
    <PageShell>
      <section className="os-container-wide py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="os-kicker">{t.eyebrow}</p>
          <h1 className="os-page-title mt-5">{t.title}</h1>
          <p className="os-body-large mt-6">{t.description}</p>
          <Link className="os-primary-cta mt-8" href="/book-call">
            {t.cta}
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {t.cards.map(([label, title, text]) => (
            <Card className="p-6" key={label}>
              <p className="text-sm font-black text-[var(--primary)]">{label}</p>
              <h2 className="mt-4 text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{text}</p>
            </Card>
          ))}
        </div>

        <section className="mt-16 rounded-[2.4rem] border border-[var(--line)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <h2 className="os-section-title">{t.bundlesTitle}</h2>
              <p className="os-body-large mt-5">{t.bundlesDescription}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {t.trust.map((point) => (
                  <span className="os-chip" key={point}>{point}</span>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              {t.bundles.map(([title, text]) => (
                <article className="rounded-[1.5rem] border border-[var(--line)] bg-slate-50 p-5" key={title}>
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </PageShell>
  );
}
