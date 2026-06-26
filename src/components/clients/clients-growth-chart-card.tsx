"use client";

import { useMemo, useState } from "react";

import { ClientsGrowthChart } from "@/components/clients/clients-growth-chart";
import {
  buildGrowthSeries,
  GROWTH_CHART_PERIODS,
  type GrowthChartPeriodDays
} from "@/lib/clients/growth-series";

export function ClientsGrowthChartCard({
  enrollmentTimestamps
}: {
  enrollmentTimestamps: string[];
}) {
  const [periodDays, setPeriodDays] = useState<GrowthChartPeriodDays>(30);

  const series = useMemo(
    () => buildGrowthSeries(enrollmentTimestamps, periodDays),
    [enrollmentTimestamps, periodDays]
  );

  return (
    <div className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#07142f]">
          Croissance de la liste d&apos;attente
        </h2>
        <label className="relative shrink-0">
          <span className="sr-only">Période du graphique</span>
          <select
            className="inline-flex appearance-none items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] py-1.5 pl-3 pr-8 text-xs font-semibold text-[#64748b] focus-visible:border-[#2563ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff]/20"
            onChange={(event) =>
              setPeriodDays(Number(event.target.value) as GrowthChartPeriodDays)
            }
            value={periodDays}
          >
            {GROWTH_CHART_PERIODS.map((period) => (
              <option key={period.days} value={period.days}>
                {period.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </label>
      </div>
      <ClientsGrowthChart key={periodDays} series={series} />
    </div>
  );
}
