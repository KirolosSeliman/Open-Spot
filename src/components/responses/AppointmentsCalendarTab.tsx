import { Panel } from "@/components/dashboard/dashboard-ui";
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
    <Panel>
      <CalendarToolbar
        anchor={anchor}
        interval={interval}
        locale={locale}
        rangeEnd={rangeEnd}
        rangeStart={rangeStart}
      />
      <AppointmentCalendar interval={interval} items={items} locale={locale} />
    </Panel>
  );
}
