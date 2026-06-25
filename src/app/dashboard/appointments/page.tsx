import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import {
  createAppointmentAction,
  updateAppointmentAction
} from "@/lib/dashboard/actions";
import { loadAppointmentWorkspace } from "@/lib/dashboard/operations-data";
import { getDashboardCopy, intlLocale } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/types";

type AppointmentsPageProps = {
  searchParams: Promise<{
    error?: string;
    range?: string;
    status?: string;
  }>;
};

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatAppointmentTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatAppointmentStatus(status: string, locale: Locale) {
  const statuses = getDashboardCopy(locale).appointments.statuses;
  return statuses[status as keyof typeof statuses] ?? status;
}

function formatReminderState(
  appointment: {
    reminder_24h_enabled: boolean;
    reminder_status: string;
  },
  locale: Locale
) {
  const states = getDashboardCopy(locale).appointments.reminderStates;

  if (!appointment.reminder_24h_enabled) {
    return states.disabled;
  }

  if (appointment.reminder_status === "sent") {
    return states.sent;
  }

  if (appointment.reminder_status === "scheduled") {
    return states.scheduled;
  }

  if (appointment.reminder_status === "failed") {
    return states.failed;
  }

  return states.requested;
}

function buildFilterHref({
  range,
  status
}: {
  range: string;
  status: string;
}) {
  const params = new URLSearchParams();

  if (range !== "all") {
    params.set("range", range);
  }

  if (status !== "all") {
    params.set("status", status);
  }

  const query = params.toString();
  return query ? `/dashboard/appointments?${query}` : "/dashboard/appointments";
}

