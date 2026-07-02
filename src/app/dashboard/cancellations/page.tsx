import Link from "next/link";

import { CancellationsHistoryTable } from "@/components/dashboard/cancellations-history-table";
import { loadOpenings } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";

export default async function CancellationsPage() {
  const [openings, locale] = await Promise.all([
    loadOpenings(),
    getRequestLocale()
  ]);
  const copy = getDashboardCopy(locale).history;

  return (
    <div className="grid min-w-0 max-w-full gap-8">
      <section className="rounded-[2rem] border border-[#e2e8f0] bg-white/95 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563ff]">
              {copy.eyebrow}
            </p>
            <h1 className="os-mobile-page-title mt-3 text-3xl font-black tracking-tight text-[#071026] sm:text-[2.5rem] sm:leading-[1.05]">
              {copy.title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#64748b] sm:text-[15px]">
              {copy.descriptionLine1}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#64748b] sm:text-[15px]">
              {copy.descriptionLine2}
            </p>
          </div>

          <Link
            className="inline-flex min-h-[3.25rem] shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#2563ff] px-6 text-sm font-bold text-white shadow-[0_16px_32px_rgba(37,99,255,0.24)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff] lg:self-center"
            href="/dashboard/new-cancellation"
          >
            <span aria-hidden="true" className="text-base leading-none">
              +
            </span>
            {copy.newCancellation}
          </Link>
        </div>
      </section>

      <CancellationsHistoryTable
        copy={{
          tableTitle: copy.tableTitle,
          columns: copy.columns,
          pagination: copy.pagination,
          empty: copy.empty,
          rowActions: copy.rowActions
        }}
        locale={locale}
        openings={openings}
      />
    </div>
  );
}
