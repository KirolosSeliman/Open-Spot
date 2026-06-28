import type { ReactNode } from "react";

import { Sparkline, type SparklineTone } from "@/components/dashboard/home/charts";
import type { MetricTrend } from "@/lib/dashboard/dashboard-home-data";
import type { PeriodChange } from "@/lib/dashboard/date-range";
import { cn } from "@/lib/utils/cn";

const iconTones = {
  blue: "bg-[#eff6ff] text-[#2563ff]",
  green: "bg-[#ecfdf3] text-[#16a34a]",
  orange: "bg-[#fff7ed] text-[#f97316]",
  violet: "bg-[#f5f3ff] text-[#7c3aed]",
  red: "bg-[#fef2f2] text-[#ef4444]",
  amber: "bg-[#fffbeb] text-[#f59e0b]"
} as const;

const badgeTones = {
  up: "bg-[#ecfdf3] text-[#16a34a]",
  down: "bg-[#fef2f2] text-[#ef4444]",
  neutral: "bg-[#f1f5f9] text-[#64748b]"
} as const;

function TrendBadge({
  change,
  tone = "blue"
}: {
  change: PeriodChange;
  tone?: SparklineTone;
}) {
  const direction = change.direction;
  const arrow = direction === "up" ? "↗" : direction === "down" ? "↘" : "→";
  const badgeClass =
    direction === "down" && tone === "red"
      ? badgeTones.down
      : direction === "up"
        ? badgeTones.up
        : direction === "down"
          ? badgeTones.down
          : badgeTones.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        badgeClass
      )}
    >
      <span aria-hidden="true">{arrow}</span>
      {change.display}
    </span>
  );
}

export function HomeKpiCard({
  label,
  description,
  value,
  metric,
  icon,
  tone = "blue",
  formatValue
}: {
  label: string;
  description: string;
  value: string;
  metric: MetricTrend;
  icon: ReactNode;
  tone?: SparklineTone;
  formatValue?: boolean;
}) {
  const displaySeries =
    metric.series.length > 0
      ? metric.series
      : Array.from({ length: 7 }, () => 0);

  return (
    <article className="flex h-full flex-col rounded-[22px] border border-[#e2eaf5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            iconTones[tone]
          )}
        >
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm font-medium text-[#64748b]">{label}</p>
      <p className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-[#0b1328]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-[#64748b]">{description}</p>

      <div className="mt-auto pt-5">
        <Sparkline
          ariaLabel={`${label} trend`}
          data={formatValue ? displaySeries.map((v) => v / 100) : displaySeries}
          tone={tone}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TrendBadge change={metric.change} tone={tone} />
          <span className="text-xs text-[#94a3b8]">{metric.comparisonLabel}</span>
        </div>
      </div>
    </article>
  );
}

export function HomeSectionCard({
  title,
  description,
  children,
  action
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#e2eaf5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0b1328] sm:text-xl">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[#64748b]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "green" | "red" | "orange" | "blue" | "neutral";
}) {
  const tones = {
    green: "bg-[#ecfdf3] text-[#15803d]",
    red: "bg-[#fef2f2] text-[#dc2626]",
    orange: "bg-[#fff7ed] text-[#ea580c]",
    blue: "bg-[#eff6ff] text-[#2563eb]",
    neutral: "bg-[#f1f5f9] text-[#64748b]"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function EmptyBlock({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#e2eaf5] bg-[#f8fbff] px-6 py-10 text-center">
      <p className="font-semibold text-[#0b1328]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748b]">
        {description}
      </p>
    </div>
  );
}
