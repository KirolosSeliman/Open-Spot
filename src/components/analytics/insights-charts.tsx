"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  InsightsDualSeriesPoint,
  InsightsFilters,
  InsightsFunnelStep,
  InsightsSeriesPoint,
  InsightsServiceRow,
  InsightsTrend
} from "@/lib/analytics/types";
import { cn } from "@/lib/utils/cn";

const CHART = {
  width: 640,
  height: 280,
  paddingTop: 16,
  paddingRight: 20,
  paddingBottom: 36,
  paddingLeft: 52
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 0
  }).format(value);
}

function getYScale(maxValue: number) {
  if (maxValue <= 0) {
    return { max: 1, ticks: [0, 1] };
  }

  const step = Math.max(Math.ceil(maxValue / 4), 1);
  const max = Math.ceil(maxValue / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, index) => index * step);
  return { max, ticks };
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function buildAreaPath(
  points: Array<{ x: number; y: number }>,
  baselineY: number
) {
  if (points.length === 0) {
    return "";
  }

  const linePath = buildLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
}

function ChartCard({
  title,
  children,
  headerRight,
  subtitle
}: {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <article className="rounded-[18px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#07142f]">{title}</h2>
            <span
              aria-hidden="true"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#dbeafe] text-[11px] font-bold text-[#64748b]"
            >
              i
            </span>
          </div>
          {subtitle ? <div className="mt-1">{subtitle}</div> : null}
        </div>
        {headerRight}
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#dbeafe] bg-[#f8fafc] px-4 text-center text-sm text-[#64748b]">
      {message}
    </div>
  );
}

function TrendBadge({ trend }: { trend: InsightsTrend }) {
  return (
    <span
      className={cn(
        "text-sm font-bold",
        trend.tone === "positive" && "text-[#15803d]",
        trend.tone === "negative" && "text-[#b91c1c]",
        trend.tone === "neutral" && "text-[#64748b]"
      )}
    >
      {trend.display}
    </span>
  );
}

function buildInsightsHref(
  current: InsightsFilters,
  updates: Partial<InsightsFilters>
) {
  const params = new URLSearchParams();
  params.set("period", updates.period ?? current.period);
  params.set("granularity", updates.granularity ?? current.granularity);
  const serviceId = updates.serviceId ?? current.serviceId;
  if (serviceId) {
    params.set("service", serviceId);
  }
  return `/dashboard/analytics?${params.toString()}`;
}

