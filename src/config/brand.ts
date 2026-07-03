import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export const brandConfig = {
  brandName: "Open Spot",
  alternateName: "2e Chance RDV",
  canonicalUrl: PRODUCTION_SITE_URL,
  description:
    "Open Spot aide les salons, barbiers, spas et cliniques beauté à récupérer les annulations de rendez-vous de dernière minute grâce à des alertes SMS envoyées aux clients inscrits, avec confirmation finale manuelle par le commerce.",
  locale: "fr-CA",
  targetMarkets: ["CA", "QC"] as const,
  serviceArea: {
    "@type": "Country" as const,
    name: "Canada"
  },
  logoPath: "/brand/open-spot-logo-mark.png",
  sameAs: [] as string[]
} as const;

export function getBrandLogoUrl(siteUrl: string = brandConfig.canonicalUrl) {
  return `${siteUrl.replace(/\/$/, "")}${brandConfig.logoPath}`;
}
