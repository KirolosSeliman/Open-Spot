import { AppointmentsCalendarShell } from "@/components/dashboard/appointments/appointments-calendar-shell";
import type { CalendarAppointment } from "@/components/dashboard/appointments/types";
import {
  parseCalendarDateKey,
  parseCalendarView
} from "@/lib/appointments/calendar";
import { loadAppointmentWorkspace } from "@/lib/dashboard/operations-data";
import { getRequestLocale } from "@/lib/i18n/locale";

type AppointmentsPageProps = {
  searchParams: Promise<{
    error?: string;
    view?: string;
    date?: string;
  }>;
};

export default async function AppointmentsPage({
  searchParams
}: AppointmentsPageProps) {
  const [params, locale] = await Promise.all([searchParams, getRequestLocale()]);
  const {
    appointments,
    upcomingAppointments,
    customers,
    services,
    settings,
    timezone
  } = await loadAppointmentWorkspace({
    view: params.view,
    date: params.date
  });

  const resolvedTimezone = timezone ?? "America/Toronto";
  const view = parseCalendarView(params.view);
  const dateKey = parseCalendarDateKey(params.date, resolvedTimezone);
  const serviceDurationById = new Map(
    services.map((service) => [service.id, service.duration_minutes])
  );

  const calendarAppointments: CalendarAppointment[] = appointments.map(
    (appointment) => ({
      ...appointment,
      durationMinutes: appointment.service_id
        ? serviceDurationById.get(appointment.service_id) ?? null
        : null
    })
  );

  const calendarUpcoming: CalendarAppointment[] = upcomingAppointments.map(
    (appointment) => ({
      ...appointment,
      durationMinutes: appointment.service_id
        ? serviceDurationById.get(appointment.service_id) ?? null
        : null
    })
  );

  return (
    <div className="min-w-0 rounded-[28px] bg-[#f7faff] p-4 sm:p-6 lg:p-8">
      <AppointmentsCalendarShell
        appointments={calendarAppointments}
        confirmationEnabled={Boolean(
          settings?.appointment_confirmation_requests_enabled
        )}
        customers={customers}
        dateKey={dateKey}
        error={params.error}
        locale={locale}
        reminderEnabled={Boolean(settings?.appointment_reminders_enabled)}
        services={services}
        timezone={resolvedTimezone}
        upcomingAppointments={calendarUpcoming}
        view={view}
      />
    </div>
  );
}
