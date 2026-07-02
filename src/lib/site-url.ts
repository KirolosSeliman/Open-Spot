export const PRODUCTION_SITE_URL = "https://open-spot.ca";

export const LOCAL_DEV_SITE_URL = "http://localhost:3000";

type SiteUrlEnv = Partial<Record<string, string | undefined>>;

export function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, "");
}

export function isLocalDevelopment(env: SiteUrlEnv = process.env) {
  return env.NODE_ENV === "development" && !env.VERCEL;
}

function withHttpsIfMissing(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function resolveConfiguredSiteUrl(env: SiteUrlEnv = process.env): string {
  const explicit =
    env.NEXT_PUBLIC_SITE_URL ??
    env.NEXT_PUBLIC_APP_URL ??
    env.APP_BASE_URL ??
    env.SITE_URL ??
    env.APP_URL;

  if (explicit?.trim()) {
    return normalizeSiteUrl(explicit.trim());
  }

  if (isLocalDevelopment(env)) {
    return LOCAL_DEV_SITE_URL;
  }

  const vercelProductionUrl = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) {
    return normalizeSiteUrl(withHttpsIfMissing(vercelProductionUrl));
  }

  return PRODUCTION_SITE_URL;
}
