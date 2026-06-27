import Link from "next/link";

import { EmptyState } from "@/components/dashboard/dashboard-ui";
import type { OpeningResponseGroup, ServiceRow } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import type { ExtendedOpeningFilters } from "@/lib/responses/filters";
import { buildOpeningFiltersResetHref, buildResponsesHref } from "@/lib/responses/filters";

import { ResponsesFilters } from "./ResponsesFilters";
import { ResponsesPagination } from "./ResponsesTable";
import { SlotAlertCard } from "./SlotAlertCard";

export function SlotAlertsTab({
  groups,
  filters,
  filteredCount,
  totalCount,
  locale,
  services,
  servicePriceById,
  canValidate,
  notice,
  validationError
}: {
  groups: OpeningResponseGroup[];
  filters: ExtendedOpeningFilters;
  filteredCount: number;
  totalCount: number;
  locale: Locale;
  services: ServiceRow[];
  servicePriceById: Map<string, number | null>;
  canValidate: boolean;
  notice?: string;
  validationError?: string;
}) {
  const copy = getDashboardCopy(locale);

  return (
    <div className="grid gap-4">
      {notice ? (
        <p className="rounded-xl border border-[#b8e0c0] bg-[#f1fff4] p-3 text-sm font-bold text-[#245d30]">
          {notice}
        </p>
      ) : null}
      {validationError ? (
        <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          {validationError}
        </p>
      ) : null}

      <ResponsesFilters
        filteredCount={filteredCount}
        filters={filters}
        locale={locale}
        services={services}
        totalCount={totalCount}
      />

      {groups.length > 0 ? (
        <>
          <div className="grid gap-3">
            {groups.map((group, index) => (
              <SlotAlertCard
                canValidate={canValidate}
                defaultExpanded={index === 0}
                group={group}
                key={group.openingId}
                locale={locale}
                recoveredValueCents={
                  group.serviceId
                    ? servicePriceById.get(group.serviceId) ?? 0
                    : 0
                }
              />
            ))}
          </div>
          <ResponsesPagination
            buildPageHref={(page, pageSize) =>
              buildResponsesHref({ ...filters, page, pageSize }, "openings")
            }
            page={filters.page}
            pageSize={filters.pageSize}
            total={filteredCount}
          />
        </>
      ) : (
        <div className="grid gap-3">
          <EmptyState
            description={
              totalCount > 0
                ? "Aucun résultat ne correspond aux filtres sélectionnés."
                : copy.responses.openingsPanel.emptyDescription
            }
            title={
              totalCount > 0
                ? copy.responses.openingsPanel.emptyFilteredTitle
                : "Aucune réponse pour cette période."
            }
          />
          {totalCount > 0 ? (
            <Link
              className="justify-self-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-[var(--foreground)]"
              href={buildOpeningFiltersResetHref()}
            >
              {copy.common.reset}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
