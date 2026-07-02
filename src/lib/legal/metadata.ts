import type { Metadata } from "next";

import type { LegalPageDefinition } from "@/lib/legal/types";
import { buildPublicPageUrl } from "@/lib/seo/public-pages";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

export function createLegalMetadata(page: LegalPageDefinition): Metadata {
  const siteUrl = resolveConfiguredSiteUrl();
  const path = `/${page.slug}`;

  return {
    title: `${page.title} | Open Spot`,
    description: page.description,
    alternates: {
      canonical: buildPublicPageUrl(siteUrl, path)
    },
    robots: {
      index: true,
      follow: true
    }
  };
}
