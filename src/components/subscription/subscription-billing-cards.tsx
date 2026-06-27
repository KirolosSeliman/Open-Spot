import type { ReactNode } from "react";

import { SubscriptionCalendarIcon } from "@/components/subscription/subscription-icons";
import { cn } from "@/lib/utils/cn";

export function SubscriptionMetricCard({
  icon,
  label,
  value,
  detail
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string | null;
}) {
  return (
    <article className="rounded-[18px] border border-[#e2e8f0] bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563eb]">
          {icon}
        </div>
        <p className="text-sm font-medium leading-snug text-[#64748b]">{label}</p>
      </div>
      <p className="mt-5 text-[2rem] font-black leading-none tracking-tight text-[#07142f]">
        {value}
      </p>
      {detail ? (
        <p className="mt-3 text-sm leading-6 text-[#64748b]">{detail}</p>
      ) : null}
    </article>
  );
}

export function SubscriptionTotalCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <section className="min-h-[132px] rounded-[18px] border border-[#dbeafe] bg-gradient-to-r from-[#f0f6ff] via-[#f7faff] to-white px-6 py-5 shadow-[0_8px_30px_rgba(37,99,235,0.08)] sm:px-7 sm:py-6">
      <div className="flex h-full items-center gap-5">
        <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[16px] border border-[#dbeafe] bg-white text-[#2563eb] shadow-[0_10px_24px_rgba(37,99,235,0.12)]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#50617d]">{label}</p>
          <p className="mt-1 break-words text-[2.5rem] font-black leading-none tracking-tight text-[#2563eb] sm:text-[2.75rem]">
            {value}
          </p>
        </div>
      </div>
    </section>
  );
}

type DetailRow = {
  icon: ReactNode;
  label: string;
  value: string;
  emphasis?: boolean;
};

export function SubscriptionBillingDetails({
  title,
  monthLabel,
  statusLabel,
  rows
}: {
  title: string;
  monthLabel: string;
  statusLabel: string;
  rows: DetailRow[];
}) {
  return (
    <section className="rounded-[18px] border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-black text-[#07142f]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#475569]">
            <SubscriptionCalendarIcon className="h-3.5 w-3.5 text-[#2563eb]" />
            {monthLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-bold text-[#2563eb]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#e8eef5]">
        {rows.map((row, index) => (
          <div
            className={cn(
              "flex items-center justify-between gap-4 px-4 py-4 sm:px-5",
              index > 0 && "border-t border-[#e8eef5]",
              row.emphasis && "bg-[#f5f9ff]"
            )}
            key={row.label}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  row.emphasis
                    ? "bg-[#eef4ff] text-[#2563eb]"
                    : "bg-[#f8fafc] text-[#64748b]"
                )}
              >
                {row.icon}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  row.emphasis ? "text-[#2563eb]" : "text-[#07142f]"
                )}
              >
                {row.label}
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 text-right text-sm font-black sm:text-base",
                row.emphasis ? "text-[#2563eb]" : "text-[#07142f]"
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SubscriptionInfoBox({
  lines,
  icon
}: {
  lines: string[];
  icon: ReactNode;
}) {
  return (
    <aside className="rounded-[16px] border border-[#dbeafe] bg-[#f8fbff] p-4 sm:p-5">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563eb]">
          {icon}
        </span>
        <div className="space-y-1.5 text-sm leading-6 text-[#50617d]">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </aside>
  );
}
