import { PRODUCTION_SITE_URL } from "@/lib/site-url";

export type BrandSocialLinks = {
  linkedin?: string;
  x?: string;
  facebook?: string;
  github?: string;
  googleBusiness?: string;
};

export const brand = {
  brandName: "Open Spot",
  alternateName: "2e Chance RDV",
  canonicalUrl: PRODUCTION_SITE_URL,
  shortDescription:
    "Open Spot aide les commerces à rendez-vous à remplir leurs annulations de dernière minute par SMS, avec confirmation manuelle par le marchand.",
  longDescription:
    "Open Spot (2e Chance RDV) est un service SaaS pour salons, barbiers, spas et cliniques beauté. Il alerte les clients intéressés par SMS lorsqu'une place se libère, recueille les réponses et laisse le commerce confirmer manuellement le rendez-vous.",
  targetMarkets: [
    "salons de coiffure",
    "barbiers",
    "spas",
    "cliniques esthétiques",
    "cliniques beauté",
    "studios d'ongles",
    "massothérapie"
  ],
  serviceArea: "Québec, Canada",
  defaultLocale: "fr-CA",
  logoPath: "/brand/open-spot-logo-mark.png",
  socialLinks: {} satisfies BrandSocialLinks
} as const;

export function getBrandSameAsLinks(): string[] {
  const { socialLinks } = brand;

  return Object.values(socialLinks).filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0
  );
}
