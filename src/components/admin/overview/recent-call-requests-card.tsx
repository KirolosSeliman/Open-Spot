import Link from "next/link";

import {
  AdminOverviewPanel,
  AdminOverviewSectionTitle
} from "@/components/admin/overview/admin-overview-panel";
import {
  ChevronRightIcon,
  PhoneIcon
} from "@/components/admin/overview/admin-overview-icons";
import type { RecentCallRequestRow } from "@/lib/admin/overview-data";
import { cn } from "@/lib/utils/cn";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const statusLabels: Record<RecentCallRequestRow["status"], string> = {
  new: "Nouveau",
  contacted: "En cours",
  qualified: "En attente",
  converted: "Terminé",
  closed: "Terminé",
  spam: "Spam"
};

const statusStyles: Record<RecentCallRequestRow["status"], string> = {
  new: "bg-[#eef4ff] text-[#2563ff]",
  contacted: "bg-[#fff7ed] text-[#ea580c]",
  qualified: "bg-[#fff7ed] text-[#f97316]",
  converted: "bg-[#ecfdf3] text-[#16a34a]",
  closed: "bg-[#ecfdf3] text-[#16a34a]",
  spam: "bg-[#fef2f2] text-[#ef4444]"
};

export function RecentCallRequestsCard({
  rows,
  className
}: {
  rows: RecentCallRequestRow[];
  className?: string;
}) {
  return (
    <AdminOverviewPanel className={className}>
      <div className="flex items-center justify-between gap-3">
        <AdminOverviewSectionTitle>Demandes d&apos;appel récentes</AdminOverviewSectionTitle>
        <Link
          className="text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
          href="/admin/call-requests"
        >
          Voir toutes
        </Link>
      </div>

      <div className="mt-4 divide-y divide-[#edf2f9]">
        {rows.length === 0 ? (
          <p className="py-10 text-sm text-[#657492]">Aucune demande d&apos;appel récente</p>
        ) : (
          rows.map((row) => (
            <Link
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-4 transition hover:bg-[#f8fbff] sm:grid-cols-[auto_1fr_auto_auto]"
              href={`/admin/call-requests/${row.id}`}
              key={row.id}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
                <PhoneIcon className="h-[18px] w-[18px]" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-[#0b1328]">{row.name}</p>
                <p className="mt-1 truncate text-sm text-[#657492]">
                  {row.phone} · {row.businessName}
                </p>
              </div>

              <span
                className={cn(
                  "justify-self-end rounded-full px-3 py-1 text-[11px] font-semibold sm:justify-self-auto",
                  statusStyles[row.status]
                )}
              >
                {statusLabels[row.status]}
              </span>

              <div className="col-span-3 flex items-center justify-end gap-2 sm:col-span-1">
                <span className="text-xs font-medium text-[#94a3b8]">
                  {dateFormatter.format(new Date(row.createdAt))}
                </span>
                <ChevronRightIcon className="h-4 w-4 text-[#94a3b8]" />
              </div>
            </Link>
          ))
        )}
      </div>
    </AdminOverviewPanel>
  );
}
