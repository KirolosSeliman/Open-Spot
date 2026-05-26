import Link from "next/link";

import { signOutAction } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NavItem } from "@/types/app";

const navItems: NavItem[] = [
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#pourquoi-open-spot", label: "Pourquoi 2e Chance" },
  { href: "/pricing", label: "Prix" },
  { href: "/book-call/questions", label: "Réserver un appel" }
];

export async function SiteHeader() {
  let isSignedIn = false;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    isSignedIn = Boolean(user);
  }

  return (
    <header className="sticky top-0 z-40 bg-[rgba(248,247,244,0.72)] px-3 py-3 backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-[rgba(223,230,226,0.92)] bg-white/88 px-3 py-3 shadow-[0_16px_45px_rgba(36,54,66,0.08)] sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              className="rounded-full px-2 py-1 text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
              href="/"
            >
              2e Chance RDV
            </Link>

            <nav
              aria-label="Navigation principale"
              className="order-3 flex w-full gap-1 overflow-x-auto pb-1 md:order-2 md:w-auto md:overflow-visible md:pb-0"
            >
              {navItems.map((item) => (
                <Link
                  className="shrink-0 rounded-full px-3 py-2 text-sm font-bold text-[var(--muted)] transition hover:bg-[#f2f7f4] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
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
                    className="hidden rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:bg-[#f2f7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:inline-flex"
                    href="/dashboard"
                  >
                    Dashboard
                  </Link>
                  <form action={signOutAction}>
                    <button
                      className="rounded-full px-3 py-2 text-sm font-bold text-[var(--muted)] transition hover:bg-[#f2f7f4] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                      type="submit"
                    >
                      Déconnexion
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-bold text-[var(--foreground)] transition hover:bg-[#f2f7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    href="/sign-in"
                  >
                    Connexion
                  </Link>
                  <Link
                    className="rounded-full bg-[var(--primary)] px-3 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(35,117,107,0.18)] transition hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    href="/signup"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
