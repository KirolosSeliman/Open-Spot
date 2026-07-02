import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "SMS pour salons et esthétique",
  description:
    "Open Spot aide les salons et cliniques esthétiques à remplir leurs annulations de dernière minute par SMS, avec confirmation manuelle.",
  path: "/sms-pour-salons-esthetique"
});

export default function SmsPourSalonsEsthetiquePage() {
  return (
    <SeoLandingPage
      description="Pour les salons de coiffure, studios d'ongles et cliniques esthétiques qui perdent des revenus quand un rendez-vous est annulé à la dernière minute."
      eyebrow="Salons et esthétique"
      sections={[
        {
          title: "Contexte salon et esthétique",
          paragraphs: [
            "Les services sont souvent planifiés à l'avance et les créneaux libérés tardivement sont difficiles à remplir sans perturber l'équipe en réception.",
            "Open Spot permet d'alerter rapidement les clients déjà intéressés, sans promettre qu'une place sera automatiquement confirmée."
          ]
        },
        {
          title: "Flux typique",
          paragraphs: [
            "Un client annule. Vous créez une place disponible dans Open Spot. Les clients admissibles reçoivent un SMS. Vous examinez les réponses et confirmez manuellement la personne retenue."
          ],
          bullets: [
            "Liste d'attente par service",
            "Consentement SMS avant tout envoi",
            "Réponses OUI classées",
            "Validation manuelle avant confirmation"
          ]
        }
      ]}
      title="SMS pour salons et cliniques esthétiques"
    />
  );
}
