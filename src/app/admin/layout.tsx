import Link from "next/link";
import type { ReactNode } from "react";

import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { signOutAction } from "@/lib/auth/actions";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

export const metadata = {
  title: "Admin Open Spot",
  robots: {
    index: false,
    follow: false
  }
};

const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organizations", label: "Companies" },
  { href: "/admin/call-requests", label: "Call Requests" },
  { href: "/admin/sms", label: "SMS" },
  { href: "/admin/replies", label: "Replies" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/admin/audit", label: "Audit" }
];

export default async function AdminLayout({
  children
}: {
  children: ReactNode;
}) {
  const access = await requireCurrentPlatformAdmin();
  const admin =
    access.status === "authorized"
      ? access.admin
      : {
          email: "Admin",
          role: "unconfigured"
        };

  return (
    <div className="open-spot-dashboard-theme min-h-screen bg-[#f7f5ef] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-[1500px] gap-6 px-3 py-3 lg:px-5">
        <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-[2rem] border border-[var(--line)] bg-white/90 p-4 shadow-[0_24px_70px_rgba(36,54,66,0.08)] lg:flex lg:flex-col">
          <Link
            className="rounded-2xl px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            href="/admin"
          >
            <p className="text-lg font-black">Admin Open Spot</p>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              Vue interne plateforme
            </p>
          </Link>

          <nav aria-label="Navigation admin" className="mt-6 grid gap-1">
            {adminNav.map((item) => (
              <Link
                className="rounded-2xl px-4 py-3 text-sm font-bold text-[var(--muted)] transition hover:bg-[#f2f7f4] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4">
            <p className="text-sm font-black">{admin.email}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {admin.role} · Lecture seule
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-center text-sm font-black text-[var(--foreground)] transition hover:bg-[#f2f7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/dashboard"
              >
                Back to merchant dashboard
              </Link>
              <form action={signOutAction}>
                <button
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-black text-[var(--foreground)] transition hover:bg-[#f2f7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  type="submit"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <SiteHeaderShell className="lg:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link className="text-base font-black" href="/admin">
                Admin Open Spot
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black"
                  href="/admin/organizations"
                >
                  Companies
                </Link>
                <Link
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black"
                  href="/admin/call-requests"
                >
                  Calls
                </Link>
                <Link
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </SiteHeaderShell>
          <main className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-4 lg:px-0 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
