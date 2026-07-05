import type { Metadata } from "next";

import { brandConfig } from "@/config/brand";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

type CreatePageMetadataInput = {
  title: string;
  description: string;
  path: string;
  locale?: string;
  imagePath?: string;
};

function normalizePath(path: string) {
  if (path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function absoluteUrl(path: string) {
  const normalizedPath = normalizePath(path);
  return normalizedPath === "/"
    ? PRODUCTION_SITE_URL
    : `${PRODUCTION_SITE_URL}${normalizedPath}`;
}

function withBrand(title: string) {
  return title.startsWith(`${brandConfig.brandName} `) ||
    title.endsWith(`| ${brandConfig.brandName}`)
    ? title
    : `${title} | ${brandConfig.brandName}`;
}

function toOpenGraphLocale(locale: string) {
  return locale.replace("-", "_");
}

export function createPageMetadata({
  title,
  description,
  path,
  locale = brandConfig.locale,
  imagePath
}: CreatePageMetadataInput): Metadata {
  const resolvedTitle = withBrand(title);
  const url = absoluteUrl(path);
  const image = imagePath
    ? {
        images: [
          {
            url: `${PRODUCTION_SITE_URL}${normalizePath(imagePath)}`,
            alt: brandConfig.brandName
          }
        ]
      }
    : {};

  return {
    title: resolvedTitle,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName: brandConfig.brandName,
      locale: toOpenGraphLocale(locale),
      type: "website",
      ...image
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description
    },
    robots: {
      index: true,
      follow: true
    }
  };
}
