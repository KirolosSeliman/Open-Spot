import { localeCookieName } from "./shared";
import type { Locale } from "./types";

export function persistClientLocale(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;

  try {
    window.localStorage.setItem(localeCookieName, locale);
  } catch {
    // The cookie is the server-rendered source of truth; localStorage only improves client persistence.
  }
}
