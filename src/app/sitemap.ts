import type { MetadataRoute } from "next";

import { buildPublicPageUrl, PUBLIC_INDEXABLE_PAGES } from "@/lib/seo/public-pages";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveConfiguredSiteUrl();
  const lastModified = new Date();

  return PUBLIC_INDEXABLE_PAGES.map((page) => ({
    url: buildPublicPageUrl(siteUrl, page.path),
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority
  }));
}
