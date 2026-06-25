import { headers } from "next/headers";

export function getConfiguredPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_BASE_URL ??
    ""
  ).replace(/\/$/, "");
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

  return `${protocol}://${host}`.replace(/\/$/, "");
}

export function buildAuthCallbackUrl(
  nextPath = "/auth/set-password",
  siteUrlOverride?: string
) {
  const siteUrl = (siteUrlOverride ?? getConfiguredPublicSiteUrl()).replace(
    /\/$/,
    ""
  );

  if (!siteUrl) {
    throw new Error("Public site URL is not configured.");
  }

  const next = nextPath.startsWith("/") ? nextPath : "/auth/set-password";

  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}
