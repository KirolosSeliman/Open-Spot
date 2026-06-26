"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { OpenSpotLogo } from "@/components/brand/open-spot-logo";
import { DashboardNavIcon } from "@/components/dashboard/dashboard-nav-icons";
import { SiteHeaderShell } from "@/components/layout/site-header-shell";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { exitManagerModeAction } from "@/lib/admin/manager-mode-actions";
import { signOutAction } from "@/lib/auth/actions";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/types";
import type { OrganizationWorkspace } from "@/lib/organization/current";
import { cn } from "@/lib/utils/cn";

type DashboardNavItem = {
  activeMatch?: "exact" | "nested";
  href: string;
  label: string;
};

function getDesktopNav(locale: Locale) {
  const t = dictionaries[locale];

  return [
    { href: "/dashboard", label: t.navigation.dashboard },
    { href: "/dashboard/new-cancellation", label: t.openings.newCancellation, activeMatch: "exact" },
    { href: "/dashboard/responses", label: t.responses.responses },
    { href: "/dashboard/appointments", label: t.dashboard.appointments },
    { href: "/dashboard/cancellations", label: t.dashboard.cancellations },
    { href: "/dashboard/clients", label: t.customers.customers },
    { href: "/dashboard/waitlist", label: t.waitlist.waitlist },
    { href: "/dashboard/qr-code", label: t.openings.qrLink },
    { href: "/dashboard/messages", label: t.dashboard.messages },
    { href: "/dashboard/services", label: t.services.services },
    { href: "/dashboard/analytics", label: t.dashboard.stats },
    { href: "/dashboard/team", label: t.dashboard.team },
    { href: "/dashboard/billing", label: t.dashboard.billing },
    { href: "/dashboard/settings", label: t.settings.settings }
  ] satisfies DashboardNavItem[];
}

function getMobileNav(locale: Locale) {
  const t = dictionaries[locale];

  return [
    { href: "/dashboard", label: t.dashboard.overview },
    { href: "/dashboard/new-cancellation", label: t.openings.newCancellation, activeMatch: "exact" },
    { href: "/dashboard/responses", label: t.responses.responses },
    { href: "/dashboard/appointments", label: t.dashboard.appointmentsShort },
    { href: "/dashboard/clients", label: t.customers.customers },
    { href: "/dashboard/settings", label: t.settings.settings }
  ] satisfies DashboardNavItem[];
}

