"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, SVGProps } from "react";

import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";

type AdminInfo = {
  email: string;
  role: string;
  displayName?: string;
  initials?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
  activeMatch?: "exact" | "nested";
  disabled?: boolean;
};

function OverviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MessageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function ReplyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="m9 11-4 4 4 4" />
      <path d="M20 4v7a4 4 0 0 1-4 4H5" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M12 3 20 7v6c0 5-3.5 8-8 8s-8-3-8-8V7z" />
    </svg>
  );
}

function AuditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

const adminNav: NavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: OverviewIcon, activeMatch: "exact" },
  { href: "/admin/organizations", label: "Compagnies", icon: BuildingIcon },
  { href: "/admin/call-requests", label: "Demandes d'appel", icon: PhoneIcon },
  { href: "/admin/sms", label: "SMS", icon: MessageIcon },
  { href: "/admin/replies", label: "Réponses", icon: ReplyIcon },
  { href: "/admin/compliance", label: "Conformité", icon: ShieldIcon },
  { href: "/admin/audit", label: "Audit", icon: AuditIcon },
  { href: "/admin", label: "Paramètres", icon: SettingsIcon, disabled: true }
];

const companySetupNav: NavItem[] = [
  { href: "", label: "Overview", icon: OverviewIcon, activeMatch: "exact" },
  { href: "/onboarding", label: "Onboarding", icon: BuildingIcon },
  { href: "/billing", label: "Billing", icon: BuildingIcon },
  { href: "/sms", label: "SMS", icon: MessageIcon },
  { href: "/replies", label: "Replies", icon: ReplyIcon },
  { href: "/compliance", label: "Compliance", icon: ShieldIcon }
];

const ORGANIZATION_PATH_PATTERN = /^\/admin\/organizations\/([^/]+)/;

function extractOrganizationId(pathname: string): string | null {
  const match = pathname.match(ORGANIZATION_PATH_PATTERN);
  return match?.[1] ?? null;
}

function isActiveNavItem(pathname: string, item: NavItem) {
  if (item.activeMatch === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isActiveCompanyNavItem(
  pathname: string,
  organizationId: string,
  suffix: string,
  activeMatch?: "exact" | "nested"
) {
  const href = `/admin/organizations/${organizationId}${suffix}`;

  if (activeMatch === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(admin: AdminInfo) {
  if (admin.initials) {
    return admin.initials;
  }

  const source = admin.displayName?.trim() || admin.email.trim();

  if (!source) {
    return "AD";
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  disabled
}: {
  href: string;
  label: string;
  icon: NavItem["icon"];
  isActive: boolean;
  disabled?: boolean;
}) {
  const className = cn(
    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
    isActive
      ? "bg-[#eef4ff] text-[#2563ff] before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-full before:bg-[#2563ff]"
      : "text-[#657492] hover:bg-[#f8fbff] hover:text-[#2563ff]",
    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[#657492]"
  );

  const content = (
    <>
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#2563ff]" : "text-[#94a3b8]")} />
      {label}
    </>
  );

  if (disabled) {
    return (
      <span className={className} title="Paramètres à venir">
        {content}
      </span>
    );
  }

  return (
    <Link aria-current={isActive ? "page" : undefined} className={className} href={href}>
      {content}
    </Link>
  );
}

export function AdminSidebar({ admin }: { admin: AdminInfo }) {
  const pathname = usePathname();
  const organizationId = extractOrganizationId(pathname);
  const displayName = admin.displayName?.trim() || admin.email;

  return (
    <aside className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-[280px] shrink-0 rounded-[22px] border border-[#e1e9f5] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:flex lg:flex-col">
      <Link
        className="rounded-xl px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
        href="/admin"
      >
        <p className="text-lg font-bold text-[#0b1328]">Open Spot</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#657492]">
          Admin
        </p>
      </Link>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <nav aria-label="Navigation admin" className="grid gap-1">
          {adminNav.map((item) => (
            <NavLink
              disabled={item.disabled}
              href={item.href}
              icon={item.icon}
              isActive={!item.disabled && isActiveNavItem(pathname, item)}
              key={item.label}
              label={item.label}
            />
          ))}
        </nav>

        {organizationId ? (
          <nav
            aria-label="Company setup navigation"
            className="mt-6 border-t border-[#edf2f9] pt-5"
          >
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#657492]">
              Company setup
            </p>
            <div className="grid gap-1">
              {companySetupNav.map((item) => {
                const href = `/admin/organizations/${organizationId}${item.href}`;

                return (
                  <NavLink
                    href={href}
                    icon={item.icon}
                    isActive={isActiveCompanyNavItem(
                      pathname,
                      organizationId,
                      item.href,
                      item.activeMatch
                    )}
                    key={item.label}
                    label={item.label}
                  />
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>

      <div className="mt-auto rounded-[18px] border border-[#e1e9f5] bg-[#f8fbff] p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2563ff] text-sm font-bold text-white">
            {getInitials(admin)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#0b1328]">{displayName}</p>
            <p className="truncate text-xs text-[#657492]">{admin.role}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#16a34a]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#16a34a]" />
              En ligne
            </p>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#94a3b8]" />
        </div>

        <div className="mt-4 grid gap-2">
          <Link
            className="rounded-xl border border-[#e1e9f5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0b1328] transition hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
            href="/dashboard"
          >
            Retour au dashboard marchand
          </Link>
          <form action={signOutAction}>
            <button
              className="w-full rounded-xl border border-[#e1e9f5] bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1328] transition hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
              type="submit"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

const mobilePillClassName =
  "rounded-full border border-[#e1e9f5] bg-white px-3 py-2 text-xs font-bold transition hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]";

function MobilePillLink({
  href,
  label,
  isActive
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        mobilePillClassName,
        isActive && "border-[#bfdbfe] bg-[#eff6ff] text-[#2563ff]"
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const organizationId = extractOrganizationId(pathname);

  if (organizationId) {
    const companyBase = `/admin/organizations/${organizationId}`;

    return (
      <nav
        aria-label="Company setup mobile navigation"
        className="flex flex-wrap items-center gap-2"
      >
        <MobilePillLink
          href={companyBase}
          isActive={pathname === companyBase}
          label="Company"
        />
        <MobilePillLink
          href={`${companyBase}/onboarding`}
          isActive={pathname.startsWith(`${companyBase}/onboarding`)}
          label="Onboarding"
        />
        <MobilePillLink
          href={`${companyBase}/billing`}
          isActive={pathname.startsWith(`${companyBase}/billing`)}
          label="Billing"
        />
      </nav>
    );
  }

  return (
    <nav aria-label="Admin mobile navigation" className="flex items-center gap-2">
      <MobilePillLink href="/admin" isActive={pathname === "/admin"} label="Vue" />
      <MobilePillLink
        href="/admin/organizations"
        isActive={pathname.startsWith("/admin/organizations")}
        label="Compagnies"
      />
      <MobilePillLink
        href="/admin/call-requests"
        isActive={pathname.startsWith("/admin/call-requests")}
        label="Appels"
      />
    </nav>
  );
}
