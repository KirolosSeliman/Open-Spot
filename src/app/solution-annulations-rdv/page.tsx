import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Solution SMS pour annulations de rendez-vous",
  description:
    "Open Spot aide les commerces à rendez-vous à remplir leurs annulations de dernière minute par SMS, avec validation manuelle par le marchand.",
  path: "/solution-annulations-rdv"
});

export default function SolutionAnnulationsRdvPage() {
  return (
    <SeoLandingPage
      description="Open Spot (2e Chance RDV) alerte les clients intéressés par SMS, recueille les réponses et laisse votre équipe confirmer manuellement le rendez-vous."
      eyebrow="Solution"
      sections={[
        {
          title: "Le problème des annulations de dernière minute",
          paragraphs: [
            "Une chaise ou une cabine vide représente un revenu perdu. Appeler manuellement une liste de clients prend du temps et n'est pas toujours réaliste en pleine journée.",
            "Open Spot complète votre système de réservation actuel sans le remplacer."
          ]
        },
        {
          title: "Comment Open Spot répond",
          paragraphs: [
            "Les clients s'inscrivent à une liste d'attente SMS avec consentement explicite. Lorsqu'une place se libère, vous pouvez envoyer une alerte aux personnes admissibles selon le service concerné."
          ],
          bullets: [
            "Consentement SMS et désinscription STOP / ARRET",
            "Messages ciblés selon les services choisis",
            "Réponses classées pour faciliter la décision",
            "Confirmation manuelle par le commerce"
          ]
        },
        {
          title: "Pour qui",
          paragraphs: [
            "Salons, barbiers, spas, cliniques beauté et autres commerces fonctionnant sur rendez-vous au Québec et au Canada."
          ]
        }
      ]}
      title="Remplir les annulations de rendez-vous par SMS"
    />
  );
}
