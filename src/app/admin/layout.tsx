import Link from "next/link";
import type { ReactNode } from "react";

import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-sidebar";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

export const metadata = {
  title: "Admin Open Spot",
  robots: {
    index: false,
    follow: false
  }
};

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
    <div className="open-spot-dashboard-theme min-h-screen bg-[#f8fbff] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-[1500px] gap-6 px-3 py-3 lg:px-5">
        <AdminSidebar admin={admin} />

        <div className="min-w-0 flex-1">
          <SiteHeaderShell className="lg:hidden">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <Link className="min-w-0 truncate text-sm font-black sm:text-base" href="/admin">
                Admin Open Spot
              </Link>
              <AdminMobileNav />
            </div>
          </SiteHeaderShell>
          <main className="w-full min-w-0 max-w-full px-[clamp(12px,4vw,20px)] pb-6 pt-[calc(var(--header-height)+1.25rem)] sm:px-4 lg:px-0 lg:pb-8 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
