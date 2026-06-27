"use client";

import type { CSSProperties } from "react";

import type { CalendarAppointment } from "@/components/dashboard/appointments/types";
import { formatShortTime, formatTimeRange } from "@/lib/appointments/date-format";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

export function MonthAppointmentChip({
  appointment,
  locale,
  timezone,
  onSelect
}: {
  appointment: CalendarAppointment;
  locale: Locale;
  timezone: string;
  onSelect?: (appointment: CalendarAppointment) => void;
}) {
  const copy = getDashboardCopy(locale);
  const content = (
    <>
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#2563eb]">
          {formatShortTime(appointment.starts_at, locale, timezone)}
        </p>
        <p className="truncate text-sm font-bold text-[#0b1328]">
          {appointment.customerName}
        </p>
        <p className="truncate text-xs text-[#64748b]">
          {appointment.serviceName ?? copy.common.serviceNotSpecified}
        </p>
      </div>
    </>
  );

  const className =
    "flex w-full items-start gap-2 rounded-[10px] bg-[#eff6ff] px-2 py-1.5 text-left transition hover:bg-[#dbeafe]";

  if (onSelect) {
    return (
      <button className={className} onClick={() => onSelect(appointment)} type="button">
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function TimedAppointmentCard({
  appointment,
  locale,
  timezone,
  style,
  onSelect
}: {
  appointment: CalendarAppointment;
  locale: Locale;
  timezone: string;
  style?: CSSProperties;
  onSelect?: (appointment: CalendarAppointment) => void;
}) {
  const copy = getDashboardCopy(locale);
  const content = (
    <>
      <span className="absolute left-0 top-0 h-full w-1 rounded-l-[10px] bg-[#2563eb]" />
      <div className="flex items-start gap-2 pl-2">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#2563eb]">
            {formatTimeRange(
              appointment.starts_at,
              appointment.ends_at,
              locale,
              timezone
            )}
          </p>
          <p className="truncate text-sm font-bold text-[#0b1328]">
            {appointment.customerName}
          </p>
          <p className="truncate text-xs text-[#64748b]">
            {appointment.serviceName ?? copy.common.serviceNotSpecified}
          </p>
        </div>
      </div>
    </>
  );

  const className =
    "absolute overflow-hidden rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] p-3 text-left shadow-sm transition hover:shadow-md";

  if (onSelect) {
    return (
      <button
        className={className}
        onClick={() => onSelect(appointment)}
        style={style}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}
