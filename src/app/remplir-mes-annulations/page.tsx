import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plannedFields = [
  "Votre nom",
  "Nom du commerce",
  "Courriel",
  "Téléphone, optionnel",
  "Type de commerce",
  "Système de rendez-vous actuel",
  "Annulations estimées par semaine",
  "Message, optionnel"
];

const trustNotes = [
  "Vous gardez votre système de rendez-vous actuel.",
  "Vos clients n'ont pas besoin d'installer une app.",
  "Le ciblage SMS aide à réduire les notifications inutiles."
];

export default function FillCancellationsPage() {
  return (
    <PageShell>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
        <div>
          <SectionHeading
            description="Réservez un appel de 15 minutes pour voir si votre commerce peut récupérer plus de rendez-vous annulés grâce aux SMS ciblés."
            eyebrow="Appel découverte"
            title="Voyons si 2e Chance RDV peut remplir vos annulations."
          />
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact">Demander mon appel de 15 min</ButtonLink>
            <ButtonLink href="/#comment-ca-marche" variant="secondary">
              Revoir le fonctionnement
            </ButtonLink>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Le formulaire d&apos;envoi sera connecté après le choix du canal de
            prise de rendez-vous. Pour l&apos;instant, ce bouton mène vers la page
            contact et aucune donnée de prospect n&apos;est stockée depuis cette
            page.
          </p>
        </div>

        <Card className="self-start">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Préparation de l&apos;appel
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            Les questions seront courtes.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {plannedFields.map((field) => (
              <div
                className="rounded-lg border border-[var(--line)] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-[var(--foreground)]"
                key={field}
              >
                {field}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {trustNotes.map((note) => (
            <Card key={note}>
              <p className="text-sm font-semibold leading-6 text-[var(--foreground)]">
                {note}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
