import { getSafeInternalRedirectPath } from "@/lib/auth/platform-admin";

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_BASE_URL ??
    ""
  ).replace(/\/$/, "");
}

export function buildInvitationRedirectUrl() {
  const siteUrl = getPublicSiteUrl();

  if (!siteUrl) {
    throw new Error("Public site URL is not configured.");
  }

  const next = getSafeInternalRedirectPath("/auth/set-password") ?? "/auth/set-password";

  return `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function buildPasswordRecoveryRedirectUrl() {
  return buildInvitationRedirectUrl();
}
