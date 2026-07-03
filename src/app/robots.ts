import type { MetadataRoute } from "next";

import { resolveConfiguredSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveConfiguredSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/admin/",
        "/platform-admin/",
        "/api/",
        "/auth/",
        "/sign-in",
        "/signup",
        "/login",
        "/forgot-password",
        "/onboarding",
        "/dashboard-preview",
        "/b/"
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
