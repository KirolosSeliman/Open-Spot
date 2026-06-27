import Link from "next/link";

import type { CalendarAppointment } from "@/components/dashboard/appointments/types";
import { buildAppointmentsHref } from "@/lib/appointments/calendar";
import {
  formatShortTime,
  formatUpcomingDateBlock
} from "@/lib/appointments/date-format";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

function statusBadgeLabel(status: string, locale: Locale) {
  const badges = getDashboardCopy(locale).appointments.statusBadges;
  return badges[status as keyof typeof badges] ?? status;
}

export function UpcomingAppointmentsCard({
  appointments,
  locale,
  timezone,
  dateKey
}: {
  appointments: CalendarAppointment[];
  locale: Locale;
  timezone: string;
  dateKey: string;
}) {
  const copy = getDashboardCopy(locale);

  return (
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-[#e3eaf5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0b1328]">
          {copy.appointments.upcomingTitle}
        </h2>
        <Link
          className="text-sm font-semibold text-[#2563eb]"
          href={buildAppointmentsHref({ view: "week", date: dateKey })}
        >
          {copy.appointments.seeAll}
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-[#64748b]">{copy.appointments.emptyTitle}</p>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const dateBlock = formatUpcomingDateBlock(
              appointment.starts_at,
              locale,
              timezone
            );

            return (
              <div
                className="flex items-start gap-4 border-b border-[#e3eaf5] pb-4 last:border-b-0 last:pb-0"
                key={appointment.id}
              >
                <div className="min-w-[56px] text-center">
                  <p className="text-2xl font-bold text-[#0b1328]">{dateBlock.day}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                    {dateBlock.month}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#0b1328]">
                    {formatShortTime(appointment.starts_at, locale, timezone)}{" "}
                    {appointment.customerName}
                  </p>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {appointment.serviceName ?? copy.common.serviceNotSpecified}
                  </p>
                </div>
                <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-bold text-[#2563eb]">
                  {statusBadgeLabel(appointment.status, locale)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 text-center">
        <Link
          className="text-sm font-semibold text-[#2563eb]"
          href={buildAppointmentsHref({ view: "week", date: dateKey })}
        >
          {copy.appointments.openFullAgenda} →
        </Link>
      </div>
    </div>
  );
}
