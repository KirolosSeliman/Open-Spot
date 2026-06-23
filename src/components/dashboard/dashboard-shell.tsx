"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { exitManagerModeAction } from "@/lib/admin/manager-mode-actions";
import { signOutAction } from "@/lib/auth/actions";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/types";
import type { OrganizationWorkspace } from "@/lib/organization/current";
import { cn } from "@/lib/utils/cn";

function getDesktopNav(locale: Locale) {
  const t = dictionaries[locale];

  return [
    { href: "/dashboard", label: t.navigation.dashboard },
    { href: "/dashboard/new-cancellation", label: t.openings.newCancellation, core: true },
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
  ];
}

function getMobileNav(locale: Locale) {
  const t = dictionaries[locale];

  return [
    { href: "/dashboard", label: t.dashboard.overview },
    { href: "/dashboard/new-cancellation", label: t.openings.newCancellation, core: true },
    { href: "/dashboard/responses", label: t.responses.responses },
    { href: "/dashboard/appointments", label: t.dashboard.appointmentsShort },
    { href: "/dashboard/clients", label: t.customers.customers },
    { href: "/dashboard/settings", label: t.settings.settings }
  ];
}

function isActiveDashboardRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
  const businessName =
    workspace.status === "ready" ? workspace.organization.name : t.dashboard.previewWorkspace;
  const workspaceNote =
    workspace.status === "ready"
      ? `${workspace.organization.role} - ${workspace.organization.timezone}`
      : t.dashboard.workspaceUnavailable;

  return (
    <div className="open-spot-dashboard-theme min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(79,125,243,0.12),transparent_28rem),#f7f9fd] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-[1540px] gap-6 px-3 py-3 lg:px-5">
        <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-[2rem] border border-white/10 bg-[var(--dark)] p-4 text-white shadow-[0_24px_80px_rgba(8,11,18,0.28)] lg:flex lg:flex-col">
          <Link
            className="flex items-center gap-3 rounded-2xl px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            href="/"
          >
            <Image
              alt=""
              className="h-10 w-10 rounded-2xl"
              height={96}
              src="/brand/open-spot-icon.svg"
              width={96}
            />
            <div>
              <p className="text-lg font-black">Open Spot</p>
              <p className="mt-1 text-xs font-semibold text-[var(--dark-muted)]">
                {t.dashboard.recoverySms}
              </p>
            </div>
          </Link>
          <Link
            className="mt-5 rounded-2xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-black text-white shadow-[0_16px_34px_rgba(79,125,243,0.28)] transition hover:bg-[var(--primary-strong)]"
            href="/dashboard/new-cancellation"
          >
            {t.openings.newCancellation}
          </Link>
          <nav
            aria-label={
              initialLocale === "fr"
                ? "Navigation du tableau de bord"
                : "Dashboard navigation"
            }
            className="mt-5 grid gap-1 overflow-y-auto pr-1"
          >
            {desktopNavItems.map((item) => (
              <Link
                aria-current={
                  isActiveDashboardRoute(pathname, item.href) ? "page" : undefined
                }
                className={cn(
                  "relative flex min-h-11 items-center rounded-2xl px-4 py-3 text-sm font-bold text-white/68 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dark)]",
                  isActiveDashboardRoute(pathname, item.href) &&
                    "bg-[rgba(47,120,255,0.14)] pl-5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.16)] before:absolute before:left-2 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[var(--primary)] hover:bg-[rgba(47,120,255,0.18)] hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div>
              <p className="text-sm font-black">{businessName}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--dark-muted)]">
                {workspaceNote}
              </p>
            </div>
            <LanguageSwitcher initialLocale={initialLocale} tone="dark" />
            <form action={signOutAction}>
              <button
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                type="submit"
              >
                {t.auth.signOut}
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 -mx-3 border-b border-[var(--line)] bg-[#f7f9fd]/92 px-3 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link
                className="flex items-center gap-2 rounded-xl text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/"
              >
                <Image
                  alt=""
                  className="h-8 w-8 rounded-xl"
                  height={96}
                  src="/brand/open-spot-icon.svg"
                  width={96}
                />
                <span>Open Spot</span>
              </Link>
              <Link
                className="rounded-full bg-[var(--primary)] px-3 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.22)]"
                href="/dashboard/new-cancellation"
              >
                {t.openings.newCancellation}
              </Link>
              <div className="hidden min-[430px]:block">
                <LanguageSwitcher initialLocale={initialLocale} />
              </div>
              <form action={signOutAction}>
                <button
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--foreground)]"
                  type="submit"
                >
                  {t.auth.signOut}
                </button>
              </form>
            </div>
          </header>
          {workspace.status === "ready" && workspace.adminManagerMode ? (
            <div className="mb-4 rounded-2xl border border-[#d9b35f] bg-[#fff7df] p-4 text-sm shadow-sm">
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
          <main className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-4 lg:px-0 lg:py-8">
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
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 gap-1 rounded-[1.5rem] border border-[var(--line)] bg-white/94 p-2 shadow-[0_18px_45px_rgba(36,54,66,0.18)] backdrop-blur lg:hidden"
      >
        {mobileNavItems.map((item) => (
          <Link
            aria-current={
              isActiveDashboardRoute(pathname, item.href) ? "page" : undefined
            }
            className={cn(
              "flex min-h-12 items-center justify-center rounded-2xl px-1 text-center text-[0.65rem] font-black leading-tight text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
              isActiveDashboardRoute(pathname, item.href) &&
                "bg-[var(--primary)] text-white"
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
