import { InsightsChartsSection } from "@/components/analytics/insights-charts";
import { InsightsExportButton } from "@/components/analytics/insights-export-button";
import { InsightsFiltersBar } from "@/components/analytics/insights-filters";
import { InsightsKpiGrid } from "@/components/analytics/insights-kpi-grid";
import type { InsightsData } from "@/lib/analytics/types";

export function InsightsPageContent({ data }: { data: InsightsData }) {
  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <h1 className="os-mobile-page-title text-3xl font-black tracking-tight text-[#07142f] sm:text-4xl">
            Insights &amp; rapports
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b] sm:text-base">
            Analysez vos performances, suivez vos revenus récupérés et optimisez
            vos résultats.
          </p>
        </div>
        <div className="w-full min-w-0 shrink-0 max-md:[&>*]:w-full lg:w-auto">
          <InsightsExportButton payload={data.exportPayload} />
        </div>
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
