import type { MetadataRoute } from "next";

import { resolveConfiguredSiteUrl } from "@/lib/site-url";
import { publicSitemapEntries } from "@/lib/seo/public-pages";

export const SITE_LAST_UPDATED = new Date("2026-07-05");

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveConfiguredSiteUrl();

  return publicSitemapEntries.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    lastModified: SITE_LAST_UPDATED,
    changeFrequency,
    priority
  }));
}
