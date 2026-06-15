import { defaultLocale, supportedLocales } from "./dictionaries";
import type { Locale } from "./types";

export const localeCookieName = "open_spot_locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}
