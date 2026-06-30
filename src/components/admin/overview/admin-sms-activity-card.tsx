import Link from "next/link";

import {
  AdminOverviewPanel,
  AdminOverviewSectionTitle
} from "@/components/admin/overview/admin-overview-panel";
import { InfoIcon } from "@/components/admin/overview/admin-overview-icons";
import type { SmsChartRange, SmsDailyPoint } from "@/lib/admin/overview-data";
import { cn } from "@/lib/utils/cn";

const rangeOptions: Array<{ key: SmsChartRange; label: string; param: string }> = [
  { key: "7", label: "7 j", param: "7d" },
  { key: "30", label: "30 j", param: "30d" },
  { key: "90", label: "90 j", param: "90d" }
];

const PLOT_HEIGHT = 200;
const MAX_BAR_WIDTH = 28;

function formatAxisValue(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("fr-CA", { maximumFractionDigits: 1 })}k`;
  }

  return value.toLocaleString("fr-CA");
}

function buildYAxis(maxCount: number) {
  const top = Math.max(maxCount, 4);
  const step = Math.max(Math.ceil(top / 4), 1);

  return [step * 4, step * 3, step * 2, step, 0];
}

function shouldShowLabel(index: number, total: number) {
  if (total <= 7) {
    return true;
  }

  if (total <= 31) {
    return index === 0 || index === total - 1 || index % 5 === 0;
  }

  return index === 0 || index === total - 1 || (index % 14 === 0 && total - 1 - index >= 10);
}

function getBarHeight(count: number, chartTop: number) {
  if (count <= 0 || chartTop <= 0) {
    return 0;
  }

  return Math.max(Math.round((count / chartTop) * PLOT_HEIGHT), 4);
}

function getChartGap(total: number) {
  if (total > 60) {
    return 2;
  }

  if (total > 31) {
    return 4;
  }

  return 8;
}

export function AdminSmsActivityCard({
  range,
  points,
  maxCount,
  className
}: {
  range: SmsChartRange;
  points: SmsDailyPoint[];
  maxCount: number;
  className?: string;
}) {
  const chartMax = Math.max(...points.map((point) => point.count), maxCount, 1);
  const yAxis = buildYAxis(chartMax);
  const chartTop = yAxis[0] ?? 1;
  const chartGap = getChartGap(points.length);
  const chartGridTemplateColumns = `repeat(${points.length}, minmax(0, 1fr))`;

  return (
    <AdminOverviewPanel className={className}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AdminOverviewSectionTitle>Activité des SMS</AdminOverviewSectionTitle>
          <InfoIcon className="h-4 w-4 text-[#94a3b8]" />
        </div>

        <div
          aria-label="Période du graphique SMS"
          className="inline-flex rounded-xl border border-[#e1e9f5] bg-[#f8fbff] p-1"
          role="group"
        >
          {rangeOptions.map((option) => (
            <Link
              aria-current={range === option.key ? "true" : undefined}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                range === option.key
                  ? "bg-white text-[#2563ff] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-[#657492] hover:text-[#2563ff]"
              )}
              href={`/admin?smsRange=${option.param}`}
              key={option.key}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div
        aria-label="Graphique des SMS envoyés par jour"
        className="mt-6 grid grid-cols-[44px_1fr] gap-4"
        role="img"
      >
        <div
          className="flex flex-col justify-between py-2 text-[11px] font-medium text-[#94a3b8]"
          style={{ height: PLOT_HEIGHT + 28 }}
        >
          {yAxis.map((value) => (
            <span key={value}>{formatAxisValue(value)}</span>
          ))}
        </div>

        <div className="min-w-0">
          {points.length === 0 ? (
            <div
              className="flex items-center justify-center rounded-[18px] border border-[#edf2f9] text-sm text-[#657492]"
              style={{ height: PLOT_HEIGHT + 28 }}
            >
              Aucune activité SMS sur cette période
            </div>
          ) : (
            <div className="min-w-0">
              <div
                className="relative rounded-[18px] border border-[#edf2f9] bg-[linear-gradient(to_top,rgba(226,232,240,0.45)_1px,transparent_1px)] bg-size-[100%_25%] px-3 pt-3"
                style={{ height: PLOT_HEIGHT }}
              >
                <div
                  className="grid h-full items-end"
                  style={{
                    columnGap: chartGap,
                    gridTemplateColumns: chartGridTemplateColumns
                  }}
                >
                  {points.map((point) => {
                    const barHeight = getBarHeight(point.count, chartTop);

                    return (
                      <div
                        className="flex min-w-0 flex-col items-center justify-end"
                        key={point.date}
                        title={`${point.label}: ${point.count} SMS`}
                      >
                        <div
                          className="w-full rounded-t-[10px] bg-[#2563ff]"
                          style={{ height: barHeight, maxWidth: MAX_BAR_WIDTH }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="mt-2 grid overflow-hidden px-3"
                style={{
                  columnGap: chartGap,
                  gridTemplateColumns: chartGridTemplateColumns
                }}
              >
                {points.map((point, index) => (
                  <div
                    className={cn(
                      "min-w-0 whitespace-nowrap text-[11px] font-medium leading-4 text-[#94a3b8]",
                      index === 0
                        ? "text-left"
                        : index === points.length - 1
                          ? "text-right"
                          : "text-center"
                    )}
                    key={`${point.date}-label`}
                  >
                    {shouldShowLabel(index, points.length) ? point.label : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminOverviewPanel>
  );
}
