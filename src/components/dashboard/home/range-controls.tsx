"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { DashboardRange } from "@/lib/dashboard/date-range";
import { cn } from "@/lib/utils/cn";

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 2v2M16 2v2M4 9h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function DashboardRangeControls({
  currentRange,
  rangeLabel,
  rangeOptions,
  filtersLabel
}: {
  currentRange: DashboardRange;
  rangeLabel: string;
  rangeOptions: Array<{ value: DashboardRange; label: string }>;
  filtersLabel: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function buildHref(range: DashboardRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <button
          aria-expanded={rangeOpen}
          aria-haspopup="listbox"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e2eaf5] bg-white px-4 text-sm font-medium text-[#0b1328] shadow-sm transition hover:bg-[#f8fbff]"
          onClick={() => {
            setRangeOpen((open) => !open);
            setFiltersOpen(false);
          }}
          type="button"
        >
          <CalendarIcon />
          <span>{rangeLabel}</span>
          <ChevronIcon />
        </button>
        {rangeOpen ? (
          <div
            className="absolute right-0 z-20 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-[#e2eaf5] bg-white p-1 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
            role="listbox"
          >
            {rangeOptions.map((option) => (
              <Link
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm transition hover:bg-[#f8fbff]",
                  currentRange === option.value
                    ? "font-semibold text-[#2563ff]"
                    : "text-[#0b1328]"
                )}
                href={buildHref(option.value)}
                key={option.value}
                onClick={() => setRangeOpen(false)}
                role="option"
              >
                {option.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          aria-expanded={filtersOpen}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e2eaf5] bg-white px-4 text-sm font-medium text-[#0b1328] shadow-sm transition hover:bg-[#f8fbff]"
          onClick={() => {
            setFiltersOpen((open) => !open);
            setRangeOpen(false);
          }}
          type="button"
        >
          <FilterIcon />
          <span>{filtersLabel}</span>
          <ChevronIcon />
        </button>
        {filtersOpen ? (
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-[#e2eaf5] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <p className="text-sm leading-6 text-[#64748b]">
              Les filtres avancés seront disponibles prochainement. Utilisez le
              sélecteur de période pour ajuster les données affichées.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
