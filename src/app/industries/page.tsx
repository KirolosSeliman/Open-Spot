import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { InternalLinks } from "@/components/marketing/internal-links";
import { PageStructuredData } from "@/components/seo/page-structured-data";
import { Card } from "@/components/ui/card";
import {
  getPublicSeoPage,
  industryHubLinks
} from "@/lib/seo/public-pages";
import { createPageMetadata } from "@/lib/seo/metadata";

const page = getPublicSeoPage("/industries");

export const metadata = createPageMetadata(page.metadata);

const sections = [
  {
    title: "Un même problème : le créneau vide",
    body:
      "Salons, barbiers, spas et cliniques beauté vivent tous le même risque: une annulation tardive laisse du temps inutilisé et force l’équipe à chercher rapidement un client disponible."
  },
  {
    title: "Un workflow simple",
    body:
      "Votre équipe crée une ouverture, Open Spot alerte les clients consentants, les réponses arrivent au même endroit, puis le commerce confirme manuellement."
  },
  {
    title: "Pourquoi la validation reste manuelle",
    body:
      "Le bon client dépend parfois du service, de la durée, de la personne disponible et du contexte. Open Spot aide à voir les réponses sans enlever le jugement humain."
  },
  {
    title: "Open Spot n’est pas un système de réservation complet",
    body:
      "Le produit complète votre système actuel. Il se concentre sur la récupération de créneaux causés par des annulations de dernière minute."
  }
] as const;

export default function IndustriesPage() {
  return (
    <PageShell>
      <PageStructuredData
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Secteurs", path: "/industries" }
        ]}
        path="/industries"
      />

      <section className="os-container-wide min-w-0 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="os-kicker">Secteurs</p>
          <h1 className="os-page-title mt-5">
            Open Spot pour les commerces sur rendez-vous
          </h1>
          <p className="os-body-large mt-6">
            Open Spot aide les commerces locaux à remplir les annulations par
            SMS avec des clients consentants, des réponses centralisées et une
            confirmation manuelle par l’équipe.
          </p>
          <Link className="os-primary-cta mt-8" href="/book-call/questions">
            Réserver un appel
          </Link>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industryHubLinks.map((industry) => (
            <Link href={industry.href} key={industry.href}>
              <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--card-shadow)]" variant="metric">
                <h2 className="text-2xl font-black">{industry.label}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Voir comment Open Spot peut aider ce secteur à récupérer les
                  annulations de rendez-vous par SMS.
                </p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Card className="p-6" key={section.title} variant="soft">
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {section.body}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-14">
          <InternalLinks
            links={[
              { label: "Comment ça marche", href: "/how-it-works" },
              { label: "Tarifs", href: "/pricing" },
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
