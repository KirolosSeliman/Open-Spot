import {
  buildAuthCallbackUrl,
  getConfiguredPublicSiteUrl
} from "@/lib/auth/site-url";
import { getSafeInternalRedirectPath } from "@/lib/auth/platform-admin";

export function getPublicSiteUrl() {
  return getConfiguredPublicSiteUrl();
}

export function buildInvitationRedirectUrl() {
  const next =
    getSafeInternalRedirectPath("/auth/set-password") ?? "/auth/set-password";

  return buildAuthCallbackUrl(next);
}

export function buildPasswordRecoveryRedirectUrl() {
  return buildInvitationRedirectUrl();
}
