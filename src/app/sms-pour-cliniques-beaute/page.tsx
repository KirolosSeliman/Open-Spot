import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "SMS pour cliniques beauté",
  description:
    "Open Spot aide les cliniques beauté et med spas à remplir leurs annulations de dernière minute par SMS, avec validation manuelle.",
  path: "/sms-pour-cliniques-beaute"
});

export default function SmsPourCliniquesBeautePage() {
  return (
    <SeoLandingPage
      description="Pour les cliniques beauté, med spas et centres esthétiques qui veulent combler les créneaux libérés sans changer leur système de réservation."
      eyebrow="Cliniques beauté"
      sections={[
        {
          title: "Créneaux libérés en clinique beauté",
          paragraphs: [
            "Les traitements planifiés représentent souvent un bloc de temps important. Une annulation tardive est difficile à combler sans processus structuré.",
            "Open Spot s'ajoute à votre calendrier actuel et ne remplace pas votre logiciel de rendez-vous."
          ]
        },
        {
          title: "Approche respectueuse du consentement",
          paragraphs: [
            "Seuls les clients ayant accepté de recevoir des alertes SMS sont contactés. Le commerce confirme manuellement le rendez-vous retenu."
          ],
          bullets: [
            "Consentement explicite avant envoi",
            "Messages liés au service concerné",
            "Pas de confirmation automatique",
            "Désinscription STOP / ARRET supportée"
          ]
        }
      ]}
      title="SMS pour cliniques beauté et med spas"
    />
  );
}
