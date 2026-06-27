import Link from "next/link";

import {
  SubscriptionCalendarIcon,
  SubscriptionChevronIcon
} from "@/components/subscription/subscription-icons";
import type {
  SubscriptionMonthOption,
  SubscriptionYearOption
} from "@/lib/billing/subscription-months";
import { cn } from "@/lib/utils/cn";

function buildMonthHref(key: string) {
  return `/dashboard/billing?month=${key}`;
}

function SubscriptionYearSelector({
  label,
  years
}: {
  label: string;
  years: SubscriptionYearOption[];
}) {
  return (
    <div className="mt-5 border-t border-[#e8eef5] pt-4">
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
        {label}
      </label>
      <div className="grid gap-1.5">
        {years.map((yearOption) => (
          <Link
            aria-current={yearOption.isActive ? "true" : undefined}
            className={cn(
              "flex min-h-10 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
              yearOption.isActive
                ? "bg-[#eef4ff] text-[#2563ff]"
                : "text-[#334155] hover:bg-white"
            )}
            href={yearOption.href}
            key={yearOption.year}
          >
            <span>{yearOption.year}</span>
            {yearOption.isActive ? (
              <SubscriptionChevronIcon className="h-4 w-4" />
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SubscriptionMonthSelector({
  title,
  yearLabel,
  months,
  years
}: {
  title: string;
  yearLabel: string;
  months: SubscriptionMonthOption[];
  years: SubscriptionYearOption[];
}) {
  return (
    <aside className="rounded-[20px] border border-[#e8eef5] bg-[#fbfbfd] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-[#07142f]">{title}</h2>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
          <SubscriptionCalendarIcon className="h-4 w-4" />
        </span>
      </div>

      <nav aria-label={title} className="grid gap-1.5">
        {months.map((month) => {
          const label = month.isActive ? month.labelWithYear : month.label;

          if (month.isFuture) {
            return (
              <span
                aria-disabled="true"
                className="flex min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold text-[#94a3b8]"
                key={month.key}
              >
                {label}
              </span>
            );
          }

          return (
            <Link
              aria-current={month.isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
                month.isActive
                  ? "bg-[#2563ff] text-white shadow-[0_8px_20px_rgba(37,99,255,0.22)]"
                  : "text-[#334155] hover:bg-[#f8fafc]"
              )}
              href={buildMonthHref(month.key)}
              key={month.key}
            >
              <span>{label}</span>
              {month.isActive ? (
                <SubscriptionChevronIcon className="h-4 w-4" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <SubscriptionYearSelector label={yearLabel} years={years} />
    </aside>
  );
}

export function SubscriptionMonthSelectorMobile({
  title,
  yearLabel,
  months,
  years
}: {
  title: string;
  yearLabel: string;
  months: SubscriptionMonthOption[];
  years: SubscriptionYearOption[];
}) {
  const selectableMonths = months.filter((month) => !month.isFuture);

  return (
    <div className="rounded-[20px] border border-[#e8eef5] bg-[#fbfbfd] p-4 xl:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#07142f]">{title}</h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
          <SubscriptionCalendarIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {selectableMonths.map((month) => {
          const label = month.isActive ? month.labelWithYear : month.label;

          return (
            <Link
              aria-current={month.isActive ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
                month.isActive
                  ? "bg-[#2563ff] text-white shadow-[0_8px_20px_rgba(37,99,255,0.22)]"
                  : "border border-[#e2e8f0] bg-[#f8fafc] text-[#475569]"
              )}
              href={buildMonthHref(month.key)}
              key={month.key}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 border-t border-[#e8eef5] pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          {yearLabel}
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {years.map((yearOption) => (
            <Link
              aria-current={yearOption.isActive ? "true" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
                yearOption.isActive
                  ? "bg-[#eef4ff] text-[#2563ff]"
                  : "border border-[#e2e8f0] bg-white text-[#475569]"
              )}
              href={yearOption.href}
              key={yearOption.year}
            >
              {yearOption.year}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
