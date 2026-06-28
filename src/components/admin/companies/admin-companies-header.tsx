import Link from "next/link";

import {
  BellIcon,
  PlusIcon
} from "@/components/admin/companies/admin-companies-icons";

export function AdminCompaniesHeader({
  notificationCount
}: {
  notificationCount: number;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-[13px] font-medium">
          <Link className="text-[#2563ff] transition hover:text-[#1d4ed8]" href="/admin">
            Admin
          </Link>
          <span className="mx-2 text-[#94a3b8]">/</span>
          <span className="text-[#64748b]">Companies</span>
        </nav>
        <h1 className="mt-3 text-[2rem] font-bold leading-tight tracking-tight text-[#0b1328]">
          Companies
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#64748b]">
          View and manage all companies in your platform.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 self-start">
        <Link
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} new` : ""}`}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e3eaf5] bg-white text-[#2563ff] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:bg-[#f8fbff]"
          href="/admin/call-requests"
        >
          <BellIcon className="h-[18px] w-[18px]" />
          {notificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2563ff] px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </Link>

        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2563ff] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,255,0.28)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
          href="/admin/call-requests"
        >
          <PlusIcon className="h-4 w-4" />
          Add company
        </Link>
      </div>
    </header>
  );
}
