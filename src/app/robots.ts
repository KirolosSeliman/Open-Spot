import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/join/",
        "/dashboard/",
        "/admin/",
        "/platform-admin/",
        "/auth/",
        "/sign-in",
        "/signup",
        "/login",
        "/register",
        "/forgot-password",
        "/onboarding",
        "/dashboard-preview",
        "/book-call/ready",
        "/book-call/questions",
        "/b/"
      ]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
