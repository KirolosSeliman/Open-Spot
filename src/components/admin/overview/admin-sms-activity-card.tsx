import Link from "next/link";

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
    return `${Math.round(value / 1000)}k`;
  }

  return String(value);
}

function buildYAxis(maxCount: number) {
  const top = Math.max(maxCount, 4);
  const step = Math.max(Math.ceil(top / 4), 1);

  return [step * 4, step * 3, step * 2, step, 0];
}

export function AdminSmsActivityCard({
  range,
  points,
  maxCount,
  topPage
}: {
  range: SmsChartRange;
  points: SmsDailyPoint[];
  maxCount: number;
  topPage?: number;
}) {
  const yAxis = buildYAxis(maxCount);
  const chartTop = yAxis[0] ?? 1;

  return (
    <section className="rounded-[20px] border border-[#e1e9f5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#0b1328]">Activité des SMS</h2>
          <InfoIcon className="h-4 w-4 text-[#657492]" />
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
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  range === option.key
                    ? "bg-white text-[#2563ff] shadow-sm"
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
        className="mt-6 grid grid-cols-[auto_1fr] gap-3"
        role="img"
      >
        <div className="flex h-56 flex-col justify-between py-1 text-[11px] font-medium text-[#657492]">
          {yAxis.map((value) => (
            <span key={value}>{formatAxisValue(value)}</span>
          ))}
        </div>

        <div className="relative h-56 rounded-2xl border border-[#edf2f9] bg-[linear-gradient(to_top,#edf2f9_1px,transparent_1px)] bg-size-[100%_25%] px-2 pb-8 pt-2">
          {points.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[#657492]">
              Aucune activité SMS sur cette période
            </div>
          ) : (
            <div className="flex h-full items-end gap-1 sm:gap-2">
              {points.map((point) => {
                const height = chartTop <= 0 ? 0 : (point.count / chartTop) * 100;

                return (
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.date}>
                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        className="w-full max-w-8 rounded-t-lg bg-[#2563ff]"
                        style={{ height: `${Math.max(height, point.count > 0 ? 4 : 0)}%` }}
                        title={`${point.label}: ${point.count}`}
                      />
                    </div>
                    <span className="truncate text-[10px] font-medium text-[#657492] sm:text-[11px]">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
