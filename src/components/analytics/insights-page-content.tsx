import { InsightsChartsSection } from "@/components/analytics/insights-charts";
import { InsightsExportButton } from "@/components/analytics/insights-export-button";
import { InsightsFiltersBar } from "@/components/analytics/insights-filters";
import { InsightsKpiGrid } from "@/components/analytics/insights-kpi-grid";
import type { InsightsData } from "@/lib/analytics/types";

export function InsightsPageContent({ data }: { data: InsightsData }) {
  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-black tracking-tight text-[#07142f] sm:text-4xl">
            Insights &amp; rapports
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b] sm:text-base">
            Analysez vos performances, suivez vos revenus récupérés et optimisez
            vos résultats.
          </p>
        </div>
        <InsightsExportButton payload={data.exportPayload} />
      </header>

      <InsightsFiltersBar
        filters={data.filters}
        organizationName={data.organizationName}
        periodWindow={data.periodWindow}
        services={data.services}
      />

      <InsightsKpiGrid kpis={data.kpis} />

      <InsightsChartsSection
        filters={data.filters}
        funnel={data.funnel}
        recoveredRevenueSeries={data.recoveredRevenueSeries}
        recoveredRevenueTotalCents={data.recoveredRevenueTotalCents}
        responseRateDonut={data.responseRateDonut}
        smsVsResponsesSeries={data.smsVsResponsesSeries}
        topServices={data.topServices}
        waitlistGrowthSeries={data.waitlistGrowthSeries}
        waitlistTotal={data.waitlistTotal}
      />

      <p className="text-xs text-[#64748b]">
        Les données sont mises à jour automatiquement. Fuseau horaire :{" "}
        {data.timezone}.
      </p>
    </div>
  );
}