export default async function AppointmentsPage({
  searchParams
}: AppointmentsPageProps) {
  const [params, locale] = await Promise.all([searchParams, getRequestLocale()]);
  const copy = getDashboardCopy(locale);
  const activeRange = params.range ?? "all";
  const activeStatus = params.status ?? "all";
  const { appointments, customers, services, settings, timezone } =
    await loadAppointmentWorkspace({
      range: activeRange,
      status: activeStatus
    });
  const activeCustomers = customers.filter(
    (customer) => customer.consentStatus !== "opted_out"
  );
  const activeServices = services.filter((service) => service.active);
  const reminderEnabled = Boolean(settings?.appointment_reminders_enabled);
  const rangeFilters = [
    { label: copy.appointments.ranges.all, value: "all" },
    { label: copy.appointments.ranges.today, value: "today" },
    { label: copy.appointments.ranges.tomorrow, value: "tomorrow" },
    { label: copy.appointments.ranges.next_7_days, value: "next_7_days" }
  ];
  const statusFilters = [
    { label: copy.appointments.statuses.all, value: "all" },
    { label: copy.appointments.statuses.scheduled, value: "scheduled" },
    { label: copy.appointments.statuses.confirmed, value: "confirmed" },
    { label: copy.appointments.statuses.cancelled, value: "cancelled" },
    { label: copy.appointments.statuses.completed, value: "completed" },
    { label: copy.appointments.statuses.no_show, value: "no_show" }
  ];

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description={copy.appointments.description}
        title={copy.appointments.title}
      />

      <Panel title={copy.appointments.addTitle}>
        {params.error ? (
          <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
            {params.error}
          </p>
        ) : null}
        <form
          action={createAppointmentAction}
          className="grid min-w-0 gap-4 lg:grid-cols-4"
        >
          <label className="grid min-w-0 gap-2 text-sm font-bold lg:col-span-2">
            {copy.common.customer}
            <select
              className="min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3"
              name="customerId"
              required
            >
              <option value="">{copy.appointments.chooseCustomer}</option>
              {activeCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} - {customer.phone_e164}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-bold lg:col-span-2">
            {copy.common.service}
            <select
              className="min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3"
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
          <div className="grid min-w-0 gap-4 lg:col-span-2">
            <label className="grid min-w-0 gap-2 text-sm font-bold">
              {copy.common.start}
              <input
                className="min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3"
                name="startsAt"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-bold">
              {copy.common.end}
              <input
                className="min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3"
                name="endsAt"
                type="datetime-local"
              />
            </label>
          </div>
          <input
            name="timezone"
            type="hidden"
            value={timezone ?? "America/Toronto"}
          />
          <label className="grid min-w-0 content-start gap-2 text-sm font-bold lg:col-span-2">
            {copy.common.notes}
            <textarea
              className="min-h-24 w-full min-w-0 resize-y rounded-xl border border-[var(--line)] bg-white px-3 py-2"
              name="notes"
              rows={3}
            />
          </label>
          <label className="flex items-end gap-2 text-sm font-bold">
            <input
              defaultChecked={reminderEnabled}
              name="sendReminder"
              type="checkbox"
            />
            {copy.appointments.reminder24h}
          </label>
          <label className="flex items-end gap-2 text-sm font-bold md:col-span-2">
            <input
              defaultChecked={Boolean(
                settings?.appointment_confirmation_requests_enabled
              )}
              name="requestConfirmation"
              type="checkbox"
            />
            {copy.appointments.askYesNo}
          </label>
          <button
            className="min-h-11 self-end rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
            type="submit"
          >
            {copy.appointments.submit}
          </button>
        </form>
        <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
          {copy.appointments.help}
        </p>
      </Panel>

      <Panel title={copy.appointments.upcomingTitle}>
        <div className="mb-4 grid gap-3 lg:grid-cols-2">
          <div className="flex flex-wrap gap-2">
            {rangeFilters.map((filter) => (
              <Link
                className={`rounded-full border px-3 py-2 text-xs font-black ${
                  activeRange === filter.value
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--line)] bg-white"
                }`}
                href={buildFilterHref({
                  range: filter.value,
                  status: activeStatus
                })}
                key={filter.value}
              >
                {filter.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {statusFilters.map((filter) => (
              <Link
                className={`rounded-full border px-3 py-2 text-xs font-black ${
                  activeStatus === filter.value
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--line)] bg-white"
                }`}
                href={buildFilterHref({
                  range: activeRange,
                  status: filter.value
                })}
                key={filter.value}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        {appointments.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>{copy.common.customer}</th>
                <th className={tableHeadClass}>
                  {copy.appointments.table.appointment}
                </th>
                <th className={tableHeadClass}>
                  {copy.appointments.table.statuses}
                </th>
                <th className={tableHeadClass}>{copy.appointments.table.edit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className={tableCellClass}>
                    <p className="font-black">{appointment.customerName}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {appointment.customerPhone}
                    </p>
                    <p className="mt-1 text-xs font-bold">
                      {appointment.serviceName ?? copy.common.serviceNotSpecified}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <p className="font-black">
                      {formatAppointmentTime(appointment.starts_at, locale)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {appointment.timezone}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <div className="grid gap-2">
                      <StatusBadge>
                        {formatAppointmentStatus(appointment.status, locale)}
                      </StatusBadge>
                      <StatusBadge>
                        {formatReminderState(appointment, locale)}
                      </StatusBadge>
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <form
                      action={updateAppointmentAction}
                      className="grid w-full min-w-0 max-w-sm gap-2"
                    >
                      <input
                        name="appointmentId"
                        type="hidden"
                        value={appointment.id}
                      />
                      <input
                        name="customerId"
                        type="hidden"
                        value={appointment.customer_id}
                      />
                      <label className="grid gap-1 text-xs font-bold">
                        {copy.common.service}
                        <select
                          className="min-h-10 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={appointment.service_id ?? ""}
                          name="serviceId"
                        >
                          <option value="">
                            {copy.common.serviceNotSpecified}
                          </option>
                          {activeServices.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-bold">
                        {copy.common.status}
                        <select
                          className="min-h-10 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={appointment.status}
                          name="status"
                        >
                          <option value="scheduled">
                            {copy.appointments.statuses.scheduled}
                          </option>
                          <option value="confirmed">
                            {copy.appointments.statuses.confirmed}
                          </option>
                          <option value="cancelled">
                            {copy.appointments.statuses.cancelled}
                          </option>
                          <option value="completed">
                            {copy.appointments.statuses.completed}
                          </option>
                          <option value="no_show">
                            {copy.appointments.statuses.no_show}
                          </option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-bold">
                        {copy.common.start}
                        <input
                          className="min-h-10 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={toDateTimeLocal(appointment.starts_at)}
                          name="startsAt"
                          required
                          type="datetime-local"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-bold">
                        {copy.common.end}
                        <input
                          className="min-h-10 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={toDateTimeLocal(appointment.ends_at)}
                          name="endsAt"
                          type="datetime-local"
                        />
                      </label>
                      <input
                        name="timezone"
                        type="hidden"
                        value={appointment.timezone}
                      />
                      <input
                        name="confirmationStatus"
                        type="hidden"
                        value={appointment.confirmation_status}
                      />
                      <label className="flex items-center gap-2 text-xs font-bold">
                        <input
                          defaultChecked={appointment.reminder_24h_enabled}
                          name="sendReminder"
                          type="checkbox"
                        />
                        {copy.appointments.reminder24h}
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold">
                        <input
                          defaultChecked={
                            appointment.confirmation_request_enabled
                          }
                          name="requestConfirmation"
                          type="checkbox"
                        />
                        {copy.appointments.askYesNo}
                      </label>
                      <label className="grid min-w-0 content-start gap-1 text-xs font-bold">
                        {copy.common.notes}
                        <textarea
                          className="min-h-20 w-full min-w-0 resize-y rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
                          defaultValue={appointment.notes ?? ""}
                          name="notes"
                          rows={3}
                        />
                      </label>
                      <button
                        className="min-h-10 rounded-full bg-[var(--primary)] px-4 text-xs font-black text-white"
                        type="submit"
                      >
                        {copy.appointments.save}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description={copy.appointments.emptyDescription}
            title={copy.appointments.emptyTitle}
          />
        )}
      </Panel>
    </div>
  );
}
