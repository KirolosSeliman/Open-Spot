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
      <p className="mb-2.5 text-sm font-black text-[#07142f]">{label}</p>
      <div className="grid gap-1">
        {years.map((yearOption) => (
          <Link
            aria-current={yearOption.isActive ? "true" : undefined}
            className={cn(
              "flex min-h-10 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]",
              yearOption.isActive
                ? "bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
                : "text-[#475569] hover:bg-[#f8fafc]"
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
    <aside className="rounded-[18px] border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-[#07142f]">{title}</h2>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2563eb]">
          <SubscriptionCalendarIcon className="h-4 w-4" />
        </span>
      </div>

      <nav aria-label={title} className="grid gap-1">
        {months.map((month) => {
          const label = month.isActive ? month.labelWithYear : month.label;

          if (month.isFuture) {
            return (
              <span
                aria-disabled="true"
                className="flex min-h-10 items-center rounded-xl px-3.5 text-sm font-semibold text-[#94a3b8]"
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
                "flex min-h-10 items-center justify-between rounded-xl px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]",
                month.isActive
                  ? "bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
                  : "text-[#475569] hover:bg-[#f8fafc]"
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
    <div className="rounded-[18px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] xl:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#07142f]">{title}</h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2563eb]">
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
                "inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]",
                month.isActive
                  ? "bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
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
        <p className="mb-2 text-sm font-black text-[#07142f]">{yearLabel}</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {years.map((yearOption) => (
            <Link
              aria-current={yearOption.isActive ? "true" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]",
                yearOption.isActive
                  ? "bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
                  : "border border-[#e2e8f0] bg-[#f8fafc] text-[#475569]"
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
