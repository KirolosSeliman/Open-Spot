import Link from "next/link";

import {
  createAppointmentAction,
  updateAppointmentAction
} from "@/lib/dashboard/actions";
import { loadAppointmentWorkspace } from "@/lib/dashboard/operations-data";
import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";

type AppointmentsPageProps = {
  searchParams: Promise<{
    error?: string;
    range?: string;
    status?: string;
  }>;
};

const rangeFilters = [
  { label: "Tous", value: "all" },
  { label: "Aujourd'hui", value: "today" },
  { label: "Demain", value: "tomorrow" },
  { label: "7 jours", value: "next_7_days" }
];

const statusFilters = [
  { label: "Tous", value: "all" },
  { label: "Planifiés", value: "scheduled" },
  { label: "Confirmés", value: "confirmed" },
  { label: "Annulés", value: "cancelled" },
  { label: "Terminés", value: "completed" },
  { label: "No-show", value: "no_show" }
];

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

function formatAppointmentTime(value: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatAppointmentStatus(status: string) {
  if (status === "cancelled") {
    return "Annulé";
  }

  if (status === "confirmed") {
    return "Confirmé";
  }

  if (status === "completed") {
    return "Terminé";
  }

  if (status === "no_show") {
    return "No-show";
  }

  return "Planifié";
}

function formatReminderState(appointment: {
  reminder_24h_enabled: boolean;
  reminder_status: string;
}) {
  if (!appointment.reminder_24h_enabled) {
    return "Rappel desactive";
  }

  if (appointment.reminder_status === "sent") {
    return "Rappel envoye";
  }

  if (appointment.reminder_status === "scheduled") {
    return "Rappel 24 h actif";
  }

  if (appointment.reminder_status === "failed") {
    return "Rappel en erreur";
  }

  return "Rappel 24 h demande";
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
  const params = await searchParams;
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

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Ajoutez les rendez-vous existants du commerce pour preparer les rappels 24 h et suivre les confirmations sans remplacer le systeme de reservation."
        title="Rendez-vous"
      />

      <Panel title="Ajouter un rendez-vous">
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
            Client
            <select
              className="min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3"
              name="customerId"
              required
            >
              <option value="">Choisir un client</option>
              {activeCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} - {customer.phone_e164}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-bold lg:col-span-2">
            Service
            <select
              className="min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3"
              name="serviceId"
            >
              <option value="">Service non precise</option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid min-w-0 gap-4 lg:col-span-2">
            <label className="grid min-w-0 gap-2 text-sm font-bold">
              Debut
              <input
                className="min-h-11 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3"
                name="startsAt"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-bold">
              Fin
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
            Notes
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
            Rappel 24 h
          </label>
          <label className="flex items-end gap-2 text-sm font-bold md:col-span-2">
            <input
              defaultChecked={Boolean(
                settings?.appointment_confirmation_requests_enabled
              )}
              name="requestConfirmation"
              type="checkbox"
            />
            Demander OUI/NON
          </label>
          <button
            className="min-h-11 self-end rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
            type="submit"
          >
            Add appointment
          </button>
        </form>
        <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
          Le choix Rappel 24 h est enregistre sur le rendez-vous; si les
          rappels sont actives et que le client est opt-in, Open Spot prepare
          une ligne planifiee traitee par le moteur SMS serveur.
        </p>
      </Panel>

      <Panel title="Rendez-vous a venir">
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
                <th className={tableHeadClass}>Client</th>
                <th className={tableHeadClass}>Rendez-vous</th>
                <th className={tableHeadClass}>Statuts</th>
                <th className={tableHeadClass}>Modifier</th>
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
                      {appointment.serviceName ?? "Service non precise"}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <p className="font-black">
                      {formatAppointmentTime(appointment.starts_at)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {appointment.timezone}
                    </p>
                  </td>
                  <td className={tableCellClass}>
                    <div className="grid gap-2">
                      <StatusBadge>
                        {formatAppointmentStatus(appointment.status)}
                      </StatusBadge>
                      <StatusBadge>{formatReminderState(appointment)}</StatusBadge>
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
                        Service
                        <select
                          className="min-h-10 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={appointment.service_id ?? ""}
                          name="serviceId"
                        >
                          <option value="">Non precise</option>
                          {activeServices.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-bold">
                        Statut
                        <select
                          className="min-h-10 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={appointment.status}
                          name="status"
                        >
                          <option value="scheduled">Planifié</option>
                          <option value="confirmed">Confirmé</option>
                          <option value="cancelled">Annulé</option>
                          <option value="completed">Terminé</option>
                          <option value="no_show">No-show</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-bold">
                        Debut
                        <input
                          className="min-h-10 w-full min-w-0 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                          defaultValue={toDateTimeLocal(appointment.starts_at)}
                          name="startsAt"
                          required
                          type="datetime-local"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-bold">
                        Fin
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
                        Rappel 24 h
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold">
                        <input
                          defaultChecked={
                            appointment.confirmation_request_enabled
                          }
                          name="requestConfirmation"
                          type="checkbox"
                        />
                        Demander OUI/NON
                      </label>
                      <label className="grid min-w-0 content-start gap-1 text-xs font-bold">
                        Notes
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
                        Save appointment
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Ajoutez un rendez-vous existant pour preparer les prochains rappels SMS. Les envois reels resteront desactives jusqu'a la phase cron/provider."
            title="Aucun rendez-vous trouve."
          />
        )}
      </Panel>
    </div>
  );
}
