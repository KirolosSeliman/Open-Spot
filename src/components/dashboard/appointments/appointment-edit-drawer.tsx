"use client";

import { useMemo, useState } from "react";

import { updateAppointmentAction } from "@/lib/dashboard/actions";
import type {
  AppointmentView,
  CustomerWithConsent,
  ServiceRow
} from "@/lib/dashboard/operations-data";
import { toDateTimeLocalValue } from "@/lib/appointments/date-format";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-[#e3eaf5] bg-white px-3 text-sm text-[#0b1328]";

export function AppointmentEditDrawer({
  appointment,
  locale,
  services,
  onClose
}: {
  appointment: AppointmentView | null;
  locale: Locale;
  services: ServiceRow[];
  onClose: () => void;
}) {
  const copy = getDashboardCopy(locale);
  const activeServices = useMemo(
    () => services.filter((service) => service.active),
    [services]
  );

  if (!appointment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,23,42,0.35)] p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-[#e3eaf5] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0b1328]">
              {copy.appointments.editTitle}
            </h2>
            <p className="mt-1 text-sm text-[#64748b]">
              {appointment.customerName}
            </p>
            {appointment.recurrence_series_id ? (
              <p className="mt-2 text-xs font-semibold text-[#64748b]">
                {copy.appointments.editSeriesNote}
              </p>
            ) : null}
          </div>
          <button
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#64748b] hover:bg-[#f8fafc]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form action={updateAppointmentAction} className="grid gap-4">
          <input name="appointmentId" type="hidden" value={appointment.id} />
          <input name="customerId" type="hidden" value={appointment.customer_id} />
          <input name="timezone" type="hidden" value={appointment.timezone} />
          <input
            name="confirmationStatus"
            type="hidden"
            value={appointment.confirmation_status}
          />

          <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
            {copy.common.service}
            <select
              className={fieldClassName}
              defaultValue={appointment.service_id ?? ""}
              name="serviceId"
            >
              <option value="">{copy.common.serviceNotSpecified}</option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
            {copy.common.status}
            <select
              className={fieldClassName}
              defaultValue={appointment.status}
              name="status"
            >
              <option value="scheduled">{copy.appointments.statuses.scheduled}</option>
              <option value="confirmed">{copy.appointments.statuses.confirmed}</option>
              <option value="cancelled">{copy.appointments.statuses.cancelled}</option>
              <option value="completed">{copy.appointments.statuses.completed}</option>
              <option value="no_show">{copy.appointments.statuses.no_show}</option>
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
              {copy.common.start}
              <input
                className={fieldClassName}
                defaultValue={toDateTimeLocalValue(
                  appointment.starts_at,
                  appointment.timezone
                )}
                name="startsAt"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
              {copy.common.end}
              <input
                className={fieldClassName}
                defaultValue={toDateTimeLocalValue(
                  appointment.ends_at,
                  appointment.timezone
                )}
                name="endsAt"
                type="datetime-local"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
            {copy.common.notes}
            <textarea
              className="min-h-[84px] w-full rounded-xl border border-[#e3eaf5] bg-white px-3 py-2 text-sm"
              defaultValue={appointment.notes ?? ""}
              name="notes"
              rows={3}
            />
          </label>

          <label className="flex items-start gap-3">
            <input
              className="mt-1"
              defaultChecked={appointment.reminder_24h_enabled}
              name="sendReminder"
              type="checkbox"
            />
            <span className="text-sm font-semibold text-[#0b1328]">
              {copy.appointments.reminder24h}
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              className="mt-1"
              defaultChecked={appointment.confirmation_request_enabled}
              name="requestConfirmation"
              type="checkbox"
            />
            <span className="text-sm font-semibold text-[#0b1328]">
              {copy.appointments.askYesNo}
            </span>
          </label>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-bold text-white"
            type="submit"
          >
            {copy.appointments.save}
          </button>
        </form>
      </div>
    </div>
  );
}
