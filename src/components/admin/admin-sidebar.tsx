"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";

type AdminInfo = {
  email: string;
  role: string;
};

type NavItem = {
  href: string;
  label: string;
  activeMatch?: "exact" | "nested";
};

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", activeMatch: "exact" },
  { href: "/admin/organizations", label: "Companies" },
  { href: "/admin/call-requests", label: "Call Requests" },
  { href: "/admin/sms", label: "SMS" },
  { href: "/admin/replies", label: "Replies" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/admin/audit", label: "Audit" }
];

const companySetupNav: NavItem[] = [
  { href: "", label: "Overview", activeMatch: "exact" },
  { href: "/billing", label: "Billing" },
  { href: "/sms", label: "SMS" },
  { href: "/replies", label: "Replies" },
  { href: "/compliance", label: "Compliance" }
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

const navLinkClassName =
  "rounded-2xl px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]";

function NavLink({
  href,
  label,
  isActive
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        navLinkClassName,
        isActive
          ? "bg-[#f2f7f4] text-[var(--foreground)]"
          : "text-[var(--muted)] hover:bg-[#f2f7f4] hover:text-[var(--foreground)]"
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

export function AdminSidebar({ admin }: { admin: AdminInfo }) {
  const pathname = usePathname();
  const organizationId = extractOrganizationId(pathname);

  return (
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

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <nav aria-label="Navigation admin" className="grid gap-1">
          {adminNav.map((item) => (
            <NavLink
              href={item.href}
              isActive={isActiveNavItem(pathname, item)}
              key={item.href}
              label={item.label}
            />
          ))}
        </nav>

        {organizationId ? (
          <nav
            aria-label="Company setup navigation"
            className="mt-6 border-t border-[var(--line)] pt-5"
          >
            <p className="px-4 pb-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Company setup
            </p>
            <div className="grid gap-1">
              {companySetupNav.map((item) => {
                const href = `/admin/organizations/${organizationId}${item.href}`;

                return (
                  <NavLink
                    href={href}
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
  );
}

const mobilePillClassName =
  "rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black transition hover:bg-[#f2f7f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]";

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
        isActive && "border-[#d8e8df] bg-[#f2f7f4] text-[var(--foreground)]"
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
          href={`${companyBase}/billing`}
          isActive={pathname.startsWith(`${companyBase}/billing`)}
          label="Billing"
        />
      </nav>
    );
  }

  return (
    <nav aria-label="Admin mobile navigation" className="flex items-center gap-2">
      <MobilePillLink
        href="/admin/organizations"
        isActive={pathname.startsWith("/admin/organizations")}
        label="Companies"
      />
      <MobilePillLink
        href="/admin/call-requests"
        isActive={pathname.startsWith("/admin/call-requests")}
        label="Calls"
      />
      <MobilePillLink href="/dashboard" label="Dashboard" />
    </nav>
  );
}
