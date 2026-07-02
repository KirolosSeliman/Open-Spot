import type { Metadata } from "next";
import Link from "next/link";

import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Guide : remplir les annulations de RDV par SMS",
  description:
    "Guide pratique pour mettre en place une liste d'attente SMS et remplir les annulations de dernière minute, avec confirmation manuelle.",
  path: "/guides/remplir-annulations-rdv-sms"
});

export default function GuideRemplirAnnulationsPage() {
  return (
    <SeoLandingPage
      description="Étapes concrètes pour salons, barbiers, spas et cliniques beauté qui veulent réagir plus vite aux annulations sans automatiser la confirmation client."
      eyebrow="Guide"
      sections={[
        {
          title: "1. Constater le coût d'une annulation tardive",
          paragraphs: [
            "Un créneau libéré la veille ou le jour même est souvent difficile à remplir par téléphone seul, surtout pendant les heures d'affluence."
          ]
        },
        {
          title: "2. Mettre en place une liste d'attente avec consentement",
          paragraphs: [
            "Les clients doivent accepter explicitement de recevoir des alertes SMS. Un QR code en réception ou un lien d'inscription peut simplifier l'inscription.",
            "Prévoyez un mécanisme clair de désinscription (STOP / ARRET)."
          ]
        },
        {
          title: "3. Définir quand envoyer une alerte",
          paragraphs: [
            "Lorsqu'une annulation survient, identifiez le service concerné et les clients admissibles selon leur consentement et leurs préférences de service."
          ]
        },
        {
          title: "4. Examiner les réponses et confirmer manuellement",
          paragraphs: [
            "Les réponses positives ne doivent pas déclencher une confirmation automatique. Le commerce choisit qui confirmer et communique ensuite avec le client retenu."
          ],
          bullets: [
            "Classer les réponses par ordre d'arrivée",
            "Confirmer une seule personne à la fois",
            "Informer les autres clients si la place est comblée"
          ]
        }
      ]}
      title="Comment remplir les annulations de rendez-vous par SMS"
    >
      <p className="mt-8 text-sm text-[var(--muted)]">
        Ressource complémentaire :{" "}
        <Link className="font-bold text-[var(--primary)] hover:underline" href="/resources/liste-attente-sms-salons">
          liste d&apos;attente SMS pour salons
        </Link>
        .
      </p>
    </SeoLandingPage>
  );
}
