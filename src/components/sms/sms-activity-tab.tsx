"use client";

import type { AdminSmsDiagnosticRow } from "@/lib/admin/sms-diagnostics";
import type { SmsActivityMetrics } from "@/lib/sms/configuration-data";
import { formatSmsDate, rowStatusLabel, smsPageStyles } from "@/components/sms/sms-shared";
import { SmsBadge, SmsCard, SmsEmptyState } from "@/components/sms/sms-ui";

export function SmsActivityTab({
  rows,
  metrics,
  baseHref,
  filters
}: {
  rows: AdminSmsDiagnosticRow[];
  metrics: SmsActivityMetrics;
  baseHref: string;
  filters: {
    q: string;
    direction: string;
    from: string;
    to: string;
  };
}) {
  return (
    <div className="grid gap-4">
      <SmsCard className="p-4">
        <p className="text-sm text-[#64748b]">
          {metrics.outboundCount} SMS sortants · Dernière sync{" "}
          {formatSmsDate(metrics.lastSyncAt)}
        </p>
      </SmsCard>

      <SmsCard className="p-4">
        <form action={baseHref} className="mb-4 flex flex-wrap gap-2" method="get">
          <input name="tab" type="hidden" value="activity" />
          <input
            className={`${smsPageStyles.input} max-w-xs`}
            defaultValue={filters.q}
            name="q"
            placeholder="Rechercher…"
          />
          <select
            className={smsPageStyles.input}
            defaultValue={filters.direction || "all"}
            name="direction"
          >
            <option value="all">Toutes directions</option>
            <option value="outbound">Sortants</option>
            <option value="inbound">Entrants</option>
          </select>
          <button className={smsPageStyles.secondaryButton} type="submit">
            Filtrer
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e1e9f5] text-xs text-[#64748b]">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Dir.</th>
                <th className="px-2 py-2">Statut</th>
                <th className="px-2 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row) => (
                <tr className="border-b border-[#e1e9f5]" key={row.id}>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {formatSmsDate(row.createdAt)}
                  </td>
                  <td className="px-2 py-2">
                    {row.direction === "outbound" ? "→" : "←"}
                  </td>
                  <td className="px-2 py-2">
                    <SmsBadge label={rowStatusLabel(row)} />
                  </td>
                  <td className="max-w-md truncate px-2 py-2">{row.bodyPreview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <SmsEmptyState
              description="Les messages apparaîtront ici après envoi ou réception."
              title="Aucun message"
            />
          </div>
        ) : null}
      </SmsCard>
    </div>
  );
}
