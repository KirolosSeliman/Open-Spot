"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { persistClientLocale } from "@/lib/i18n/client";
import { defaultLocale, dictionaries, supportedLocales } from "@/lib/i18n/dictionaries";
import { localeCookieName, normalizeLocale } from "@/lib/i18n/shared";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

type LanguageSwitcherProps = {
  className?: string;
  initialLocale?: Locale;
  tone?: "light" | "dark";
};

export function LanguageSwitcher({
  className,
  initialLocale = defaultLocale,
  tone = "light"
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return initialLocale;
    }

    return normalizeLocale(
      window.localStorage.getItem(localeCookieName) ?? initialLocale
    );
  });

  function selectLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    persistClientLocale(nextLocale);
    router.refresh();
  }

  const label = dictionaries[locale].common.language;

  return (
    <div
      aria-label={label}
      className={cn(
        "inline-flex rounded-full border p-1",
        tone === "dark"
          ? "border-white/15 bg-white/10"
          : "border-[var(--line)] bg-white",
        className
      )}
      role="group"
    >
      {supportedLocales.map((option) => {
        const isSelected = option === locale;

        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              "min-h-9 rounded-full px-3 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
              isSelected
                ? "bg-[var(--primary)] text-white"
                : tone === "dark"
                  ? "text-white/75 hover:bg-white/10 hover:text-white"
                  : "text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--foreground)]"
            )}
            key={option}
            onClick={() => selectLocale(option)}
            type="button"
          >
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
