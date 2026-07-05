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
        // Public waitlist/kiosk links are business-specific and can create duplicate/private context.
        // Keep /b/ out of search while leaving commercial SEO pages indexable.
        "/b/"
      ]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
