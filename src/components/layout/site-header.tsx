import Link from "next/link";

import type { NavItem } from "@/types/app";

const navItems: NavItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Dashboard" }
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-[rgba(248,247,244,0.92)]">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link className="text-base font-bold" href="/">
          2e Chance RDV
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--foreground)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
