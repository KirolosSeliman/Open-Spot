import type { MetadataRoute } from "next";

import { resolveConfiguredSiteUrl } from "@/lib/site-url";

const publicPaths = [
  "/",
  "/book-call",
  "/pricing",
  "/how-it-works",
  "/sign-in",
  "/signup",
  "/privacy",
  "/terms"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveConfiguredSiteUrl();
  const lastModified = new Date();

  return publicPaths.map((path) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7
  }));
}
