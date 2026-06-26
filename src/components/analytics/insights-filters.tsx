"use client";

import Link from "next/link";

import { INSIGHTS_PERIOD_OPTIONS } from "@/lib/analytics/periods";
import type { InsightsFilters, InsightsPeriodWindow } from "@/lib/analytics/types";
import { cn } from "@/lib/utils/cn";

function buildInsightsHref(
  current: InsightsFilters,
  updates: Partial<InsightsFilters>
) {
  const params = new URLSearchParams();
  const period = updates.period ?? current.period;
  const serviceId = updates.serviceId ?? current.serviceId;
  const granularity = updates.granularity ?? current.granularity;

  params.set("period", period);
  params.set("granularity", granularity);

  if (serviceId) {
    params.set("service", serviceId);
  }

  return `/dashboard/analytics?${params.toString()}`;
}

export function InsightsFiltersBar({
  filters,
  periodWindow,
  services,
  organizationName
}: {
  filters: InsightsFilters;
  periodWindow: InsightsPeriodWindow;
  services: Array<{ id: string; name: string }>;
  organizationName: string;
}) {
  return (
    <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {INSIGHTS_PERIOD_OPTIONS.map((option) => {
            const isActive = filters.period === option.value;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
                  isActive
                    ? "bg-[#2563ff] text-white shadow-[0_8px_20px_rgba(37,99,255,0.22)]"
                    : "border border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:bg-white"
                )}
                href={buildInsightsHref(filters, { period: option.value })}
                key={option.value}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="grid gap-1.5">
            <span className="sr-only">Marchand</span>
            <select
              aria-label="Marchand"
              className="min-h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm font-medium text-[#07142f] disabled:cursor-not-allowed disabled:opacity-70"
              disabled
              value="all"
            >
              <option value="all">{organizationName || "Tous les marchands"}</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="sr-only">Service</span>
            <select
              aria-label="Service"
              className="min-h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm font-medium text-[#07142f]"
              defaultValue={filters.serviceId ?? "all"}
              onChange={(event) => {
                const value = event.target.value;
                window.location.href = buildInsightsHref(filters, {
                  serviceId: value === "all" ? null : value
                });
              }}
            >
              <option value="all">Tous les services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <div className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm font-medium text-[#475569]">
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[#64748b]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path d="M8 2v3m8-3v3M4 9h16M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
            </svg>
            <span>{periodWindow.dateRangeLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
