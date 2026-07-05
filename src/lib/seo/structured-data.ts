import { brandConfig, getBrandLogoUrl } from "@/config/brand";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";
import type { FaqItem } from "@/lib/seo/public-pages";

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/$/, "");
}

function absoluteUrl(siteUrl: string, path: string) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  if (path === "/") {
    return normalizedSiteUrl;
  }

  return `${normalizedSiteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildOrganizationJsonLd(siteUrl: string = resolveConfiguredSiteUrl()) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${normalizedSiteUrl}/#organization`,
    name: brandConfig.brandName,
    alternateName: brandConfig.alternateName,
    url: normalizedSiteUrl,
    description: brandConfig.description,
    logo: getBrandLogoUrl(normalizedSiteUrl),
    areaServed: brandConfig.serviceArea
  };

  if (brandConfig.sameAs.length > 0) {
    organization.sameAs = brandConfig.sameAs;
  }

  return organization;
}

export function buildWebSiteJsonLd(siteUrl: string = resolveConfiguredSiteUrl()) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${normalizedSiteUrl}/#website`,
    name: brandConfig.brandName,
    alternateName: brandConfig.alternateName,
    url: normalizedSiteUrl,
    inLanguage: brandConfig.locale,
    publisher: {
      "@id": `${normalizedSiteUrl}/#organization`
    }
  };
}

export function buildWebApplicationJsonLd(siteUrl: string = resolveConfiguredSiteUrl()) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${normalizedSiteUrl}/#webapp`,
    name: brandConfig.brandName,
    alternateName: brandConfig.alternateName,
    url: normalizedSiteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["fr-CA", "en-CA"],
    description: brandConfig.description,
    creator: {
      "@id": `${normalizedSiteUrl}/#organization`
    }
  };
}

export function buildServiceJsonLd(siteUrl: string = resolveConfiguredSiteUrl()) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${normalizedSiteUrl}/#service`,
    name: `${brandConfig.brandName} SMS cancellation recovery`,
    serviceType: "SMS cancellation recovery for appointment-based businesses",
    description: brandConfig.description,
    provider: {
      "@id": `${normalizedSiteUrl}/#organization`
    },
    areaServed: [
      {
        "@type": "Country",
        name: "Canada"
      },
      {
        "@type": "AdministrativeArea",
        name: "Québec"
      }
    ],
    audience: {
      "@type": "Audience",
      audienceType: "Appointment-based local businesses"
    }
  };
}

export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
  siteUrl: string = resolveConfiguredSiteUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(siteUrl, item.path)
    }))
  };
}

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function buildPageStructuredData({
  breadcrumbs,
  faq,
  siteUrl = resolveConfiguredSiteUrl()
}: {
  path: string;
  breadcrumbs?: BreadcrumbItem[];
  faq?: FaqItem[];
  siteUrl?: string;
}) {
  const graphs = [];

  if (breadcrumbs?.length) {
    graphs.push(buildBreadcrumbJsonLd(breadcrumbs, siteUrl));
  }

  if (faq?.length) {
    graphs.push(buildFaqJsonLd(faq));
  }

  return graphs;
}

export function buildGlobalStructuredData(siteUrl: string = resolveConfiguredSiteUrl()) {
  return [
    buildOrganizationJsonLd(siteUrl),
    buildWebSiteJsonLd(siteUrl),
    buildWebApplicationJsonLd(siteUrl),
    buildServiceJsonLd(siteUrl)
  ];
}
