import type { ReactNode } from "react";

import type { AdminKpiMetric } from "@/lib/admin/overview-data";
import { cn } from "@/lib/utils/cn";

export function AdminKpiCard({
  metric,
  icon,
  iconClassName
}: {
  metric: AdminKpiMetric;
  icon: ReactNode;
  iconClassName?: string;
}) {
  const trendColor = metric.invertTrendColor
    ? metric.changeIsPositive
      ? "text-[#16a34a]"
      : "text-[#ef4444]"
    : metric.changeIsPositive
      ? "text-[#16a34a]"
      : "text-[#ef4444]";

  return (
    <article className="rounded-[20px] border border-[#e1e9f5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#657492]">{metric.label}</p>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563ff]",
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-[#0b1328]">
        {metric.formattedValue}
      </p>
      <p className={cn("mt-3 text-sm font-semibold", trendColor)}>
        {metric.changeLabel}{" "}
        <span className="font-medium text-[#657492]">vs 30 derniers jours</span>
      </p>
    </article>
  );
}
