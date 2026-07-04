import type { MetadataRoute } from "next";

import { articlePages, commercialPages } from "@/lib/seo/pages";
import { absoluteUrl } from "@/lib/seo/site";
import { coreSitemapEntries } from "@/lib/seo/structured-data";

const lastModified = new Date("2026-07-04");

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = coreSitemapEntries.map(
    ({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      lastModified,
      changeFrequency,
      priority
    })
  );

  for (const page of Object.values(commercialPages)) {
    entries.push({
      url: absoluteUrl(page.path),
      lastModified,
      changeFrequency: page.sitemap.changeFrequency,
      priority: page.sitemap.priority
    });
  }

  for (const page of Object.values(articlePages)) {
    entries.push({
      url: absoluteUrl(page.path),
      lastModified,
      changeFrequency: page.sitemap.changeFrequency,
      priority: page.sitemap.priority
    });
  }

  return entries;
}
