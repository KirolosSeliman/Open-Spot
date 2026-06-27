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
    <article className="rounded-[20px] border border-[#dde5f0] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-7">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
        {icon}
      </div>
      <p className="mt-5 text-sm font-medium text-[#64748b]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#07142f]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm leading-6 text-[#64748b]">{detail}</p>
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
    <section className="relative overflow-hidden rounded-[20px] border border-[#dbeafe] bg-gradient-to-r from-[#f5f9ff] via-[#f8fbff] to-white p-6 shadow-[0_8px_30px_rgba(37,99,255,0.08)] sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 opacity-80 sm:block"
      >
        <svg className="h-full w-full" fill="none" preserveAspectRatio="none" viewBox="0 0 400 140">
          <path
            d="M40 110C120 70 180 120 260 90C320 68 360 96 400 84"
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <path
            d="M20 96C100 56 180 104 260 72C320 52 360 88 400 76"
            stroke="#dbeafe"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] border border-[#dbeafe] bg-white text-[#2563ff] shadow-[0_8px_24px_rgba(37,99,255,0.12)]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#64748b]">{label}</p>
          <p className="mt-1 break-words text-4xl font-black tracking-tight text-[#2563ff] sm:text-[2.65rem]">
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
    <section className="rounded-[20px] border border-[#dde5f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-black text-[#07142f]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#475569]">
            <SubscriptionCalendarIcon className="h-3.5 w-3.5 text-[#2563ff]" />
            {monthLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-bold text-[#2563ff]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#2563ff]" />
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="divide-y divide-[#e8eef5] rounded-[16px] border border-[#e8eef5]">
        {rows.map((row) => (
          <div
            className={cn(
              "flex items-center justify-between gap-4 px-4 py-4 sm:px-5",
              row.emphasis && "bg-[#f5f9ff]"
            )}
            key={row.label}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  row.emphasis
                    ? "bg-[#eef4ff] text-[#2563ff]"
                    : "bg-[#f8fafc] text-[#64748b]"
                )}
              >
                {row.icon}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  row.emphasis ? "text-[#2563ff]" : "text-[#07142f]"
                )}
              >
                {row.label}
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 text-sm font-black sm:text-base",
                row.emphasis ? "text-[#2563ff]" : "text-[#07142f]"
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
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
          {icon}
        </span>
        <div className="space-y-1 text-sm leading-6 text-[#50617d]">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </aside>
  );
}
