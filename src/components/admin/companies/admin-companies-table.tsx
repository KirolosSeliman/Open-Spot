"use client";

import Link from "next/link";
import { useState } from "react";

import { MoreVerticalIcon } from "@/components/admin/companies/admin-companies-icons";
import {
  archiveOrganizationAction,
  unarchiveOrganizationAction
} from "@/lib/admin/actions";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";
import type { AdminCompanyRow } from "@/lib/admin/companies-data";
import { cn } from "@/lib/utils/cn";

const numberFormatter = new Intl.NumberFormat("en-CA");

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
  hour: "numeric",
  minute: "2-digit"
});

function formatLastActivity(value: string | null) {
  if (!value) {
    return { date: "No activity", time: "" };
  }

  const parsed = new Date(value);

  return {
    date: dateFormatter.format(parsed),
    time: timeFormatter.format(parsed)
  };
}

function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const tone =
    normalized === "active"
      ? "bg-[#ecfdf5] text-[#16a34a]"
      : normalized === "archived"
        ? "bg-[#f1f5f9] text-[#64748b]"
        : normalized === "disabled"
          ? "bg-[#fef2f2] text-[#dc2626]"
          : "bg-[#f8fafc] text-[#64748b]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        tone
      )}
    >
      {label}
    </span>
  );
}

function CompanyActionsMenu({
  company,
  range
}: {
  company: AdminCompanyRow;
  range: string;
}) {
  const [open, setOpen] = useState(false);
  const detailHref = `/admin/organizations/${company.id}?range=${range}`;

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Actions for ${company.name}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0b1328]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <MoreVerticalIcon className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <button
            aria-label="Close actions menu"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            className="absolute right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-[#e3eaf5] bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
            role="menu"
          >
            <Link
              className="block px-3.5 py-2.5 text-sm font-medium text-[#0b1328] transition hover:bg-[#f8fbff]"
              href={detailHref}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              View company
            </Link>
            <Link
              className="block px-3.5 py-2.5 text-sm font-medium text-[#0b1328] transition hover:bg-[#f8fbff]"
              href={detailHref}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Open admin detail
            </Link>
            <Link
              className="block px-3.5 py-2.5 text-sm font-medium text-[#0b1328] transition hover:bg-[#f8fbff]"
              href={`/admin/organizations/${company.id}/sms`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              SMS
            </Link>
            <Link
              className="block px-3.5 py-2.5 text-sm font-medium text-[#0b1328] transition hover:bg-[#f8fbff]"
              href={`/admin/organizations/${company.id}/billing`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Billing
            </Link>
            {company.status === "archived" ? (
              <form action={unarchiveOrganizationAction} className="border-t border-[#e3eaf5]">
                <input name="organizationId" type="hidden" value={company.id} />
                <input name="returnTo" type="hidden" value="/admin/organizations" />
                <button
                  className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-[#0b1328] transition hover:bg-[#f8fbff]"
                  role="menuitem"
                  type="submit"
                >
                  Unarchive
                </button>
              </form>
            ) : (
              <details className="border-t border-[#e3eaf5]">
                <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-medium text-[#0b1328] transition hover:bg-[#f8fbff]">
                  Archive
                </summary>
                <form action={archiveOrganizationAction} className="space-y-2 px-3.5 pb-3">
                  <input name="organizationId" type="hidden" value={company.id} />
                  <input name="returnTo" type="hidden" value="/admin/organizations" />
                  <input
                    className="h-9 w-full rounded-lg border border-[#e3eaf5] px-3 text-xs outline-none focus:border-[#2563ff]"
                    name="reason"
                    placeholder="Reason required"
                    required
                  />
                  <button
                    className="w-full rounded-lg border border-[#e3eaf5] px-3 py-2 text-xs font-semibold transition hover:bg-[#f8fbff]"
                    type="submit"
                  >
                    Confirm archive
                  </button>
                </form>
              </details>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AdminCompaniesTable({
  companies,
  range,
  filteredCount,
  totalCount
}: {
  companies: AdminCompanyRow[];
  range: string;
  filteredCount: number;
  totalCount: number;
}) {
  if (companies.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <h2 className="text-lg font-bold text-[#0b1328]">No companies found</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          Adjust your search or filters to find companies.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="px-5 pb-3 text-sm font-medium text-[#64748b]">
        {filteredCount} {filteredCount === 1 ? "company" : "companies"} shown out of{" "}
        {totalCount}.
      </p>
      <div className="max-h-[560px] overflow-x-hidden overflow-y-auto">
        <table className="w-full table-fixed border-collapse text-left text-[13px]">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[17%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="sticky top-0 z-[1] bg-[#f8fafc] text-[10px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
            <tr>
              <th className="px-3 py-3">Company</th>
              <th className="px-2 py-3">Owner email</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3 text-right">Customers</th>
              <th className="px-2 py-3 text-right">Openings</th>
              <th className="px-2 py-3 text-right">Filled spots</th>
              <th className="px-2 py-3 text-right">SMS (30d)</th>
              <th className="px-2 py-3 text-right">Est. cost (30d)</th>
              <th className="px-2 py-3">
                <span className="inline-flex items-center gap-0.5">
                  Last activity
                  <ChevronDownIcon />
                </span>
              </th>
              <th className="px-2 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => {
              const activity = formatLastActivity(company.lastActivityAt);

              return (
                <tr
                  className="border-t border-[#e3eaf5] transition hover:bg-[#fbfdff]"
                  key={company.id}
                >
                  <td className="px-3 py-3">
                    <Link
                      className="group block min-w-0"
                      href={`/admin/organizations/${company.id}?range=${range}`}
                    >
                      <p className="truncate font-semibold text-[#0b1328] group-hover:text-[#2563ff]">
                        {company.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#64748b]">
                        {company.slug ?? "No slug"}
                      </p>
                    </Link>
                  </td>
                  <td className="px-2 py-3">
                    <span className="block truncate text-[#0b1328]" title={company.ownerEmail ?? undefined}>
                      {company.ownerEmail ?? "No owner email"}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge label={company.statusLabel} />
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-[#0b1328]">
                    {numberFormatter.format(company.customersCount)}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-[#0b1328]">
                    {numberFormatter.format(company.openingsCount)}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-[#0b1328]">
                    {numberFormatter.format(company.filledSpotsCount)}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-[#0b1328]">
                    {numberFormatter.format(company.smsSentCount)}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-[#0b1328]">
                    {formatEstimatedSmsCost(company.estimatedSmsCostCents)}
                  </td>
                  <td className="px-2 py-3 text-[#0b1328]">
                    <p className="truncate">{activity.date}</p>
                    {activity.time ? (
                      <p className="mt-0.5 truncate text-xs text-[#64748b]">{activity.time}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-3">
                    <CompanyActionsMenu company={company} range={range} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 text-[#94a3b8]", className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
