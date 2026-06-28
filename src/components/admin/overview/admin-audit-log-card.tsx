import Link from "next/link";

import { ShieldIcon } from "@/components/admin/overview/admin-overview-icons";
import type { AuditLogRow } from "@/lib/admin/overview-data";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

export function AdminAuditLogCard({ rows }: { rows: AuditLogRow[] }) {
  return (
    <section className="rounded-[20px] border border-[#e1e9f5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0b1328]">Journal d&apos;audit</h2>
        <Link
          className="text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
          href="/admin/audit"
        >
          Voir tout
        </Link>
      </div>

      <div className="mt-5 divide-y divide-[#edf2f9]">
        {rows.length === 0 ? (
          <p className="py-8 text-sm text-[#657492]">Aucun événement d&apos;audit récent</p>
        ) : (
          rows.map((row) => (
            <div className="flex items-start gap-3 py-4" key={row.id}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563ff]">
                <ShieldIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0b1328]">{row.title}</p>
                <p className="mt-1 text-sm text-[#657492]">{row.subtitle}</p>
              </div>
              <time
                className="shrink-0 text-xs font-medium text-[#657492]"
                dateTime={row.createdAt}
              >
                {dateFormatter.format(new Date(row.createdAt))}
              </time>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
