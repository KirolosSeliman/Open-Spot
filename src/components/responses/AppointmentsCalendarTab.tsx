import type { Locale } from "@/lib/i18n/types";
import type { AppointmentCalendarItem, CalendarInterval } from "@/lib/responses/types";

import { AppointmentCalendar } from "./AppointmentCalendar";
import { CalendarToolbar } from "./CalendarToolbar";

export function AppointmentsCalendarTab({
  items,
  anchor,
  interval,
  rangeStart,
  rangeEnd,
  locale
}: {
  items: AppointmentCalendarItem[];
  anchor: Date;
  interval: CalendarInterval;
  rangeStart: Date;
  rangeEnd: Date;
  locale: Locale;
}) {
  return (
    <div className="grid gap-4">
      <CalendarToolbar
        anchor={anchor}
        interval={interval}
        locale={locale}
        rangeEnd={rangeEnd}
        rangeStart={rangeStart}
      />
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
        <AppointmentCalendar interval={interval} items={items} locale={locale} />
      </div>
    </div>
  );
}
