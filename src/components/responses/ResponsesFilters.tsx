import Link from "next/link";

import type { ServiceRow } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import {
  buildOpeningFiltersResetHref,
  buildResponsesHref,
  type ExtendedOpeningFilters
} from "@/lib/responses/filters";

import { CalendarSlotIcon, SearchIcon, SlidersIcon } from "./responses-icons";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#dbeafe]";

export function ResponsesFilters({
  filters,
  locale,
  services,
  filteredCount,
  totalCount
}: {
  filters: ExtendedOpeningFilters;
  locale: Locale;
  services: ServiceRow[];
  filteredCount: number;
  totalCount: number;
}) {
  const copy = getDashboardCopy(locale);
  const openingRangeOptions: Array<{
    label: string;
    value: ExtendedOpeningFilters["range"];
  }> = [
    { label: copy.responses.ranges.this_week, value: "this_week" },
    { label: copy.responses.ranges.two_weeks, value: "two_weeks" },
    { label: copy.responses.ranges.one_month, value: "one_month" },
    { label: copy.responses.ranges.three_months, value: "three_months" },
    { label: copy.responses.ranges.all, value: "all" }
  ];
  const statusOptions = [
    { label: "Tous les statuts", value: "all" },
    { label: "Créneau récupéré", value: "filled" },
    { label: "En attente", value: "awaiting" }
  ];

  return (
    <form
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5"
      method="get"
    >
      <input name="tab" type="hidden" value="openings" />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-[var(--muted)]">Période du créneau</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <CalendarSlotIcon />
            </span>
            <select
              className={`${fieldClass} appearance-none pl-10 pr-8`}
              defaultValue={filters.range}
              name="range"
            >
              {openingRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-[var(--muted)]">Service</span>
          <select
            className={`${fieldClass} appearance-none`}
            defaultValue={filters.serviceId}
            name="serviceId"
          >
            <option value="all">Tous les services</option>
            <option value="none">{copy.common.serviceNotSpecified}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-[var(--muted)]">Statut</span>
          <select
            className={`${fieldClass} appearance-none`}
            defaultValue={filters.status}
            name="status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-bold text-[var(--muted)]">Recherche</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </span>
            <input
              aria-label={copy.responses.filters.searchAria}
              autoComplete="off"
              className={`${fieldClass} pl-10`}
              defaultValue={filters.q}
              inputMode="search"
              maxLength={80}
              name="q"
              placeholder="Titre, client, téléphone, SMS..."
              type="search"
            />
          </div>
        </label>

        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-slate-50"
          type="submit"
        >
          <SlidersIcon />
          Filtres
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[var(--muted)]">
        <p>{copy.responses.filters.displayed(filteredCount, totalCount)}</p>
        <div className="flex items-center gap-3">
          {filters.q ? <p>{copy.responses.filters.search(filters.q)}</p> : null}
          <Link
            className="text-[var(--primary)] hover:underline"
            href={buildOpeningFiltersResetHref()}
          >
            {copy.common.reset}
          </Link>
        </div>
      </div>
    </form>
  );
}

export function buildSlotAlertsPageHref(
  filters: ExtendedOpeningFilters,
  page: number,
  pageSize: number
) {
  return buildResponsesHref({ ...filters, page, pageSize }, "openings");
}
