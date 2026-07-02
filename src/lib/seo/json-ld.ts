import { brand, getBrandSameAsLinks } from "@/lib/brand";
import { buildPublicPageUrl } from "@/lib/seo/public-pages";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

type JsonLd = Record<string, unknown>;

export function buildOrganizationJsonLd(siteUrl = resolveConfiguredSiteUrl()): JsonLd {
  const logoUrl = buildPublicPageUrl(siteUrl, brand.logoPath);
  const sameAs = getBrandSameAsLinks();

  const organization: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.brandName,
    alternateName: brand.alternateName,
    url: brand.canonicalUrl,
    logo: logoUrl,
    description: brand.longDescription
  };

  if (sameAs.length > 0) {
    organization.sameAs = sameAs;
  }

  return organization;
}

export function buildWebSiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.brandName,
    alternateName: brand.alternateName,
    url: brand.canonicalUrl,
    description: brand.shortDescription,
    inLanguage: brand.defaultLocale
  };
}

export function buildSoftwareApplicationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.brandName,
    alternateName: brand.alternateName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: brand.canonicalUrl,
    description: brand.longDescription
  };
}

export function buildSiteStructuredData(siteUrl = resolveConfiguredSiteUrl()) {
  return [
    buildOrganizationJsonLd(siteUrl),
    buildWebSiteJsonLd(),
    buildSoftwareApplicationJsonLd()
  ];
}
