import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function DashboardPageHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="rounded-[2rem] border border-[var(--line)] bg-white/82 p-5 shadow-[var(--card-shadow)] sm:p-6"
      data-dashboard-surface="hero"
    >
      <div className="flex flex-col gap-4 max-md:gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Open Spot
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)] sm:text-base">
            {description}
          </p>
        </div>
        {action ? (
          <div className="w-full min-w-0 shrink max-md:[&>*]:w-full sm:shrink-0 sm:w-auto">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[1.6rem] border border-[var(--line)] bg-white/90 p-5 shadow-[var(--card-shadow)]",
        className
      )}
      data-dashboard-surface="panel"
    >
      {title || description ? (
        <div className="mb-4">
          {title ? (
            <h2 className="text-lg font-black text-[var(--foreground)]">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "green" | "amber" | "violet";
}) {
  const tones = {
    neutral: "from-white to-slate-50",
    green: "from-white to-emerald-50",
    amber: "from-white to-amber-50",
    violet: "from-white to-blue-50"
  };

  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-[var(--line)] bg-gradient-to-br p-5 shadow-sm",
        tones[tone]
      )}
      data-dashboard-metric={tone}
    >
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700"
      data-dashboard-badge
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-slate-50 p-6 text-center"
      data-dashboard-empty
    >
      <div
        className="mx-auto mb-4 h-10 w-10 rounded-2xl bg-[var(--primary-soft)]"
        data-dashboard-empty-mark
      />
      <h3 className="font-black text-[var(--foreground)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}

export function MobileCardTable({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-3", className)}>{children}</div>;
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="max-w-full min-w-0 overflow-x-auto rounded-[1.5rem] border border-[var(--line)] bg-white [-webkit-overflow-scrolling:touch]"
      data-dashboard-table
    >
      <table className="min-w-full divide-y divide-[var(--line)] text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export const tableHeadClass =
  "bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]";

export const tableCellClass = "px-4 py-4 align-top text-[var(--foreground)]";
