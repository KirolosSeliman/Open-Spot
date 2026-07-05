import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { InternalLinks } from "@/components/marketing/internal-links";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { PageStructuredData } from "@/components/seo/page-structured-data";
import { Card } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getPublicSeoPage, howItWorksFaq } from "@/lib/seo/public-pages";

const page = getPublicSeoPage("/how-it-works");

export const metadata = createPageMetadata(page.metadata);

const steps = [
  {
    title: "Un client annule ou un créneau se libère",
    text: "Votre équipe garde son calendrier actuel. Open Spot intervient quand une place devient disponible et qu’il faut prévenir les bonnes personnes rapidement."
  },
  {
    title: "Le commerce crée un créneau disponible",
    text: "Vous indiquez l’heure, le service, la durée et les détails utiles pour éviter un message vague ou difficile à traiter."
  },
  {
    title: "Open Spot envoie une alerte SMS aux clients consentants",
    text: "L’alerte vise les clients admissibles qui ont accepté de recevoir ce type de message lié aux rendez-vous."
  },
  {
    title: "Les clients répondent OUI / YES / 1",
    text: "Les réponses sont regroupées pour aider votre équipe à voir rapidement qui est intéressé par le créneau."
  },
  {
    title: "Le commerce choisit manuellement qui confirmer",
    text: "Votre équipe révise les réponses, vérifie le contexte et confirme manuellement le client qui convient le mieux."
  }
] as const;

export default function HowItWorksPage() {
  return (
    <PageShell>
      <PageStructuredData
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Comment ça marche", path: "/how-it-works" }
        ]}
        faq={howItWorksFaq}
        path="/how-it-works"
      />

      <section className="os-container-wide min-w-0 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="os-kicker">Comment ça marche</p>
          <h1 className="os-page-title mt-5">
            Comment Open Spot remplit une annulation de rendez-vous par SMS
          </h1>
          <p className="os-body-large mt-6">
            Open Spot aide les commerces sur rendez-vous à transformer un créneau
            libéré en alerte SMS claire, avec consentement client, réponses
            centralisées et confirmation manuelle par l’équipe.
          </p>
          <Link className="os-primary-cta mt-8" href="/book-call/questions">
            Réserver un appel
          </Link>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => (
            <Card className="p-6" key={step.title} variant="metric">
              <p className="text-sm font-black text-[var(--primary)]">
                Étape {index + 1}
              </p>
              <h2 className="mt-4 text-xl font-black leading-tight">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {step.text}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <Card className="p-6" variant="soft">
            <h2 className="text-2xl font-black">Aucune attribution sans validation humaine</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Open Spot ne décide pas qui obtient la place. Le commerce garde le
              contrôle, révise les réponses et confirme manuellement dans son
              processus habituel.
            </p>
          </Card>
          <Card className="p-6" variant="soft">
            <h2 className="text-2xl font-black">Consentement SMS et STOP</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Les alertes sont prévues pour des clients consentants. Les demandes
              STOP doivent être respectées avant tout nouvel envoi.
            </p>
          </Card>
          <Card className="p-6" variant="soft">
            <h2 className="text-2xl font-black">Complète votre système actuel</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Open Spot n’est pas un calendrier complet. Il ajoute une couche SMS
              pour récupérer les annulations quand une place devient disponible.
            </p>
          </Card>
        </div>

        <section className="mt-14 rounded-[2rem] bg-[#050505] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-wide text-white/55">
            Exemple de SMS
          </p>
          <p className="mt-4 text-2xl font-black leading-snug">
            “Open Spot: une place s’est libérée demain à 10 h pour un soin de
            60 min. Répondez OUI si vous êtes disponible. STOP pour arrêter.”
          </p>
        </section>

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SeoFaq items={howItWorksFaq} />
          <InternalLinks
            links={[
              { label: "Tarifs", href: "/pricing" },
              { label: "Secteurs", href: "/industries" },
              { label: "Annulations par SMS", href: "/annulations-rendez-vous-sms" },
              { label: "Liste d’attente SMS", href: "/liste-attente-sms" },
              { label: "Réserver un appel", href: "/book-call/questions" }
            ]}
          />
        </div>
      </section>
    </PageShell>
  );
}
