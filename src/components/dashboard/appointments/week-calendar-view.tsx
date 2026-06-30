"use client";

import { TimedAppointmentCard } from "@/components/dashboard/appointments/appointment-event-card";
import {
  groupAppointmentsByDateKey,
  isTodayDateKey,
  type CalendarAppointment
} from "@/components/dashboard/appointments/types";
import {
  CALENDAR_HOUR_HEIGHT,
  getAppointmentDurationMinutes,
  getAppointmentTopAndHeight,
  getVisibleHourRange,
  getWeekDays,
  layoutOverlappingEvents
} from "@/lib/appointments/calendar";
import { formatDayHeader, formatHourLabel } from "@/lib/appointments/date-format";
import type { Locale } from "@/lib/i18n/types";

export function WeekCalendarView({
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
  const days = getWeekDays(dateKey, timezone);
  const grouped = groupAppointmentsByDateKey(appointments, timezone);
  const { start: hourStart, end: hourEnd } = getVisibleHourRange(
    appointments,
    timezone
  );
  const hours = Array.from(
    { length: hourEnd - hourStart + 1 },
    (_, index) => hourStart + index
  );
  const gridHeight = hours.length * CALENDAR_HOUR_HEIGHT;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[920px]">
        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-[#e3eaf5]">
          <div />
          {days.map((day) => {
            const isToday = isTodayDateKey(day.dateKey, timezone);
            return (
              <div className="border-l border-[#e3eaf5] px-2 py-3 text-center" key={day.dateKey}>
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
                  {formatDayHeader({
                    parts: day.parts,
                    locale,
                    timezone,
                    dateKey: day.dateKey
                  })}
                </p>
                <div className="mt-2 flex justify-center">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isToday ? "bg-[#2563eb] text-white" : "text-[#0b1328]"
                    }`}
                  >
                    {day.parts.day}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
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

          {days.map((day) => {
            const dayAppointments = grouped.get(day.dateKey) ?? [];
            const layouts = layoutOverlappingEvents(dayAppointments);

            return (
              <div
                className="relative border-l border-[#e3eaf5]"
                key={day.dateKey}
                style={{ height: gridHeight }}
              >
                {hours.map((_, index) => (
                  <div
                    className="absolute left-0 right-0 border-t border-[#e3eaf5]"
                    key={index}
                    style={{ top: index * CALENDAR_HOUR_HEIGHT }}
                  />
                ))}
                {dayAppointments.map((appointment) => {
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
                  const width = `calc((100% - 8px) / ${layout.columnCount})`;
                  const left = `calc(4px + ((100% - 8px) / ${layout.columnCount}) * ${layout.column})`;

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
            );
          })}
        </div>
      </div>
    </div>
  );
}
