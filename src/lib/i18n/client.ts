import { localeCookieName } from "./shared";
import type { Locale } from "./types";

export function persistClientLocale(locale: Locale) {
  window.localStorage.setItem(localeCookieName, locale);
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
