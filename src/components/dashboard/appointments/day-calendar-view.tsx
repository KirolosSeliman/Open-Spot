"use client";

import { TimedAppointmentCard } from "@/components/dashboard/appointments/appointment-event-card";
import type { CalendarAppointment } from "@/components/dashboard/appointments/types";
import {
  CALENDAR_HOUR_HEIGHT,
  getAppointmentDurationMinutes,
  getAppointmentTopAndHeight,
  getVisibleHourRange,
  layoutOverlappingEvents
} from "@/lib/appointments/calendar";
import { formatDaySubheader, formatHourLabel } from "@/lib/appointments/date-format";
import type { Locale } from "@/lib/i18n/types";

export function DayCalendarView({
  appointments,
  dateKey,
  locale,
  timezone,
  onSelectAppointment
}: {
  appointments: CalendarAppointment[];
  dateKey: string;
  locale: Locale;
  timezone: string;
  onSelectAppointment?: (appointment: CalendarAppointment) => void;
}) {
  const { start: hourStart, end: hourEnd } = getVisibleHourRange(
    appointments,
    timezone
  );
  const hours = Array.from(
    { length: hourEnd - hourStart + 1 },
    (_, index) => hourStart + index
  );
  const gridHeight = hours.length * CALENDAR_HOUR_HEIGHT;
  const layouts = layoutOverlappingEvents(appointments, timezone);

  return (
    <div>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#64748b]">
        {formatDaySubheader(dateKey, locale, timezone)}
      </p>
      <div className="grid grid-cols-[72px_minmax(0,1fr)]">
        <div className="relative" style={{ height: gridHeight }}>
          {hours.map((hour, index) => (
            <div
              className="absolute left-0 right-0 border-t border-[#e3eaf5] pr-2 text-right text-xs font-medium text-[#64748b]"
              key={hour}
              style={{ top: index * CALENDAR_HOUR_HEIGHT, height: CALENDAR_HOUR_HEIGHT }}
            >
              <span className="-mt-2 inline-block bg-white px-1">
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>
        <div className="relative" style={{ height: gridHeight }}>
          {hours.map((_, index) => (
            <div
              className="absolute left-0 right-0 border-t border-[#e3eaf5]"
              key={index}
              style={{ top: index * CALENDAR_HOUR_HEIGHT }}
            />
          ))}
          {appointments.map((appointment) => {
            const duration = getAppointmentDurationMinutes(appointment);
            const placement = getAppointmentTopAndHeight(
              appointment.starts_at,
              duration,
              hourStart,
              hourEnd,
              CALENDAR_HOUR_HEIGHT,
              timezone
            );
            const layout = layouts.get(appointment.id) ?? {
              column: 0,
              columnCount: 1
            };
            const width = `calc((100% - 16px) / ${layout.columnCount})`;
            const left = `calc(8px + ((100% - 16px) / ${layout.columnCount}) * ${layout.column})`;

            return (
              <TimedAppointmentCard
                appointment={appointment}
                key={appointment.id}
                locale={locale}
                onSelect={onSelectAppointment}
                style={{
                  top: placement.top,
                  height: placement.height,
                  left,
                  width
                }}
                timezone={timezone}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
