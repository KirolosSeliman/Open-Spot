"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

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
    { href: "/dashboard/qr-code", label: t.openings.qrLink },
    { href: "/dashboard/messages", label: t.dashboard.messages },
    { href: "/dashboard/services", label: t.services.services },
    { href: "/dashboard/analytics", label: t.dashboard.stats },
    { href: "/dashboard/team", label: t.dashboard.team },
    { href: "/dashboard/billing", label: t.dashboard.billing },
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
    return emailPrefix;
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

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function DashboardMobileSidebar({
  initialLocale,
  isOpen,
  navItems,
  onClose,
  pathname,
  userDisplayName,
  workspace,
  workspaceNote
}: {
  initialLocale: Locale;
  isOpen: boolean;
  navItems: DashboardNavItem[];
  onClose: () => void;
  pathname: string;
  userDisplayName: string;
  workspace: OrganizationWorkspace;
  workspaceNote: string;
}) {
  const t = dictionaries[initialLocale];
  const closeLabel =
    initialLocale === "fr" ? "Fermer le menu" : "Close menu";
  const overlayCloseLabel =
    initialLocale === "fr"
      ? "Fermer le menu depuis l’arrière-plan"
      : "Close menu from backdrop";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <button
        aria-label={overlayCloseLabel}
        className={cn(
          "absolute inset-0 bg-[rgba(8,12,20,0.28)] backdrop-blur-[2px] transition-opacity",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
      <aside
        aria-label={
          initialLocale === "fr"
            ? "Navigation mobile du tableau de bord"
            : "Mobile dashboard navigation"
        }
        aria-modal="true"
        className={cn(
          "absolute right-0 top-0 flex h-[100svh] w-[min(84vw,340px)] max-w-[calc(100vw-16px)] flex-col border-l border-[#dbe4f2] bg-white px-[clamp(16px,5vw,24px)] py-[calc(clamp(16px,5vw,24px)+env(safe-area-inset-top))] shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        id="dashboard-mobile-sidebar"
        role="dialog"
      >
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#edf2f7] pb-4">
          <Link
            className="min-w-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
            href="/"
            onClick={onClose}
          >
            <OpenSpotLogo
              priority
              size="sm"
              textClassName="truncate text-sm font-black text-[#07142f]"
              variant="lockup"
            />
          </Link>
          <button
            aria-label={closeLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white text-[#07142f] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
            onClick={onClose}
            type="button"
          >
            <MenuIcon />
          </button>
        </div>

        <div className="mt-4 flex min-w-0 items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fbff] px-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563ff] text-sm font-black text-white">
            {getUserInitial(workspace)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#07142f]">
              {userDisplayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#64748b]">
              {workspaceNote}
            </p>
          </div>
        </div>

        <nav
          aria-label={
            initialLocale === "fr"
              ? "Pages du tableau de bord"
              : "Dashboard pages"
          }
          className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
        >
          <div className="grid gap-1.5">
            {navItems.map((item) => {
              const isActive = isActiveDashboardRoute(pathname, item);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2",
                    isActive
                      ? "bg-[#eef4ff] text-[#2563ff]"
                      : "text-[#475569] hover:bg-[#f8fbff] hover:text-[#07142f]"
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={onClose}
                  title={item.label}
                >
                  <span
                    className={cn(
                      "shrink-0",
                      isActive ? "text-[#2563ff]" : "text-[#94a3b8]"
                    )}
                  >
                    <DashboardNavIcon href={item.href} />
                  </span>
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-4 grid shrink-0 gap-3 border-t border-[#edf2f7] pt-4">
          <LanguageSwitcher
            initialLocale={initialLocale}
            layout="sidebar"
            tone="light"
          />
          <form action={signOutAction}>
            <button
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] hover:text-[#07142f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
              type="submit"
            >
              {t.auth.signOut}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const openMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);
  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);
  const t = dictionaries[initialLocale];
  const isAdminManagerMode =
    workspace.status === "ready" && Boolean(workspace.adminManagerMode);
  const desktopNav = getDesktopNav(initialLocale);
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
  const mobileSidebarNavItems = desktopNavItems;
  const userDisplayName = getUserDisplayName(workspace);
  const workspaceNote =
    workspace.status === "ready"
      ? `${getRoleLabel(workspace.organization.role, initialLocale)} • ${workspace.organization.timezone}`
      : t.dashboard.workspaceUnavailable;
  const mobileMenuLabel =
    initialLocale === "fr" ? "Ouvrir le menu" : "Open menu";

  return (
    <div className="open-spot-dashboard-theme min-h-screen bg-[#f4f8ff] text-[#07142f]">
      <div className="mx-auto flex w-full max-w-[1600px] gap-0 lg:gap-0">
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-[#e2e8f0] bg-[#f8fafc] px-5 py-6 lg:flex">
          <div className="shrink-0">
            <Link
              className="flex items-center gap-3 rounded-xl px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
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
            <p className="mt-1.5 px-1 text-xs font-medium text-[#64748b]">
              {t.dashboard.recoverySms}
            </p>
          </div>

          <nav
            aria-label={
              initialLocale === "fr"
                ? "Navigation du tableau de bord"
                : "Dashboard navigation"
            }
            className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          >
            <div className="grid gap-1">
              {desktopNavItems.map((item) => {
                const isActive = isActiveDashboardRoute(pathname, item);

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff] focus-visible:ring-offset-2",
                      isActive
                        ? "bg-[#eef4ff] text-[#2563ff]"
                        : "text-[#475569] hover:bg-white/80 hover:text-[#07142f]"
                    )}
                    href={item.href}
                    key={item.href}
                    title={item.label}
                  >
                    <span
                      className={cn(
                        "shrink-0",
                        isActive ? "text-[#2563ff]" : "text-[#94a3b8]"
                      )}
                    >
                      <DashboardNavIcon href={item.href} />
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-4 shrink-0 grid gap-2.5 border-t border-[#e2e8f0] pt-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563ff] text-sm font-black text-white">
                {getUserInitial(workspace)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#07142f]">
                  {userDisplayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#64748b]">
                  {workspaceNote}
                </p>
              </div>
            </div>
            <LanguageSwitcher
              initialLocale={initialLocale}
              layout="sidebar"
              tone="light"
            />
            <form action={signOutAction}>
              <button
                className="flex w-full min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] hover:text-[#07142f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
                type="submit"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
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

        <div className="min-w-0 flex-1">
          <SiteHeaderShell
            className="lg:hidden"
            innerClassName="border-0 bg-transparent p-0 shadow-none sm:p-0"
          >
            <div className="mx-auto flex w-[min(100%,calc(100vw-24px))] min-w-0 items-center justify-between gap-3 rounded-[1.35rem] border border-[#e2e8f0] bg-white px-[clamp(12px,4vw,16px)] py-2.5 shadow-[0_12px_32px_rgba(36,54,66,0.08)]">
              <Link
                className="flex min-w-0 items-center gap-2 rounded-xl text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
                href="/"
              >
                <OpenSpotLogo
                  priority
                  size="sm"
                  textClassName="truncate text-sm font-black text-[#07142f]"
                  variant="lockup"
                />
              </Link>
              <button
                aria-controls="dashboard-mobile-sidebar"
                aria-expanded={mobileSidebarOpen}
                aria-label={mobileMenuLabel}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#dbe4f2] bg-[#f8fbff] text-[#07142f] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
                onClick={openMobileSidebar}
                type="button"
              >
                <MenuIcon />
              </button>
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
          <main className="mx-auto w-full max-w-full min-w-0 px-[clamp(12px,4vw,20px)] pb-6 pt-[calc(var(--header-height)+1.25rem)] sm:px-6 lg:px-8 lg:pb-8 lg:pt-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      <DashboardMobileSidebar
        initialLocale={initialLocale}
        isOpen={mobileSidebarOpen}
        navItems={mobileSidebarNavItems}
        onClose={closeMobileSidebar}
        pathname={pathname}
        userDisplayName={userDisplayName}
        workspace={workspace}
        workspaceNote={workspaceNote}
      />
    </div>
  );
}
