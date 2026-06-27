import Link from "next/link";

import {
  buildAppointmentsHref,
  shiftCalendarDate,
  type CalendarViewMode
} from "@/lib/appointments/calendar";
import { formatCalendarPeriodTitle } from "@/lib/appointments/date-format";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function CalendarControls({
  view,
  dateKey,
  locale,
  timezone
}: {
  view: CalendarViewMode;
  dateKey: string;
  locale: Locale;
  timezone: string;
}) {
  const copy = getDashboardCopy(locale);
  const previousDate = shiftCalendarDate(dateKey, view, -1, timezone);
  const nextDate = shiftCalendarDate(dateKey, view, 1, timezone);
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  const views: CalendarViewMode[] = ["month", "week", "day"];

  return (
    <div className="flex flex-col gap-4 border-b border-[#e3eaf5] pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          aria-label="Previous"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e3eaf5] bg-white text-[#0b1328] transition hover:border-[#2563eb] hover:text-[#2563eb]"
          href={buildAppointmentsHref({ view, date: previousDate })}
        >
          <ChevronIcon direction="left" />
        </Link>
        <h2 className="min-w-[12rem] px-1 text-lg font-bold text-[#0b1328]">
          {formatCalendarPeriodTitle({ view, dateKey, locale, timezone })}
        </h2>
        <Link
          aria-label="Next"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e3eaf5] bg-white text-[#0b1328] transition hover:border-[#2563eb] hover:text-[#2563eb]"
          href={buildAppointmentsHref({ view, date: nextDate })}
        >
          <ChevronIcon direction="right" />
        </Link>
        <Link
          className="inline-flex h-10 items-center rounded-xl border border-[#e3eaf5] bg-white px-4 text-sm font-semibold text-[#0b1328] transition hover:border-[#2563eb] hover:text-[#2563eb]"
          href={buildAppointmentsHref({ view, date: todayKey })}
        >
          {copy.appointments.calendar.today}
        </Link>
      </div>

      <div className="inline-flex rounded-xl border border-[#e3eaf5] bg-white p-1">
        {views.map((item) => (
          <Link
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              view === item
                ? "bg-[#eff6ff] text-[#2563eb]"
                : "text-[#64748b] hover:text-[#0b1328]"
            }`}
            href={buildAppointmentsHref({ view: item, date: dateKey })}
            key={item}
          >
            {copy.appointments.calendar[item]}
          </Link>
        ))}
      </div>
    </div>
  );
}
