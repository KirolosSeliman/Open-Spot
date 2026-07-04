import type { MetadataRoute } from "next";

import { brandConfig, getBrandLogoUrl } from "@/config/brand";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildOrganizationJsonLd(siteUrl: string = SITE_URL) {
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
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

export function buildWebSiteJsonLd(siteUrl: string = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: brandConfig.alternateName,
    url: siteUrl,
    inLanguage: brandConfig.locale
  };
}

export function buildSoftwareApplicationJsonLd(siteUrl: string = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    alternateName: brandConfig.alternateName,
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: brandConfig.locale,
    description:
      "Open Spot aide les commerces à remplir les annulations de rendez-vous dernière minute par SMS avec confirmation manuelle par le commerce."
  };
}

export function buildGlobalStructuredData(siteUrl: string = SITE_URL) {
  return [
    buildOrganizationJsonLd(siteUrl),
    buildSoftwareApplicationJsonLd(siteUrl),
    buildWebSiteJsonLd(siteUrl)
  ];
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
  siteUrl: string = SITE_URL
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? siteUrl : absoluteUrl(item.path)
    }))
  };
}

export function buildWebPageJsonLd({
  title,
  description,
  path
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: absoluteUrl(path),
    inLanguage: brandConfig.locale,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL
    }
  };
}

export function buildArticleJsonLd({
  headline,
  description,
  path,
  datePublished = "2026-07-04",
  dateModified = "2026-07-04"
}: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage: brandConfig.locale,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: getBrandLogoUrl()
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(path)
    }
  };
}

/** @deprecated Use buildSoftwareApplicationJsonLd */
export function buildWebApplicationJsonLd(siteUrl: string = SITE_URL) {
  return buildSoftwareApplicationJsonLd(siteUrl);
}

export type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

export const coreSitemapEntries: SitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/book-call", changeFrequency: "monthly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/industries", changeFrequency: "monthly", priority: 0.8 },
  { path: "/consentement-sms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/conditions-utilisation", changeFrequency: "yearly", priority: 0.4 },
  { path: "/politique-confidentialite", changeFrequency: "yearly", priority: 0.4 }
];
