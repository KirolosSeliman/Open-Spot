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
    <div className="rounded-[1.75rem] border border-white/80 bg-white/78 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Open Spot operations
          </p>
          <h1 className="mt-3 text-2xl font-black text-[var(--foreground)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)] sm:text-base">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
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
        "rounded-[1.5rem] border border-[#e2e8f0] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
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
    neutral: "from-white to-[#f8fafc] border-[#e2e8f0]",
    green: "from-white to-[#f0fdf4] border-[#bbf7d0]",
    amber: "from-white to-[#fffbeb] border-[#fde68a]",
    violet: "from-white to-[#eff6ff] border-[#bfdbfe]"
  };

  return (
    <div
      className={cn(
        "rounded-[1.5rem] border bg-gradient-to-br p-5 shadow-[0_16px_38px_rgba(15,23,42,0.06)]",
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
    <span className="inline-flex rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-xs font-bold text-[var(--primary)]">
      {children}
    </span>
  );
}

export function ManualValidationNotice({
  children = "Confirmation manuelle requise. Le premier OUI n'est jamais confirme automatiquement."
}: {
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm font-bold leading-6 text-[#1d4ed8]">
      {children}
    </div>
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
    <div className="rounded-[1.5rem] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center">
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
    <div className="overflow-x-auto rounded-[1.25rem] border border-[#e2e8f0] bg-white">
      <table className="min-w-full divide-y divide-[var(--line)] text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export const tableHeadClass =
  "bg-[#f8fafc] px-4 py-3 text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]";

export const tableCellClass = "px-4 py-4 align-top text-[var(--foreground)]";
