import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { requirePlatformAdmin } from "@/lib/platform-admin/auth";

export const metadata: Metadata = {
  title: "Admin plateforme - Open Spot",
  robots: {
    index: false,
    follow: false
  }
};

const navItems = [
  { href: "/platform-admin", label: "Overview" },
  { href: "/platform-admin/businesses", label: "Commerces" },
  { href: "/platform-admin/billing", label: "Facturation estimée" },
  { href: "/platform-admin/sms", label: "Santé SMS" }
];

export default async function PlatformAdminLayout({
  children
}: {
  children: ReactNode;
}) {
  const admin = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-[#f8f5ee] text-[var(--foreground)]">
      <header className="border-b border-[var(--line)] bg-white/88">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">
                Open Spot
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                Admin plateforme
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="rounded-full border border-[var(--line)] bg-[#fbfaf7] px-3 py-2">
                Lecture seule
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[#fbfaf7] px-3 py-2">
                {admin.email ?? admin.userId}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[#fbfaf7] px-3 py-2">
                {admin.role}
              </span>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                className="whitespace-nowrap rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black transition hover:border-[var(--primary)] hover:text-[var(--primary-strong)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
