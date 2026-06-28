import type { ReactNode } from "react";

import {
  BuildingCheckIcon,
  BuildingIcon,
  CheckCircleIcon,
  DollarIcon,
  MessageIcon
} from "@/components/admin/companies/admin-companies-icons";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";
import type { AdminCompaniesPageData } from "@/lib/admin/companies-data";
import { cn } from "@/lib/utils/cn";

const numberFormatter = new Intl.NumberFormat("en-CA");

function formatTrendLabel(
  changePct: number | null,
  invertColor = false
): { label: string; isPositive: boolean } {
  if (changePct === null || !Number.isFinite(changePct)) {
    return { label: "0% vs last 30 days", isPositive: true };
  }

  if (changePct === 0) {
    return { label: "0% vs last 30 days", isPositive: true };
  }

  const arrow = changePct > 0 ? "↑" : "↓";
  const abs = Math.abs(changePct).toLocaleString("en-CA", {
    maximumFractionDigits: 1
  });
  const isPositive = invertColor ? changePct <= 0 : changePct >= 0;

  return {
    label: `${arrow} ${abs}% vs last 30 days`,
    isPositive
  };
}

function KpiCard({
  label,
  value,
  sublabel,
  trend,
  invertTrendColor,
  icon,
  iconClassName
}: {
  label: string;
  value: string;
  sublabel: string;
  trend?: { label: string; isPositive: boolean };
  invertTrendColor?: boolean;
  icon: ReactNode;
  iconClassName?: string;
}) {
  const trendColor =
    trend === undefined
      ? "text-[#64748b]"
      : invertTrendColor
        ? trend.isPositive
          ? "text-[#16a34a]"
          : "text-[#64748b]"
        : trend.isPositive
          ? "text-[#16a34a]"
          : "text-[#64748b]";

  return (
    <article className="flex min-h-[132px] flex-col rounded-[20px] border border-[#e3eaf5] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-5 text-[#64748b]">{label}</p>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-auto pt-4 text-[1.85rem] font-bold leading-none tracking-tight text-[#0b1328]">
        {value}
      </p>
      <p className={cn("mt-2.5 text-[13px] leading-5", trend ? trendColor : "text-[#64748b]")}>
        {trend ? trend.label : sublabel}
      </p>
    </article>
  );
}

export function AdminCompaniesKpiCards({
  kpis
}: {
  kpis: AdminCompaniesPageData["kpis"];
}) {
  const smsTrend = formatTrendLabel(kpis.smsSentChangePct);
  const filledTrend = formatTrendLabel(kpis.filledSpotsChangePct);
  const costTrend = formatTrendLabel(kpis.estimatedSmsCostChangePct, true);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        icon={<BuildingIcon className="h-5 w-5 text-[#2563ff]" />}
        iconClassName="bg-[#eef5ff]"
        label="Total companies"
        sublabel="Active and archived"
        value={numberFormatter.format(kpis.totalCompanies)}
      />
      <KpiCard
        icon={<BuildingCheckIcon className="h-5 w-5 text-[#16a34a]" />}
        iconClassName="bg-[#ecfdf5]"
        label="Active companies"
        sublabel={`${kpis.activeCompaniesPercentage.toLocaleString("en-CA", {
          maximumFractionDigits: 1
        })}% of total`}
        value={numberFormatter.format(kpis.activeCompanies)}
      />
      <KpiCard
        icon={<MessageIcon className="h-5 w-5 text-[#2563ff]" />}
        iconClassName="bg-[#eef5ff]"
        label="SMS sent (30d)"
        sublabel=""
        trend={smsTrend}
        value={numberFormatter.format(kpis.smsSent30d)}
      />
      <KpiCard
        icon={<CheckCircleIcon className="h-5 w-5 text-[#16a34a]" />}
        iconClassName="bg-[#ecfdf5]"
        label="Filled spots (30d)"
        sublabel=""
        trend={filledTrend}
        value={numberFormatter.format(kpis.filledSpots30d)}
      />
      <KpiCard
        icon={<DollarIcon className="h-5 w-5 text-[#7c3aed]" />}
        iconClassName="bg-[#f3efff]"
        invertTrendColor
        label="Est. SMS cost (30d)"
        sublabel=""
        trend={costTrend}
        value={formatEstimatedSmsCost(kpis.estimatedSmsCost30dCents)}
      />
    </div>
  );
}
