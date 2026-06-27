import Link from "next/link";

import type { ServiceRow } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import { buildResponsesHref, buildOpeningFiltersResetHref, type ExtendedOpeningFilters } from "@/lib/responses/filters";

function SlidersIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 7h10M14 7h6M4 12h4M10 12h10M4 17h8M14 17h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="16" cy="7" fill="currentColor" r="1.5" />
      <circle cx="8" cy="12" fill="currentColor" r="1.5" />
      <circle cx="12" cy="17" fill="currentColor" r="1.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 3v2M16 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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
      className="mb-5 rounded-[1.35rem] border border-[var(--line)] bg-white p-4 shadow-sm"
      method="get"
    >
      <input name="tab" type="hidden" value="openings" />
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr_0.9fr_1.2fr_auto] lg:items-end">
        <label className="grid gap-2 text-sm font-bold">
          Période du créneau
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
              <CalendarIcon />
            </span>
            <select
              className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-slate-50 pl-10 pr-3 text-sm font-bold"
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
        <label className="grid gap-2 text-sm font-bold">
          Service
          <select
            className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-slate-50 px-3 text-sm font-bold"
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
        <label className="grid gap-2 text-sm font-bold">
          Statut
          <select
            className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-slate-50 px-3 text-sm font-bold"
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
        <label className="grid gap-2 text-sm font-bold">
          Recherche
          <input
            aria-label={copy.responses.filters.searchAria}
            autoComplete="off"
            className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-slate-50 px-3 text-sm font-bold"
            defaultValue={filters.q}
            inputMode="search"
            maxLength={80}
            name="q"
            placeholder="Titre, client, téléphone, SMS..."
            type="search"
          />
        </label>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black text-[var(--foreground)] hover:bg-slate-50"
          type="submit"
        >
          <SlidersIcon />
          Filtres
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[var(--muted)]">
        <p>{copy.responses.filters.displayed(filteredCount, totalCount)}</p>
        <div className="flex gap-2">
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