function isActiveDashboardRoute(pathname: string, item: DashboardNavItem) {
  if (item.href === "/dashboard" || item.activeMatch === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getUserDisplayName(workspace: OrganizationWorkspace) {
  if (workspace.status !== "ready") {
    return "Utilisateur";
  }

  const emailPrefix = workspace.user.email?.split("@")[0]?.trim();

  if (emailPrefix) {
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  return workspace.organization.name;
}

function getUserInitial(workspace: OrganizationWorkspace) {
  return getUserDisplayName(workspace).charAt(0).toUpperCase();
}

function getRoleLabel(
  role: "owner" | "manager" | "staff",
  locale: Locale
) {
  if (locale === "fr") {
    const labels = {
      owner: "Propriétaire",
      manager: "Gestionnaire",
      staff: "Employé"
    };
    return labels[role];
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function DashboardShell({
  workspace,
  initialLocale = "fr",
  isPlatformAdmin = false,
  children
}: {
  workspace: OrganizationWorkspace;
  initialLocale?: Locale;
  isPlatformAdmin?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const t = dictionaries[initialLocale];
  const isAdminManagerMode =
    workspace.status === "ready" && Boolean(workspace.adminManagerMode);
  const desktopNav = getDesktopNav(initialLocale);
  const mobileNav = getMobileNav(initialLocale);
  const scopedDesktopNav = isAdminManagerMode
    ? desktopNav.filter(
        (item) =>
          !["/dashboard/billing", "/dashboard/team", "/dashboard/settings"].includes(
            item.href
          )
      )
    : desktopNav;
  const desktopNavItems = isPlatformAdmin
    ? [...scopedDesktopNav, { href: "/admin", label: t.admin.admin }]
    : scopedDesktopNav;
  const mobileNavItems = isAdminManagerMode
    ? mobileNav.filter((item) => item.href !== "/dashboard/settings")
    : mobileNav;
  const userDisplayName = getUserDisplayName(workspace);
  const workspaceNote =
    workspace.status === "ready"
      ? `${getRoleLabel(workspace.organization.role, initialLocale)} • ${workspace.organization.timezone}`
      : t.dashboard.workspaceUnavailable;

  return (
    <div className="open-spot-dashboard-theme min-h-screen bg-[#f4f7fb] text-[#07142f]">
      <div className="mx-auto flex w-full max-w-[1600px] gap-0 lg:gap-0">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white px-4 py-5 lg:flex">
          <Link
            className="flex items-center gap-3 rounded-xl px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
            href="/"
          >
            <OpenSpotLogo
              markClassName="h-9 w-9"
              priority
              size="md"
              textClassName="text-base font-black text-[#07142f]"
              variant="lockup"
            />
          </Link>
          <p className="mt-1 px-2 text-xs font-semibold text-[#64748b]">
            {t.dashboard.recoverySms}
          </p>

          <nav
            aria-label={
              initialLocale === "fr"
                ? "Navigation du tableau de bord"
                : "Dashboard navigation"
            }
            className="mt-6 grid gap-0.5 overflow-y-auto pr-1"
          >
            {desktopNavItems.map((item) => {
              const isActive = isActiveDashboardRoute(pathname, item);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2",
                    isActive
                      ? "bg-[#eef4ff] text-[#2563ff]"
                      : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#07142f]"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      isActive ? "text-[#2563ff]" : "text-[#94a3b8]"
                    )}
                  >
                    <DashboardNavIcon href={item.href} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-3 border-t border-[#e2e8f0] pt-4">
            <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563ff] text-sm font-black text-white">
                {getUserInitial(workspace)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#07142f]">
                  {userDisplayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#64748b]">
                  {workspaceNote}
                </p>
              </div>
            </div>
            <LanguageSwitcher initialLocale={initialLocale} tone="light" />
            <form action={signOutAction}>
              <button
                className="flex w-full min-h-10 items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc] hover:text-[#07142f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
                type="submit"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                {t.auth.signOut}
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <SiteHeaderShell className="lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link
                className="flex items-center gap-2 rounded-xl text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
                href="/"
              >
                <OpenSpotLogo priority size="sm" variant="lockup" />
              </Link>
              <Link
                className="rounded-full bg-[#2563ff] px-3 py-2 text-xs font-black text-white shadow-[0_8px_20px_rgba(37,99,255,0.22)]"
                href="/dashboard/new-cancellation"
              >
                {t.openings.newCancellation}
              </Link>
              <div className="hidden min-[430px]:block">
                <LanguageSwitcher initialLocale={initialLocale} />
              </div>
              <form action={signOutAction}>
                <button
                  className="rounded-full border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-black text-[#07142f]"
                  type="submit"
                >
                  {t.auth.signOut}
                </button>
              </form>
            </div>
          </SiteHeaderShell>
          {workspace.status === "ready" && workspace.adminManagerMode ? (
            <div className="mx-4 mb-4 mt-4 rounded-2xl border border-[#d9b35f] bg-[#fff7df] p-4 text-sm shadow-sm lg:mx-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="font-bold text-[#5b4310]">
                  {initialLocale === "fr"
                    ? "Mode gestionnaire admin : vous consultez "
                    : "Admin manager mode: viewing "}
                  {workspace.adminManagerMode.organizationName}
                  {initialLocale === "fr"
                    ? " comme gestionnaire. Les actions sont auditées. La session expire le "
                    : " as manager. Actions are audited. Session expires at "}
                  {new Date(workspace.adminManagerMode.expiresAt).toLocaleString()}.
                </p>
                <div className="flex flex-wrap gap-2">
                  <form action={exitManagerModeAction}>
                    <button
                      className="rounded-full bg-[#5b4310] px-4 py-2 text-xs font-black text-white"
                      type="submit"
                    >
                      {initialLocale === "fr"
                        ? "Quitter le mode gestionnaire"
                        : "Exit manager mode"}
                    </button>
                  </form>
                  <Link
                    className="rounded-full border border-[#d9b35f] bg-white px-4 py-2 text-xs font-black text-[#5b4310]"
                    href={`/admin/organizations/${workspace.adminManagerMode.organizationId}`}
                  >
                    {initialLocale === "fr"
                      ? "Retour à l’entreprise admin"
                      : "Back to admin company"}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
          <main className="mx-auto w-full px-4 pb-6 pt-[calc(var(--header-height)+1.25rem)] sm:px-6 lg:px-8 lg:pb-8 lg:pt-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      <nav
        aria-label={
          initialLocale === "fr"
            ? "Navigation mobile du tableau de bord"
            : "Mobile dashboard navigation"
        }
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 gap-1 rounded-[1.5rem] border border-[#e2e8f0] bg-white/94 p-2 shadow-[0_18px_45px_rgba(36,54,66,0.12)] backdrop-blur lg:hidden"
      >
        {mobileNavItems.map((item) => {
          const isActive = isActiveDashboardRoute(pathname, item);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center justify-center rounded-2xl px-1 text-center text-[0.65rem] font-black leading-tight text-[#64748b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
                isActive && "bg-[#2563ff] text-white"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
