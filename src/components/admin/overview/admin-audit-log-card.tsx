import Link from "next/link";

import {
  AdminOverviewPanel,
  AdminOverviewSectionTitle
} from "@/components/admin/overview/admin-overview-panel";
import { ShieldIcon } from "@/components/admin/overview/admin-overview-icons";
import type { AuditLogRow } from "@/lib/admin/overview-data";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

export function AdminAuditLogCard({
  rows,
  className
}: {
  rows: AuditLogRow[];
  className?: string;
}) {
  return (
    <AdminOverviewPanel className={className}>
      <div className="flex items-center justify-between gap-3">
        <AdminOverviewSectionTitle>Journal d&apos;audit</AdminOverviewSectionTitle>
        <Link
          className="text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
          href="/admin/audit"
        >
          Voir tout
        </Link>
      </div>

      <div className="mt-4 divide-y divide-[#edf2f9]">
        {rows.length === 0 ? (
          <p className="py-10 text-sm text-[#657492]">Aucun événement d&apos;audit récent</p>
        ) : (
          rows.map((row) => (
            <div className="flex items-start gap-3 py-4" key={row.id}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
                <ShieldIcon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0b1328]">{row.title}</p>
                <p className="mt-1 text-sm text-[#657492]">{row.subtitle}</p>
              </div>
              <time
                className="shrink-0 text-xs font-medium text-[#94a3b8]"
                dateTime={row.createdAt}
              >
                {dateFormatter.format(new Date(row.createdAt))}
              </time>
            </div>
          ))
        )}
      </div>
    </AdminOverviewPanel>
  );
}
