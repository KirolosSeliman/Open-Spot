import { cookies } from "next/headers";

import { defaultLocale, dictionaries } from "./dictionaries";
import { localeCookieName, normalizeLocale } from "./shared";
import type { Dictionary, Locale } from "./types";

export function getDictionary(locale: string | null | undefined): Dictionary {
  return dictionaries[normalizeLocale(locale)];
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}

export function translate(
  dictionary: Dictionary,
  namespace: keyof Dictionary,
  key: string
) {
  return dictionary[namespace][key] ?? dictionaries[defaultLocale][namespace][key] ?? key;
}
