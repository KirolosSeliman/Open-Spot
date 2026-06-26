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
  layout?: "inline" | "sidebar";
  tone?: "light" | "dark";
};

export function LanguageSwitcher({
  className,
  initialLocale = defaultLocale,
  layout = "inline",
  tone = "light"
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return initialLocale;
    }

    try {
      return normalizeLocale(
        window.localStorage.getItem(localeCookieName) ?? initialLocale
      );
    } catch {
      return initialLocale;
    }
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
        layout === "sidebar"
          ? "flex w-full rounded-2xl border p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          : "inline-flex rounded-full border p-1",
        tone === "dark"
          ? "border-white/15 bg-white/10"
          : "border-[#e2e8f0] bg-white",
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
              "rounded-full text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
              layout === "sidebar"
                ? "min-h-10 flex-1"
                : "min-h-9 px-3",
              isSelected
                ? "bg-[#2563ff] text-white shadow-[0_4px_12px_rgba(37,99,255,0.24)]"
                : tone === "dark"
                  ? "text-white/75 hover:bg-white/10 hover:text-white"
                  : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#07142f]"
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
