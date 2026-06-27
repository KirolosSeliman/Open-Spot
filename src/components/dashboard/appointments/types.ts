import type { AppointmentView } from "@/lib/dashboard/operations-data";

export type CalendarAppointment = AppointmentView & {
  durationMinutes?: number | null;
};

export function groupAppointmentsByDateKey(
  appointments: CalendarAppointment[],
  timezone: string
) {
  const groups = new Map<string, CalendarAppointment[]>();

  for (const appointment of appointments) {
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(appointment.starts_at));

    const existing = groups.get(dateKey) ?? [];
    existing.push(appointment);
    groups.set(dateKey, existing);
  }

  for (const [key, items] of groups) {
    groups.set(
      key,
      [...items].sort(
        (left, right) =>
          new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime()
      )
    );
  }

  return groups;
}

export function isTodayDateKey(dateKey: string, timezone: string) {
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  return todayKey === dateKey;
}
