import type { Metadata } from "next";
import Link from "next/link";

import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Liste d'attente SMS pour salons",
  description:
    "Ressource sur la mise en place d'une liste d'attente SMS pour salons, barbiers, spas et cliniques beauté, avec consentement et confirmation manuelle.",
  path: "/resources/liste-attente-sms-salons"
});

export default function ResourceListeAttenteSmsPage() {
  return (
    <SeoLandingPage
      description="Éléments essentiels à prévoir avant d'envoyer des alertes SMS lors d'une annulation de rendez-vous."
      eyebrow="Ressource"
      sections={[
        {
          title: "Consentement avant envoi",
          paragraphs: [
            "Chaque client doit accepter de recevoir des messages liés aux places libérées. Conservez une trace du consentement et respectez les demandes de désinscription."
          ]
        },
        {
          title: "Contenu des messages",
          paragraphs: [
            "Les alertes doivent être courtes, claires et liées au service concerné. Indiquez comment répondre et rappelez que la confirmation finale revient au commerce."
          ]
        },
        {
          title: "Gestion des réponses",
          paragraphs: [
            "Prévoyez un processus pour lire les réponses, classer les clients intéressés et confirmer manuellement la personne retenue."
          ],
          bullets: [
            "Ne pas promettre une place sans validation interne",
            "Ne pas confirmer automatiquement le premier répondant",
            "Respecter STOP / ARRET immédiatement"
          ]
        },
        {
          title: "Secteurs visés",
          paragraphs: [
            "Salons, barbiers, spas, cliniques esthétiques et autres commerces à rendez-vous qui perdent du revenu lors d'annulations tardives."
          ]
        }
      ]}
      title="Liste d'attente SMS pour salons et cliniques"
    >
      <p className="mt-8 text-sm text-[var(--muted)]">
        Voir aussi le{" "}
        <Link className="font-bold text-[var(--primary)] hover:underline" href="/guides/remplir-annulations-rdv-sms">
          guide pratique sur les annulations par SMS
        </Link>
        .
      </p>
    </SeoLandingPage>
  );
}
