import Link from "next/link";

import { ChevronRightIcon } from "@/components/admin/overview/admin-overview-icons";
import type { TopCompanyRow } from "@/lib/admin/overview-data";
import { cn } from "@/lib/utils/cn";

function getRankBadgeClassName(rank: number) {
  if (rank === 1) {
    return "bg-[#fef3c7] text-[#b45309]";
  }

  if (rank === 2) {
    return "bg-[#f3f4f6] text-[#4b5563]";
  }

  if (rank === 3) {
    return "bg-[#ffedd5] text-[#ea580c]";
  }

  return "bg-[#f8fbff] text-[#657492]";
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export function TopCompaniesTable({
  rows,
  page,
  totalCount,
  totalPages,
  smsRange
}: {
  rows: TopCompanyRow[];
  page: number;
  totalCount: number;
  totalPages: number;
  smsRange?: string;
}) {
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);

  function buildPageHref(nextPage: number) {
    const params = new URLSearchParams();

    if (smsRange) {
      params.set("smsRange", smsRange);
    }

    if (nextPage > 1) {
      params.set("topPage", String(nextPage));
    }

    const query = params.toString();
    return query ? `/admin?${query}` : "/admin";
  }

  return (
    <section className="rounded-[20px] border border-[#e1e9f5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:col-span-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0b1328]">Top compagnies performantes</h2>
        <Link
          className="text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
          href="/admin/organizations"
        >
          Voir toutes
        </Link>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#edf2f9] text-xs uppercase tracking-[0.08em] text-[#657492]">
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
                <td className="px-3 py-8 text-[#657492]" colSpan={5}>
                  Aucune compagnie visible pour le moment
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr className="border-b border-[#f3f6fb]" key={row.id}>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                        getRankBadgeClassName(row.rank)
                      )}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-bold text-[#2563ff]">
                        {getInitials(row.name)}
                      </span>
                      <div>
                        <Link
                          className="font-semibold text-[#0b1328] hover:text-[#2563ff]"
                          href={`/admin/organizations/${row.id}`}
                        >
                          {row.name}
                        </Link>
                        {row.location ? (
                          <p className="text-xs text-[#657492]">{row.location}</p>
                        ) : null}
                      </div>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[#edf2f9] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#657492]">
          {rows.length.toLocaleString("fr-CA")} sur {totalCount.toLocaleString("fr-CA")}{" "}
          compagnies
        </p>

        {totalPages > 1 ? (
          <div className="flex items-center gap-1">
            <Link
              aria-label="Page précédente"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e9f5] text-[#657492]",
                page <= 1 && "pointer-events-none opacity-40"
              )}
              href={buildPageHref(Math.max(1, page - 1))}
            >
              <ChevronRightIcon className="h-4 w-4 rotate-180" />
            </Link>
            {pageNumbers.map((pageNumber) => (
              <Link
                aria-current={pageNumber === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold",
                  pageNumber === page
                    ? "border-[#2563ff] bg-[#eff6ff] text-[#2563ff]"
                    : "border-[#e1e9f5] text-[#657492] hover:bg-[#f8fbff]"
                )}
                href={buildPageHref(pageNumber)}
                key={pageNumber}
              >
                {pageNumber}
              </Link>
            ))}
            <Link
              aria-label="Page suivante"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e9f5] text-[#657492]",
                page >= totalPages && "pointer-events-none opacity-40"
              )}
              href={buildPageHref(Math.min(totalPages, page + 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
