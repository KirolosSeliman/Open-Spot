import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plannedFields = [
  "Nom du commerce",
  "Personne responsable",
  "Courriel professionnel",
  "Téléphone, optionnel",
  "Type de commerce",
  "Système de rendez-vous actuel",
  "Annulations estimées par semaine",
  "Liste client ou liste d’attente existante"
];

const discussionPoints = [
  "Votre système de rendez-vous actuel",
  "Le nombre d’annulations de dernière minute",
  "La qualité de votre liste client ou liste d’attente",
  "Les cas où un SMS ciblé serait utile",
  "Les limites à respecter pour ne pas sur-notifier vos clients"
];

const trustNotes = [
  "Vous gardez votre système de rendez-vous actuel.",
  "Vos clients n'ont pas besoin d'installer une app.",
  "Le ciblage SMS aide à réduire les notifications inutiles."
];

export default function FillCancellationsPage() {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  const hasBookingUrl = Boolean(bookingUrl);

  return (
    <PageShell>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-16">
        <div>
          <SectionHeading
            description="Demandez un appel de 15 minutes pour vérifier si 2e Chance RDV peut aider votre commerce à remplir des annulations avec des SMS ciblés, sans remplacer votre système actuel."
            eyebrow="Appel découverte"
            title="Voyons si vos annulations peuvent devenir des rendez-vous récupérés."
          />
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {hasBookingUrl ? (
              <ButtonLink href={bookingUrl} rel="noreferrer" target="_blank">
                Réserver mon appel de 15 min
              </ButtonLink>
            ) : (
              <ButtonLink href="#appel-15-min">
                Voir les prochaines étapes
              </ButtonLink>
            )}
            <ButtonLink href="/#comment-ca-marche" variant="secondary">
              Revoir le fonctionnement
            </ButtonLink>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Cette page sert à qualifier une demande liée aux annulations. Elle
            ne réserve pas automatiquement un rendez-vous, ne déclenche aucun SMS
            réel et ne stocke aucune donnée de prospect.
          </p>
        </div>

        <Card className="self-start">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Ce qu’on vérifie en 15 minutes
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            Court, concret, sans promesse magique.
          </h2>
          <ul className="mt-5 grid gap-3">
            {discussionPoints.map((point) => (
              <li
                className="rounded-lg border border-[var(--line)] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold leading-6 text-[var(--foreground)]"
                key={point}
              >
                {point}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section
        className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]"
        id="appel-15-min"
      >
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Demande d’appel
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            Les renseignements utiles sont simples.
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

        <Card className="bg-[#fff7ed]">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#8a4b11]">
            Réservation directe
          </p>
          {hasBookingUrl ? (
            <>
              <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
                Le lien de réservation est configuré.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Le bouton principal ouvre le lien de réservation dans un nouvel
                onglet. Aucun script tiers n’est intégré à cette page.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
                Le formulaire sera connecté bientôt.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Pour l’instant, cette page montre seulement les informations à
                préparer pour l’appel de 15 minutes. Elle ne soumet rien, ne
                réserve rien et ne conserve aucune information personnelle.
              </p>
              <p className="mt-4 rounded-lg border border-[#f0d9b8] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#8a4b11]">
                Quand un lien public de réservation sera choisi, il pourra être
                branché avec <code>NEXT_PUBLIC_BOOKING_URL</code>.
              </p>
            </>
          )}
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
