import type { ReactNode } from "react";

import { adminOverviewCardClassName } from "@/components/admin/overview/admin-overview-panel";
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
    <article className={cn(adminOverviewCardClassName, "flex min-h-[148px] flex-col p-5")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-5 text-[#657492]">{metric.label}</p>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]",
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-auto pt-5 text-[2rem] font-bold leading-none tracking-tight text-[#0b1328]">
        {metric.formattedValue}
      </p>
      <p className="mt-3 text-[13px] leading-5">
        <span className={cn("font-semibold", trendColor)}>{metric.changeLabel}</span>{" "}
        <span className="font-medium text-[#94a3b8]">vs 30 derniers jours</span>
      </p>
    </article>
  );
}
