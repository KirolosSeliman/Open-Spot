import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { SiteHeaderShell } from "@/components/layout/site-header-shell";
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
    <div className="open-spot-dashboard-theme min-h-screen bg-[#f8f5ee] text-[var(--foreground)]">
      <SiteHeaderShell className="border-b-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">
                Open Spot
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                Admin plateforme
              </h1>
            </div>
            <div className="platform-admin-meta-badges flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="rounded-full border border-[var(--line)] bg-[#fbfaf7] px-3 py-2">
                Lecture seule
              </span>
              <span className="max-w-full truncate rounded-full border border-[var(--line)] bg-[#fbfaf7] px-3 py-2">
                {admin.email ?? admin.userId}
              </span>
              <span className="rounded-full border border-[var(--line)] bg-[#fbfaf7] px-3 py-2">
                {admin.role}
              </span>
            </div>
          </div>
          <nav className="platform-admin-nav flex gap-2 overflow-x-auto pb-1 lg:flex-nowrap">
            {navItems.map((item) => (
              <Link
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black transition hover:border-[var(--primary)] hover:text-[var(--primary-strong)] lg:whitespace-nowrap"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </SiteHeaderShell>
      <main className="mx-auto w-full min-w-0 max-w-7xl px-[clamp(12px,4vw,20px)] pb-8 pt-[calc(var(--header-height)+5rem)] sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
