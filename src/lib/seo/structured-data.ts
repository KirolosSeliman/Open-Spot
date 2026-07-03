import { brandConfig, getBrandLogoUrl } from "@/config/brand";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildOrganizationJsonLd(siteUrl: string = resolveConfiguredSiteUrl()) {
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandConfig.brandName,
    alternateName: brandConfig.alternateName,
    url: siteUrl,
    description: brandConfig.description,
    logo: getBrandLogoUrl(siteUrl),
    areaServed: brandConfig.serviceArea
  };

  if (brandConfig.sameAs.length > 0) {
    organization.sameAs = brandConfig.sameAs;
  }

  return organization;
}

export function buildWebSiteJsonLd(siteUrl: string = resolveConfiguredSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandConfig.brandName,
    alternateName: brandConfig.alternateName,
    url: siteUrl,
    inLanguage: brandConfig.locale
  };
}

export function buildWebApplicationJsonLd(siteUrl: string = resolveConfiguredSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brandConfig.brandName,
    alternateName: brandConfig.alternateName,
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["fr-CA", "en-CA"],
    description: brandConfig.description
  };
}

export function buildGlobalStructuredData(siteUrl: string = resolveConfiguredSiteUrl()) {
  return [
    buildOrganizationJsonLd(siteUrl),
    buildWebSiteJsonLd(siteUrl),
    buildWebApplicationJsonLd(siteUrl)
  ];
}