function AreaSeriesChart({
  series,
  valueFormatter,
  ariaLabel,
  gradientId
}: {
  series: InsightsSeriesPoint[];
  valueFormatter: (value: number) => string;
  ariaLabel: string;
  gradientId: string;
}) {
  const [activeIndex, setActiveIndex] = useState(
    Math.max(series.length - 1, 0)
  );

  const chart = useMemo(() => {
    const plotLeft = CHART.paddingLeft;
    const plotTop = CHART.paddingTop;
    const plotRight = CHART.width - CHART.paddingRight;
    const plotBottom = CHART.height - CHART.paddingBottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    const dataMax = Math.max(...series.map((point) => point.value), 0);
    const yScale = getYScale(dataMax);
    const points = series.map((point, index) => ({
      ...point,
      x: plotLeft + (index / Math.max(series.length - 1, 1)) * plotWidth,
      y: plotBottom - (point.value / yScale.max) * plotHeight
    }));

    return {
      plotBottom,
      plotLeft,
      plotTop,
      plotWidth,
      yScale,
      points,
      linePath: buildLinePath(points),
      areaPath: buildAreaPath(points, plotBottom)
    };
  }, [series]);

  const activePoint = chart.points[activeIndex] ?? chart.points[chart.points.length - 1];

  if (series.length === 0 || series.every((point) => point.value === 0)) {
    return <EmptyChartState message="Aucune donnée disponible pour cette période." />;
  }

  return (
    <div className="relative w-full">
      <svg
        aria-label={ariaLabel}
        className="h-auto w-full touch-none select-none"
        onMouseLeave={() => setActiveIndex(series.length - 1)}
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const relativeX =
            ((event.clientX - bounds.left) / bounds.width) * CHART.width;
          const ratio = Math.min(
            Math.max((relativeX - chart.plotLeft) / chart.plotWidth, 0),
            1
          );
          setActiveIndex(
            Math.round(ratio * Math.max(series.length - 1, 0))
          );
        }}
        role="img"
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2563ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {chart.yScale.ticks.map((tick) => {
          const y =
            chart.plotBottom -
            (tick / chart.yScale.max) *
              (chart.plotBottom - chart.plotTop);
          return (
            <g key={tick}>
              <line
                stroke="#e2e8f0"
                strokeDasharray="4 6"
                x1={chart.plotLeft}
                x2={CHART.width - CHART.paddingRight}
                y1={y}
                y2={y}
              />
              <text
                fill="#94a3b8"
                fontSize="11"
                textAnchor="end"
                x={chart.plotLeft - 10}
                y={y + 4}
              >
                {valueFormatter(tick)}
              </text>
            </g>
          );
        })}
        <path d={chart.areaPath} fill={`url(#${gradientId})`} />
        <path
          d={chart.linePath}
          fill="none"
          stroke="#2563ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        {chart.points.map((point, index) =>
          index % Math.max(Math.floor(series.length / 6), 1) === 0 ||
          index === series.length - 1 ? (
            <text
              fill="#94a3b8"
              fontSize="11"
              key={point.dateKey}
              textAnchor="middle"
              x={point.x}
              y={CHART.height - 10}
            >
              {point.label}
            </text>
          ) : null
        )}
        {activePoint ? (
          <>
            <line
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={chart.plotTop}
              y2={chart.plotBottom}
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              fill="#2563ff"
              r="5"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        ) : null}
      </svg>
      {activePoint ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          style={{
            left: `${(activePoint.x / CHART.width) * 100}%`,
            top: `${(activePoint.y / CHART.height) * 100}%`,
            transform: "translate(-50%, calc(-100% - 14px))"
          }}
        >
          <p className="text-xs text-[#64748b]">{activePoint.fullLabel}</p>
          <p className="mt-0.5 text-sm font-black text-[#07142f]">
            {valueFormatter(activePoint.value)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function GroupedBarChart({ series }: { series: InsightsDualSeriesPoint[] }) {
  if (series.length === 0) {
    return <EmptyChartState message="Aucun SMS ou aucune réponse sur cette période." />;
  }

  const maxValue = Math.max(
    ...series.flatMap((point) => [point.smsSent, point.responses]),
    0
  );

  if (maxValue === 0) {
    return <EmptyChartState message="Aucun SMS ou aucune réponse sur cette période." />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold text-[#475569]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#93c5fd]" />
          SMS envoyés
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563ff]" />
          Réponses
        </span>
      </div>
      <div
        aria-label="Graphique SMS envoyés vs réponses"
        className="flex h-52 items-end gap-2 overflow-x-auto pb-2"
        role="img"
      >
        {series.map((point) => {
          const smsHeight = Math.max(8, (point.smsSent / maxValue) * 160);
          const responseHeight = Math.max(8, (point.responses / maxValue) * 160);

          return (
            <div
              className="flex min-w-8 flex-1 flex-col items-center gap-2"
              key={point.dateKey}
              title={`${point.fullLabel} — SMS: ${point.smsSent}, Réponses: ${point.responses}`}
            >
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div
                  className="w-[42%] rounded-t-md bg-[#bfdbfe]"
                  style={{ height: point.smsSent > 0 ? smsHeight : 4 }}
                />
                <div
                  className="w-[42%] rounded-t-md bg-[#2563ff]"
                  style={{ height: point.responses > 0 ? responseHeight : 4 }}
                />
              </div>
              <span className="truncate text-[0.62rem] font-bold text-[#64748b]">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FunnelChart({
  steps,
  globalConversionRate
}: {
  steps: InsightsFunnelStep[];
  globalConversionRate: number;
}) {
  if (steps.length === 0 || steps[0]?.count === 0) {
    return <EmptyChartState message="Aucune annulation enregistrée pour cette période." />;
  }

  const maxCount = Math.max(...steps.map((step) => step.count), 1);

  return (
    <div className="grid gap-3">
      {steps.map((step, index) => {
        const width = `${Math.max(28, (step.count / maxCount) * 100)}%`;

        return (
          <div className="grid gap-1" key={step.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[#07142f]">{step.label}</span>
              <span className="font-black text-[#07142f]">{step.count}</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-8 rounded-r-full bg-[#bfdbfe]"
                style={{ width }}
              />
              {step.rateLabel ? (
                <span className="text-xs font-bold text-[#64748b]">
                  {step.rateLabel}
                </span>
              ) : null}
            </div>
            {index < steps.length - 1 ? (
              <div className="ml-2 h-3 border-l border-dashed border-[#cbd5e1]" />
            ) : null}
          </div>
        );
      })}
      <p className="pt-2 text-sm font-bold text-[#2563ff]">
        Taux global de conversion{" "}
        {globalConversionRate.toLocaleString("fr-CA", {
          maximumFractionDigits: 1
        })}
        %
      </p>
    </div>
  );
}

function ResponseDonutChart({
  rate,
  responses,
  noResponse,
  trend
}: {
  rate: number;
  responses: number;
  noResponse: number;
  trend: InsightsTrend;
}) {
  const total = Math.max(responses + noResponse, 1);
  const responsePct = (responses / total) * 100;
  const gradient = `conic-gradient(#2563ff 0 ${responsePct}%, #e2e8f0 ${responsePct}% 100%)`;

  return (
    <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center">
      <div
        className="relative grid h-40 w-40 shrink-0 place-items-center rounded-full"
        style={{ background: gradient }}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-inner">
          <span className="text-2xl font-black text-[#07142f]">
            {rate.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} %
          </span>
          <TrendBadge trend={trend} />
        </div>
      </div>
      <div className="grid min-w-0 flex-1 gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563ff]" />
            <span className="text-sm font-medium text-[#475569]">Réponses</span>
          </div>
          <span className="text-sm font-bold text-[#07142f]">
            {responses} ({responsePct.toLocaleString("fr-CA", { maximumFractionDigits: 1 })} %)
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
            <span className="text-sm font-medium text-[#475569]">Sans réponse</span>
          </div>
          <span className="text-sm font-bold text-[#07142f]">
            {noResponse} ({(100 - responsePct).toLocaleString("fr-CA", { maximumFractionDigits: 1 })} %)
          </span>
        </div>
      </div>
    </div>
  );
}

function ServicesTable({ services }: { services: InsightsServiceRow[] }) {
  if (services.length === 0) {
    return (
      <EmptyChartState message="Aucun service disponible pour cette période." />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#e2e8f0] text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
            <th className="px-2 py-3">Service</th>
            <th className="px-2 py-3">Annulations</th>
            <th className="px-2 py-3">Taux de réponse</th>
            <th className="px-2 py-3">Rendez-vous récupérés</th>
            <th className="px-2 py-3">Revenus récupérés</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr className="border-b border-[#f1f5f9]" key={service.serviceId}>
              <td className="px-2 py-3 font-semibold text-[#07142f]">
                {service.serviceName}
              </td>
              <td className="px-2 py-3 text-[#475569]">{service.cancellations}</td>
              <td className="px-2 py-3 text-[#475569]">
                {service.responseRate.toLocaleString("fr-CA", {
                  maximumFractionDigits: 1
                })}{" "}
                %
              </td>
              <td className="px-2 py-3 text-[#475569]">
                {service.recoveredAppointments}
              </td>
              <td className="px-2 py-3 font-semibold text-[#07142f]">
                {formatCurrency(service.recoveredRevenueCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link
        className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#2563ff] hover:underline"
        href="/dashboard/services"
      >
        Voir tous les services
        <span aria-hidden="true">›</span>
      </Link>
    </div>
  );
}

export function InsightsChartsSection({
  filters,
  recoveredRevenueSeries,
  recoveredRevenueTotalCents,
  recoveredRevenueTrend,
  smsVsResponsesSeries,
  funnel,
  responseRateDonut,
  waitlistGrowthSeries,
  waitlistTotal,
  waitlistTrend,
  topServices
}: {
  filters: InsightsFilters;
  recoveredRevenueSeries: InsightsSeriesPoint[];
  recoveredRevenueTotalCents: number;
  recoveredRevenueTrend: InsightsTrend;
  smsVsResponsesSeries: InsightsDualSeriesPoint[];
  funnel: {
    steps: InsightsFunnelStep[];
    globalConversionRate: number;
  };
  responseRateDonut: {
    rate: number;
    responses: number;
    noResponse: number;
    trend: InsightsTrend;
  };
  waitlistGrowthSeries: InsightsSeriesPoint[];
  waitlistTotal: number;
  waitlistTrend: InsightsTrend;
  topServices: InsightsServiceRow[];
}) {
  const granularityOptions = [
    { value: "daily", label: "Quotidien" },
    { value: "weekly", label: "Hebdomadaire" },
    { value: "monthly", label: "Mensuel" }
  ] as const;

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <ChartCard
        headerRight={
          <label className="grid gap-1">
            <span className="sr-only">Granularité</span>
            <select
              aria-label="Granularité du graphique des revenus"
              className="min-h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-xs font-semibold text-[#475569]"
              defaultValue={filters.granularity}
              onChange={(event) => {
                window.location.href = buildInsightsHref(filters, {
                  granularity: event.target.value as InsightsFilters["granularity"]
                });
              }}
            >
              {granularityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        }
        subtitle={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-black text-[#07142f]">
              {formatCurrency(recoveredRevenueTotalCents)}
            </span>
            <TrendBadge trend={recoveredRevenueTrend} />
          </div>
        }
        title="Revenus récupérés"
      >
        <AreaSeriesChart
          ariaLabel="Graphique des revenus récupérés"
          gradientId="insights-revenue-area"
          series={recoveredRevenueSeries}
          valueFormatter={(value) => formatCurrency(value)}
        />
      </ChartCard>

      <ChartCard title="SMS envoyés vs réponses">
        <GroupedBarChart series={smsVsResponsesSeries} />
      </ChartCard>

      <ChartCard title="Performance du processus">
        <FunnelChart
          globalConversionRate={funnel.globalConversionRate}
          steps={funnel.steps}
        />
      </ChartCard>

      <ChartCard title="Taux de réponse">
        <ResponseDonutChart
          noResponse={responseRateDonut.noResponse}
          rate={responseRateDonut.rate}
          responses={responseRateDonut.responses}
          trend={responseRateDonut.trend}
        />
      </ChartCard>

      <ChartCard
        subtitle={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-black text-[#07142f]">
              {formatNumber(waitlistTotal)}
            </span>
            <TrendBadge trend={waitlistTrend} />
          </div>
        }
        title="Croissance de la liste d'attente"
      >
        <AreaSeriesChart
          ariaLabel="Graphique de croissance de la liste d'attente"
          gradientId="insights-waitlist-area"
          series={waitlistGrowthSeries}
          valueFormatter={(value) => formatNumber(value)}
        />
      </ChartCard>

      <ChartCard title="Services les plus performants">
        <ServicesTable services={topServices} />
      </ChartCard>
    </section>
  );
}
