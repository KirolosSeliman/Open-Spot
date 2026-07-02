import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "SMS pour barbiers",
  description:
    "Open Spot aide les barbiers à remplir les annulations de dernière minute par SMS tout en gardant le contrôle de la confirmation client.",
  path: "/sms-pour-barbiers"
});

export default function SmsPourBarbiersPage() {
  return (
    <SeoLandingPage
      description="Pour les barbiers et barbershops qui veulent réagir vite à une annulation sans appeler toute la liste d'attente au téléphone."
      eyebrow="Barbiers"
      sections={[
        {
          title: "Pourquoi les barbiers utilisent une liste d'attente SMS",
          paragraphs: [
            "Les journées sont souvent pleines et une annulation de dernière minute laisse un fauteuil inoccupé.",
            "Open Spot permet d'envoyer une alerte SMS aux clients qui ont accepté d'être contactés pour une place libérée."
          ]
        },
        {
          title: "Contrôle marchand",
          paragraphs: [
            "Le barbier ou la réception garde toujours la décision finale. Open Spot ne confirme jamais automatiquement un client à la place du commerce."
          ],
          bullets: [
            "Réponses reçues par SMS",
            "Classement par ordre de réponse",
            "Confirmation manuelle",
            "Respect des désinscriptions STOP / ARRET"
          ]
        }
      ]}
      title="Remplir les annulations de barbier par SMS"
    />
  );
}
