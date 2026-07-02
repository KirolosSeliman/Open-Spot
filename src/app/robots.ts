import type { MetadataRoute } from "next";

import { resolveConfiguredSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveConfiguredSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/admin/",
        "/dashboard/",
        "/dashboard-preview/",
        "/platform-admin/",
        "/onboarding/",
        "/login/",
        "/sign-in/",
        "/signup/",
        "/forgot-password/",
        "/b/"
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
