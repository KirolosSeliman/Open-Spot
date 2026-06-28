import Link from "next/link";

import {
  AdminOverviewPanel,
  AdminOverviewSectionTitle
} from "@/components/admin/overview/admin-overview-panel";
import type { TopCompanyRow } from "@/lib/admin/overview-data";
import { cn } from "@/lib/utils/cn";

function getRankDisplay(rank: number) {
  if (rank === 1) {
    return { label: "🥇", className: "bg-[#fef3c7] text-[#b45309]" };
  }

  if (rank === 2) {
    return { label: "🥈", className: "bg-[#f3f4f6] text-[#4b5563]" };
  }

  if (rank === 3) {
    return { label: "🥉", className: "bg-[#ffedd5] text-[#ea580c]" };
  }

  return { label: String(rank), className: "bg-[#f8fbff] text-[#657492]" };
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export function TopCompaniesTable({
  rows,
  totalCount,
  className
}: {
  rows: TopCompanyRow[];
  totalCount: number;
  className?: string;
}) {
  return (
    <AdminOverviewPanel className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-3">
        <AdminOverviewSectionTitle>Top compagnies performantes</AdminOverviewSectionTitle>
        <Link
          className="text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
          href="/admin/organizations"
        >
          Voir toutes
        </Link>
      </div>

      <div className="mt-5 max-h-[420px] overflow-y-auto overflow-x-auto rounded-[14px] border border-[#edf2f9]">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-[#edf2f9] text-[11px] uppercase tracking-[0.12em] text-[#94a3b8]">
              <th className="px-3 py-3 font-semibold">Rang</th>
              <th className="px-3 py-3 font-semibold">Compagnie</th>
              <th className="px-3 py-3 font-semibold">Créneaux récupérés (30 j)</th>
              <th className="px-3 py-3 font-semibold">Taux de réponse (30 j)</th>
              <th className="px-3 py-3 font-semibold">Revenus récupérés (30 j)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-10 text-[#657492]" colSpan={5}>
                  Aucune compagnie visible pour le moment
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rank = getRankDisplay(row.rank);

                return (
                  <tr className="border-b border-[#f3f6fb] last:border-b-0" key={row.id}>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                          rank.className
                        )}
                      >
                        {rank.label}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div>
                        <Link
                          className="font-semibold text-[#0b1328] hover:text-[#2563ff]"
                          href={`/admin/organizations/${row.id}`}
                        >
                          {row.name}
                        </Link>
                        {row.location ? (
                          <p className="text-xs text-[#94a3b8]">{row.location}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-4 font-semibold text-[#0b1328]">
                      {row.filledSpots.toLocaleString("fr-CA")}
                    </td>
                    <td className="px-3 py-4 font-semibold text-[#16a34a]">
                      {row.responseRate.toLocaleString("fr-CA")} %
                    </td>
                    <td className="px-3 py-4 font-semibold text-[#0b1328]">
                      {formatCurrency(row.recoveredRevenueCents)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 border-t border-[#edf2f9] pt-4 text-sm text-[#657492]">
        {rows.length.toLocaleString("fr-CA")} sur {totalCount.toLocaleString("fr-CA")}{" "}
        compagnies
      </p>
    </AdminOverviewPanel>
  );
}
