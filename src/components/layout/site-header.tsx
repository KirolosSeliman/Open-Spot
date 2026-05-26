import Link from "next/link";

import { signOutAction } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NavItem } from "@/types/app";

const navItems: NavItem[] = [
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/pricing", label: "Prix" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Tableau de bord" }
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
        <Link className="text-base font-bold" href="/">
          2e Chance RDV
        </Link>
        <nav aria-label="Navigation principale" className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isSignedIn ? (
            <form action={signOutAction}>
              <button
                className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
                type="submit"
              >
                Déconnexion
              </button>
            </form>
          ) : (
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
              href="/sign-in"
            >
              Connexion
            </Link>
          )}
          <Link
            className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-strong)]"
            href="/remplir-mes-annulations"
          >
            Remplir mes annulations
          </Link>
        </nav>
      </div>
    </header>
  );
}
