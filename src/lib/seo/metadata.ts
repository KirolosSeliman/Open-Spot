import type { Metadata } from "next";

import { brand } from "@/lib/brand";
import { buildPublicPageUrl } from "@/lib/seo/public-pages";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
};

function getSiteVerificationMetadata(): Metadata["verification"] {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

  if (!google && !bing) {
    return undefined;
  }

  const verification: NonNullable<Metadata["verification"]> = {};

  if (google) {
    verification.google = google;
  }

  if (bing) {
    verification.other = {
      ...(verification.other ?? {}),
      "msvalidate.01": bing
    };
  }

  return verification;
}

export function createRootSiteMetadata(): Metadata {
  const siteUrl = resolveConfiguredSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Open Spot — Récupérez vos annulations par SMS",
      template: "%s | Open Spot"
    },
    description: brand.shortDescription,
    alternates: {
      canonical: siteUrl
    },
    openGraph: {
      type: "website",
      locale: brand.defaultLocale,
      url: siteUrl,
      siteName: brand.brandName,
      title: "Open Spot — Récupérez vos annulations par SMS",
      description: brand.shortDescription,
      images: [
        {
          url: brand.logoPath,
          alt: `${brand.brandName} logo`
        }
      ]
    },
    twitter: {
      card: "summary",
      title: "Open Spot — Récupérez vos annulations par SMS",
      description: brand.shortDescription,
      images: [brand.logoPath]
    },
    icons: {
      apple: brand.logoPath,
      icon: brand.logoPath
    },
    verification: getSiteVerificationMetadata(),
    robots: {
      index: true,
      follow: true
    }
  };
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  openGraphTitle,
  openGraphDescription
}: PublicMetadataInput): Metadata {
  const siteUrl = resolveConfiguredSiteUrl();
  const canonicalUrl = buildPublicPageUrl(siteUrl, path);
  const ogTitle = openGraphTitle ?? title;
  const ogDescription = openGraphDescription ?? description;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "website",
      locale: brand.defaultLocale,
      url: canonicalUrl,
      siteName: brand.brandName,
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: brand.logoPath,
          alt: `${brand.brandName} logo`
        }
      ]
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: ogDescription,
      images: [brand.logoPath]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}
