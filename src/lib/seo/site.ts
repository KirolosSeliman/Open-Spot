import type { Metadata } from "next";

import { normalizeSiteUrl, resolveConfiguredSiteUrl } from "@/lib/site-url";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || resolveConfiguredSiteUrl();

export const SITE_URL = normalizeSiteUrl(rawSiteUrl);

export const SITE_NAME = "Open Spot";
export const PUBLIC_BRAND_NAME = "Open Spot";
export const PRODUCT_NAME = "2e Chance RDV";
export const DEFAULT_LOCALE = "fr-CA";

export const DEFAULT_TITLE = "Open Spot | Remplir les annulations de rendez-vous par SMS";
export const DEFAULT_DESCRIPTION =
  "Open Spot aide les salons, barbiers, spas et cliniques beauté à remplir leurs annulations de rendez-vous par SMS, tout en gardant la confirmation manuelle.";

export const BOOK_CALL_PATH = "/book-call";

export const TITLE_TEMPLATE = "%s | Open Spot";

export const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false
};

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
