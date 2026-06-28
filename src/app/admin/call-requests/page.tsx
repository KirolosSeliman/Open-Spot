import { CallRequestsTable } from "@/components/admin/call-requests-table";
import { CallRequestsFilters } from "@/components/admin/call-requests/call-requests-filters";
import { CallRequestsHeader } from "@/components/admin/call-requests/call-requests-header";
import { CallRequestsKpiCards } from "@/components/admin/call-requests/call-requests-kpi-cards";
import { loadBookCallRequests } from "@/lib/admin/call-requests";
import type { BookCallRequestDateRange } from "@/lib/book-call/admin";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

type CallRequestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
  fallback = ""
) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function parseDateRange(value: string): BookCallRequestDateRange {
  if (value === "7" || value === "30" || value === "90" || value === "all") {
    return value;
  }

  return "30";
}

export default async function CallRequestsPage({
  searchParams
}: CallRequestsPageProps) {
  await requireCurrentPlatformAdmin();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = firstParam(resolvedSearchParams.status, "all");
  const q = firstParam(resolvedSearchParams.q);
  const range = parseDateRange(firstParam(resolvedSearchParams.range, "30"));
  const notice = firstParam(resolvedSearchParams.notice);
  const errorMessage = firstParam(resolvedSearchParams.error);
  const { filteredRequests, stats, error } = await loadBookCallRequests({
    q,
    status,
    range
  });

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col gap-4 lg:min-h-[calc(100dvh-4.5rem)] lg:gap-5">
      <CallRequestsHeader />

      {notice ? (
        <p
          className="shrink-0 rounded-[16px] border border-[#bbf7d0] bg-[#ecfdf5] px-4 py-3 text-sm font-semibold text-[#16a34a]"
          role="status"
        >
          {notice}
        </p>
      ) : null}
      {errorMessage || error ? (
        <p
          className="shrink-0 rounded-[16px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#dc2626]"
          role="alert"
        >
          {errorMessage || error}
        </p>
      ) : null}

      <CallRequestsKpiCards stats={stats} />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[#e3eaf5] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-4 shrink-0">
          <h2 className="text-base font-bold text-[#0b1328] xl:text-lg">
            Boîte de demandes
          </h2>
          <p className="mt-1 text-xs italic leading-5 text-[#64748b] xl:text-sm xl:leading-6">
            Les liens SMS et email servent au suivi manuel seulement. Aucun SMS
            marketing et aucune validation de rendez-vous ne part depuis cette
            page.
          </p>
        </div>

        <CallRequestsFilters q={q} range={range} status={status} />

        <div className="min-h-0 flex-1 overflow-hidden pt-4">
          <CallRequestsTable requests={filteredRequests} />
        </div>
      </section>
    </div>
  );
}
