import { headers } from "next/headers";

import {
  normalizeSiteUrl,
  resolveConfiguredSiteUrl
} from "@/lib/site-url";

export function getConfiguredPublicSiteUrl() {
  return resolveConfiguredSiteUrl();
}

export async function getRequestSiteUrl() {
  const configured = getConfiguredPublicSiteUrl();

  if (configured) {
    return configured;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return "";
  }

  return normalizeSiteUrl(`${protocol}://${host}`);
}

export function buildAuthCallbackUrl(
  nextPath = "/auth/set-password",
  siteUrlOverride?: string
) {
  const siteUrl = normalizeSiteUrl(
    siteUrlOverride ?? getConfiguredPublicSiteUrl()
  );

  if (!siteUrl) {
    throw new Error("Public site URL is not configured.");
  }

  const next = nextPath.startsWith("/") ? nextPath : "/auth/set-password";

  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}
