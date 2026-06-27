import Link from "next/link";

import {
  formatCalendarAnchorKey,
  formatCalendarRangeLabel,
  shiftCalendarAnchor
} from "@/lib/responses/calendar-utils";
import type { CalendarInterval } from "@/lib/responses/types";
import { intlLocale } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

const intervalOptions: Array<{ label: string; value: CalendarInterval }> = [
  { label: "1 jour", value: "1d" },
  { label: "2 jours", value: "2d" },
  { label: "1 semaine", value: "1w" },
  { label: "1 mois", value: "1m" }
];

function buildCalendarHref(anchor: Date, interval: CalendarInterval) {
  const params = new URLSearchParams({
    tab: "appointments",
    calInterval: interval,
    calDate: formatCalendarAnchorKey(anchor)
  });

  return `/dashboard/responses?${params.toString()}`;
}

export function CalendarToolbar({
  anchor,
  interval,
  rangeStart,
  rangeEnd,
  locale
}: {
  anchor: Date;
  interval: CalendarInterval;
  rangeStart: Date;
  rangeEnd: Date;
  locale: Locale;
}) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const previousAnchor = shiftCalendarAnchor(anchor, interval, -1);
  const nextAnchor = shiftCalendarAnchor(anchor, interval, 1);
  const rangeLabel = formatCalendarRangeLabel(
    rangeStart,
    rangeEnd,
    intlLocale(locale)
  );

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div>
        <h2 className="text-lg font-black">Calendrier des rendez-vous</h2>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">
          Consultez les rendez-vous planifiés et suivez les SMS envoyés aux clients.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black hover:bg-slate-50"
            href={buildCalendarHref(today, interval)}
          >
            Aujourd&apos;hui
          </Link>
          <Link
            aria-label="Intervalle précédent"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black hover:bg-slate-50"
            href={buildCalendarHref(previousAnchor, interval)}
          >
            ‹
          </Link>
          <Link
            aria-label="Intervalle suivant"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black hover:bg-slate-50"
            href={buildCalendarHref(nextAnchor, interval)}
          >
            ›
          </Link>
          <span className="inline-flex min-h-10 items-center rounded-xl bg-slate-50 px-4 text-sm font-black text-[var(--foreground)]">
            {rangeLabel}
          </span>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Intervalle du calendrier"
        >
          {intervalOptions.map((option) => (
            <Link
              aria-selected={interval === option.value}
              className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-black ${
                interval === option.value
                  ? "bg-[var(--primary)] text-white shadow-[0_8px_18px_rgba(79,125,243,0.22)]"
                  : "border border-slate-200 bg-white text-[var(--foreground)] hover:bg-slate-50"
              }`}
              href={buildCalendarHref(anchor, option.value)}
              key={option.value}
              role="tab"
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
