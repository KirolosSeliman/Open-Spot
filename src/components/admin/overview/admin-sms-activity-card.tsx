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

function bucketChartPoints(points: SmsDailyPoint[], range: SmsChartRange) {
  const targetBuckets = range === "7" ? 7 : range === "30" ? 5 : 6;

  if (points.length <= targetBuckets) {
    return points;
  }

  const bucketSize = Math.ceil(points.length / targetBuckets);
  const buckets: SmsDailyPoint[] = [];

  for (let index = 0; index < points.length; index += bucketSize) {
    const slice = points.slice(index, index + bucketSize);
    const first = slice[0];
    const last = slice[slice.length - 1];

    if (!first) {
      continue;
    }

    buckets.push({
      date: first.date,
      label: last && last.date !== first.date ? `${first.label}` : first.label,
      count: slice.reduce((total, point) => total + point.count, 0)
    });
  }

  return buckets;
}

export function AdminSmsActivityCard({
  range,
  points,
  maxCount,
  topPage,
  className
}: {
  range: SmsChartRange;
  points: SmsDailyPoint[];
  maxCount: number;
  topPage?: number;
  className?: string;
}) {
  const chartPoints = bucketChartPoints(points, range);
  const chartMax = Math.max(...chartPoints.map((point) => point.count), maxCount, 1);
  const yAxis = buildYAxis(chartMax);
  const chartTop = yAxis[0] ?? 1;

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
          {rangeOptions.map((option) => {
            const params = new URLSearchParams();
            params.set("smsRange", option.param);

            if (topPage && topPage > 1) {
              params.set("topPage", String(topPage));
            }

            return (
              <Link
                aria-current={range === option.key ? "true" : undefined}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                  range === option.key
                    ? "bg-white text-[#2563ff] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                    : "text-[#657492] hover:text-[#2563ff]"
                )}
                href={`/admin?${params.toString()}`}
                key={option.key}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div
        aria-label="Graphique des SMS envoyés par jour"
        className="mt-6 grid grid-cols-[44px_1fr] gap-4"
        role="img"
      >
        <div className="flex h-[248px] flex-col justify-between py-2 text-[11px] font-medium text-[#94a3b8]">
          {yAxis.map((value) => (
            <span key={value}>{formatAxisValue(value)}</span>
          ))}
        </div>

        <div className="relative h-[248px] rounded-[18px] border border-[#edf2f9] bg-[linear-gradient(to_top,rgba(226,232,240,0.45)_1px,transparent_1px)] bg-size-[100%_25%] px-3 pb-10 pt-3">
          {chartPoints.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[#657492]">
              Aucune activité SMS sur cette période
            </div>
          ) : (
            <div className="grid h-full items-end gap-3" style={{ gridTemplateColumns: `repeat(${chartPoints.length}, minmax(0, 1fr))` }}>
              {chartPoints.map((point) => {
                const height = chartTop <= 0 ? 0 : (point.count / chartTop) * 100;

                return (
                  <div className="flex min-w-0 flex-col items-center gap-3" key={point.date}>
                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        className="w-full max-w-[42px] rounded-t-[10px] bg-[#2563ff]"
                        style={{ height: `${Math.max(height, point.count > 0 ? 6 : 0)}%` }}
                        title={`${point.label}: ${point.count}`}
                      />
                    </div>
                    <span className="truncate text-[11px] font-medium text-[#94a3b8]">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminOverviewPanel>
  );
}
