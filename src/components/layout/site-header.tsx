import Link from "next/link";

import { OpenSpotLogo } from "@/components/brand/open-spot-logo";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { signOutAction } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/env/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NavItem } from "@/types/app";

export async function SiteHeader() {
  const locale = await getRequestLocale();
  const t = dictionaries[locale];
  const navItems: NavItem[] = [
    { href: "/#comment-ca-marche", label: t.marketing.howItWorks },
    { href: "/#pourquoi-open-spot", label: t.marketing.whyOpenSpot },
    { href: "/pricing", label: t.navigation.pricing },
    { href: "/book-call/questions", label: t.marketing.bookCall }
  ];
  let isSignedIn = false;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isSignedIn = Boolean(user);
  }

  return (
    <SiteHeaderShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="rounded-full px-2 py-1 text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
          href="/"
        >
          <OpenSpotLogo size="sm" variant="lockup" />
        </Link>

        <nav
          aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}
          className="order-3 hidden w-full gap-1 overflow-x-auto pb-1 md:order-2 md:flex md:w-auto md:overflow-visible md:pb-0"
        >
          {navItems.map((item) => (
            <Link
              className="shrink-0 rounded-full px-3 py-2 text-sm font-bold text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 flex shrink-0 items-center gap-2 md:order-3">
          {isSignedIn ? (
            <>
              <Link
                className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/dashboard"
              >
                {t.auth.dashboard}
              </Link>
              <form action={signOutAction}>
                <button
                  className="rounded-full px-3 py-2 text-sm font-bold text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  type="submit"
                >
                  {t.auth.signOut}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/sign-in"
              >
                {t.auth.signIn}
              </Link>
              <Link
                className="rounded-full bg-[var(--primary)] px-3 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.22)] transition hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/signup"
              >
                {t.auth.createAccount}
              </Link>
            </>
          )}
          <LanguageSwitcher initialLocale={locale} />
        </div>
      </div>
    </SiteHeaderShell>
  );
}
