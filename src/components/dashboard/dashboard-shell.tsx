"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { OrganizationWorkspace } from "@/lib/organization/current";
import { cn } from "@/lib/utils/cn";

const desktopNav = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/dashboard/new-cancellation", label: "Nouvelle annulation", core: true },
  { href: "/dashboard/responses", label: "Réponses" },
  { href: "/dashboard/appointments", label: "Rendez-vous" },
  { href: "/dashboard/cancellations", label: "Annulations" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/waitlist", label: "Liste d'attente" },
  { href: "/dashboard/qr-code", label: "QR / lien" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/analytics", label: "Statistiques" },
  { href: "/dashboard/team", label: "Équipe" },
  { href: "/dashboard/billing", label: "Abonnement" },
  { href: "/dashboard/settings", label: "Paramètres" }
];

const mobileNav = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/dashboard/new-cancellation", label: "Nouvelle annulation", core: true },
  { href: "/dashboard/responses", label: "Réponses" },
  { href: "/dashboard/appointments", label: "RDV" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/settings", label: "Plus" }
];

function isActiveDashboardRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  workspace,
  isPlatformAdmin = false,
  children
}: {
  workspace: OrganizationWorkspace;
  isPlatformAdmin?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const desktopNavItems = isPlatformAdmin
    ? [...desktopNav, { href: "/admin", label: "Admin" }]
    : desktopNav;
  const businessName =
    workspace.status === "ready" ? workspace.organization.name : "Espace aperçu";
  const workspaceNote =
    workspace.status === "ready"
      ? `${workspace.organization.role} · ${workspace.organization.timezone}`
      : "Supabase non configuré : aperçu UI sans données persistées.";

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-[1500px] gap-6 px-3 py-3 lg:px-5">
        <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-72 shrink-0 rounded-[2rem] border border-[var(--line)] bg-white/88 p-4 shadow-[0_24px_70px_rgba(36,54,66,0.08)] lg:flex lg:flex-col">
          <Link
            className="rounded-2xl px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            href="/"
          >
            <p className="text-lg font-black">Open Spot</p>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              Récupération SMS
            </p>
          </Link>
          <nav aria-label="Navigation dashboard" className="mt-6 grid gap-1">
            {desktopNavItems.map((item) => (
              <Link
                aria-current={
                  isActiveDashboardRoute(pathname, item.href) ? "page" : undefined
                }
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-bold text-[var(--muted)] transition hover:bg-[#f2f7f4] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                  isActiveDashboardRoute(pathname, item.href) &&
                    "bg-[var(--primary)] text-white shadow-[0_14px_30px_rgba(35,117,107,0.18)] hover:bg-[var(--primary-strong)] hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4">
            <p className="text-sm font-black">{businessName}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {workspaceNote}
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 -mx-3 border-b border-[var(--line)] bg-[#f7f5ef]/92 px-3 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link
                className="rounded-xl text-base font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/"
              >
                Open Spot
              </Link>
              <Link
                className="rounded-full bg-[var(--primary)] px-3 py-2 text-xs font-black text-white"
                href="/dashboard/new-cancellation"
              >
                Nouvelle
              </Link>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-4 lg:px-0 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      <nav
        aria-label="Navigation mobile dashboard"
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 gap-1 rounded-[1.5rem] border border-[var(--line)] bg-white/94 p-2 shadow-[0_18px_45px_rgba(36,54,66,0.18)] backdrop-blur lg:hidden"
      >
        {mobileNav.map((item) => (
          <Link
            aria-current={
              isActiveDashboardRoute(pathname, item.href) ? "page" : undefined
            }
            className={cn(
              "flex min-h-12 items-center justify-center rounded-2xl px-1 text-center text-[0.68rem] font-black leading-tight text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
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
