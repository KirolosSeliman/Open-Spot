import type { Metadata } from "next";

import {
  absoluteUrl,
  DEFAULT_LOCALE,
  SITE_NAME,
  TITLE_TEMPLATE
} from "@/lib/seo/site";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  openGraphType?: "website" | "article";
};

export function createPublicPageMetadata({
  title,
  description,
  path,
  openGraphType = "website"
}: PublicPageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: openGraphType,
      locale: DEFAULT_LOCALE,
      siteName: SITE_NAME
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export const rootSeoMetadata: Metadata = {
  title: {
    default: "Open Spot | Remplir les annulations de rendez-vous par SMS",
    template: TITLE_TEMPLATE
  },
  description:
    "Open Spot aide les salons, barbiers, spas et cliniques beauté à remplir leurs annulations de rendez-vous par SMS, tout en gardant la confirmation manuelle.",
  openGraph: {
    title: "Open Spot | Remplir les annulations de rendez-vous par SMS",
    description:
      "Open Spot aide les salons, barbiers, spas et cliniques beauté à remplir leurs annulations de rendez-vous par SMS, tout en gardant la confirmation manuelle.",
    url: absoluteUrl("/"),
    type: "website",
    locale: DEFAULT_LOCALE,
    siteName: SITE_NAME
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Spot | Remplir les annulations de rendez-vous par SMS",
    description:
      "Open Spot aide les salons, barbiers, spas et cliniques beauté à remplir leurs annulations de rendez-vous par SMS, tout en gardant la confirmation manuelle."
  },
  alternates: {
    canonical: absoluteUrl("/")
  }
};
