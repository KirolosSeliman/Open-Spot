import Link from "next/link";

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
  new: "bg-[#eff6ff] text-[#2563ff]",
  contacted: "bg-[#fff7ed] text-[#ea580c]",
  qualified: "bg-[#fff7ed] text-[#f97316]",
  converted: "bg-[#ecfdf3] text-[#16a34a]",
  closed: "bg-[#ecfdf3] text-[#16a34a]",
  spam: "bg-[#fef2f2] text-[#ef4444]"
};

export function RecentCallRequestsCard({
  rows
}: {
  rows: RecentCallRequestRow[];
}) {
  return (
    <section className="rounded-[20px] border border-[#e1e9f5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0b1328]">Demandes d&apos;appel récentes</h2>
        <Link
          className="text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
          href="/admin/call-requests"
        >
          Voir toutes
        </Link>
      </div>

      <div className="mt-5 divide-y divide-[#edf2f9]">
        {rows.length === 0 ? (
          <p className="py-8 text-sm text-[#657492]">Aucune demande d&apos;appel récente</p>
        ) : (
          rows.map((row) => (
            <Link
              className="flex items-center gap-3 py-4 transition hover:bg-[#f8fbff]"
              href={`/admin/call-requests/${row.id}`}
              key={row.id}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563ff]">
                <PhoneIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#0b1328]">{row.name}</p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      statusStyles[row.status]
                    )}
                  >
                    {statusLabels[row.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#657492]">
                  {row.phone} · {row.businessName}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span className="text-xs font-medium text-[#657492]">
                  {dateFormatter.format(new Date(row.createdAt))}
                </span>
                <ChevronRightIcon className="h-4 w-4 text-[#657492]" />
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
