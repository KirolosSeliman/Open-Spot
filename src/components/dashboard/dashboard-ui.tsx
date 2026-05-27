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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
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
      {action ? <div className="shrink-0">{action}</div> : null}
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
        "rounded-2xl border border-[var(--line)] bg-white/86 p-5 shadow-[0_18px_45px_rgba(36,54,66,0.06)]",
        className
      )}
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
    neutral: "from-white to-[#f7faf7]",
    green: "from-white to-[#edf8f3]",
    amber: "from-white to-[#fff7e8]",
    violet: "from-white to-[#f2efff]"
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--line)] bg-gradient-to-br p-5 shadow-sm",
        tones[tone]
      )}
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
    <span className="inline-flex rounded-full border border-[#d9e6e1] bg-[#f4faf7] px-2.5 py-1 text-xs font-bold text-[var(--primary-strong)]">
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
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[#fbfaf7] p-6 text-center">
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
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table className="min-w-full divide-y divide-[var(--line)] text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export const tableHeadClass =
  "bg-[#f6f7f2] px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]";

export const tableCellClass = "px-4 py-4 align-top text-[var(--foreground)]";
