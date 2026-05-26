import Link from "next/link";

import { signOutAction } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NavItem } from "@/types/app";

const navItems: NavItem[] = [
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#pourquoi-open-spot", label: "Pourquoi Open Spot" },
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
    <header className="border-b border-[var(--line)] bg-[rgba(248,247,244,0.92)]">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          className="rounded-md text-base font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
          href="/"
        >
          Open Spot
        </Link>
        <nav
          aria-label="Navigation principale"
          className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0"
        >
          {navItems.map((item) => (
            <Link
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isSignedIn ? (
            <form action={signOutAction}>
              <button
                className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                type="submit"
              >
                Déconnexion
              </button>
            </form>
          ) : (
            <Link
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href="/sign-in"
            >
              Connexion
            </Link>
          )}
          <Link
            className="shrink-0 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            href="/book-call/questions"
          >
            Réserver un appel
          </Link>
        </nav>
      </div>
    </header>
  );
}
