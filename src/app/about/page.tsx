import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SeoLandingPage } from "@/components/seo/seo-landing-page";
import { brand } from "@/lib/brand";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "À propos d'Open Spot",
  description:
    "Open Spot est la marque officielle derrière 2e Chance RDV. Découvrez comment nous aidons les commerces à rendez-vous à remplir leurs annulations par SMS.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <>
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `À propos de ${brand.brandName}`,
          url: `${brand.canonicalUrl}/about`,
          description: brand.longDescription,
          inLanguage: brand.defaultLocale,
          isPartOf: {
            "@type": "WebSite",
            name: brand.brandName,
            url: brand.canonicalUrl
          }
        }}
      />
      <SeoLandingPage
        description="Open Spot est la marque officielle. 2e Chance RDV est le nom public francophone du produit. Le site officiel est open-spot.ca."
        eyebrow="Marque"
        sections={[
          {
            title: "Qui sommes-nous",
            paragraphs: [
              `${brand.brandName} aide les commerces à rendez-vous à récupérer des revenus perdus lors d'annulations de dernière minute.`,
              `${brand.alternateName} est le nom public francophone utilisé pour décrire le même service. Les deux renvoient au site officiel ${brand.canonicalUrl}.`
            ]
          },
          {
            title: "Ce que fait le produit",
            paragraphs: [
              "Lorsqu'un rendez-vous est annulé, Open Spot peut alerter par SMS les clients qui ont accepté de recevoir des offres de dernière minute.",
              "Les clients intéressés répondent simplement. Le commerce examine les réponses et confirme manuellement la personne retenue. Aucune confirmation automatique n'est effectuée."
            ],
            bullets: [
              "Liste d'attente SMS avec consentement explicite",
              "Alertes lors d'une annulation ou d'une place libérée",
              "Réponses classées pour faciliter la décision",
              "Validation manuelle par le marchand"
            ]
          },
          {
            title: "Pour quels commerces",
            paragraphs: [
              "Le service vise d'abord les salons, barbiers, spas et cliniques beauté ou esthétiques, ainsi que d'autres commerces fonctionnant sur rendez-vous."
            ],
            bullets: [...brand.targetMarkets]
          }
        ]}
        title="Open Spot, la marque officielle de 2e Chance RDV"
      />
    </>
  );
}
