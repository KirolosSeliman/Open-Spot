"use client";

import Link from "next/link";

import { MonthAppointmentChip } from "@/components/dashboard/appointments/appointment-event-card";
import {
  groupAppointmentsByDateKey,
  isTodayDateKey,
  type CalendarAppointment
} from "@/components/dashboard/appointments/types";
import {
  buildAppointmentsHref,
  getMonthGridDays
} from "@/lib/appointments/calendar";
import { getWeekdayHeaderLabels } from "@/lib/appointments/date-format";
import { parseDateKeyInTimezone } from "@/lib/appointments/timezone";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

const MAX_VISIBLE = 3;

export function MonthCalendarView({
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
  const copy = getDashboardCopy(locale);
  const days = getMonthGridDays(dateKey, timezone);
  const grouped = groupAppointmentsByDateKey(appointments, timezone);
  const weekdayLabels = getWeekdayHeaderLabels(locale);

  return (
    <div className="os-mobile-calendar-scroll max-w-full min-w-0">
      <div className="w-full min-w-0">
        <div className="grid min-w-0 grid-cols-7 border-b border-[#e3eaf5]">
          {weekdayLabels.map((label) => (
            <div
              className="min-w-0 truncate px-1 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#64748b] sm:px-2 sm:text-xs"
              key={label}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid min-w-0 grid-cols-7">
          {days.map((day) => {
            const dayAppointments = grouped.get(day.dateKey) ?? [];
            const visible = dayAppointments.slice(0, MAX_VISIBLE);
            const hiddenCount = dayAppointments.length - visible.length;
            const parts = parseDateKeyInTimezone(day.dateKey, timezone);
            const isToday = isTodayDateKey(day.dateKey, timezone);

            return (
              <div
                className="min-h-[100px] min-w-0 border-b border-r border-[#e3eaf5] p-1.5 last:border-r-0 sm:min-h-[120px] sm:p-2"
                key={day.dateKey}
              >
                <div className="mb-2 flex justify-end">
                  <Link
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isToday
                        ? "bg-[#2563eb] text-white"
                        : day.inCurrentMonth
                          ? "text-[#0b1328]"
                          : "text-[#94a3b8]"
                    }`}
                    href={buildAppointmentsHref({
                      view: "day",
                      date: day.dateKey
                    })}
                  >
                    {parts.day}
                  </Link>
                </div>
                <div className="grid gap-1.5">
                  {visible.map((appointment) => (
                    <MonthAppointmentChip
                      appointment={appointment}
                      key={appointment.id}
                      locale={locale}
                      onSelect={onSelectAppointment}
                      timezone={timezone}
                    />
                  ))}
                  {hiddenCount > 0 ? (
                    <Link
                      className="px-2 text-xs font-semibold text-[#2563eb]"
                      href={buildAppointmentsHref({
                        view: "day",
                        date: day.dateKey
                      })}
                    >
                      {copy.appointments.calendar.more(hiddenCount)}
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
