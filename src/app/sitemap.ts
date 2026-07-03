import type { MetadataRoute } from "next";

import { resolveConfiguredSiteUrl } from "@/lib/site-url";

type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const publicSitemapEntries: SitemapEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/industries", changeFrequency: "monthly", priority: 0.8 },
  { path: "/book-call/questions", changeFrequency: "monthly", priority: 0.85 },
  { path: "/book-call/ready", changeFrequency: "monthly", priority: 0.75 },
  { path: "/politique-confidentialite", changeFrequency: "yearly", priority: 0.4 },
  { path: "/conditions-utilisation", changeFrequency: "yearly", priority: 0.4 },
  { path: "/consentement-sms", changeFrequency: "yearly", priority: 0.4 }
];

const lastModified = new Date("2026-07-03");

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveConfiguredSiteUrl();

  return publicSitemapEntries.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority
  }));
}
