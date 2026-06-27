"use client";

import { useMemo, useState } from "react";

import { RecurrenceFields } from "@/components/dashboard/appointments/recurrence-fields";
import { createAppointmentAction } from "@/lib/dashboard/actions";
import type {
  CustomerWithConsent,
  ServiceRow
} from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-[#e3eaf5] bg-white px-3 text-sm text-[#0b1328]";

export function NewAppointmentForm({
  locale,
  timezone,
  customers,
  services,
  reminderEnabled,
  confirmationEnabled,
  view,
  dateKey,
  error
}: {
  locale: Locale;
  timezone: string;
  customers: CustomerWithConsent[];
  services: ServiceRow[];
  reminderEnabled: boolean;
  confirmationEnabled: boolean;
  view: string;
  dateKey: string;
  error?: string;
}) {
  const copy = getDashboardCopy(locale);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const activeCustomers = customers.filter((customer) => !customer.deleted_at);
  const activeServices = services.filter((service) => service.active);
  const selectedCustomer = activeCustomers.find(
    (customer) => customer.id === selectedCustomerId
  );
  const selectedService = activeServices.find(
    (service) => service.id === selectedServiceId
  );
  const smsDisabled = selectedCustomer?.consentStatus === "opted_out";

  const defaultDuration = useMemo(() => {
    if (!selectedService?.duration_minutes) {
      return 60;
    }

    return selectedService.duration_minutes;
  }, [selectedService?.duration_minutes]);

  function handleStartsAtChange(value: string) {
    setStartsAt(value);

    if (!value) {
      return;
    }

    const start = new Date(value);

    if (Number.isNaN(start.getTime())) {
      return;
    }

    const end = new Date(start.getTime() + defaultDuration * 60_000);
    const offsetDate = new Date(end.getTime() - end.getTimezoneOffset() * 60000);
    setEndsAt(offsetDate.toISOString().slice(0, 16));
  }

  return (
    <div
      className="rounded-[24px] border border-[#e3eaf5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      id="new-appointment-form"
    >
      <h2 className="text-lg font-bold text-[#0b1328]">{copy.appointments.addTitle}</h2>

      {error ? (
        <p className="mt-4 rounded-xl border border-[#fecaca] bg-[#fff1f2] p-3 text-sm font-semibold text-[#b42318]">
          {error}
        </p>
      ) : null}

      <form action={createAppointmentAction} className="mt-5 grid gap-4">
        <input name="returnView" type="hidden" value={view} />
        <input name="returnDate" type="hidden" value={dateKey} />
        <input name="timezone" type="hidden" value={timezone} />

        <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
          {copy.common.customer}
          <select
            className={fieldClassName}
            name="customerId"
            onChange={(event) => setSelectedCustomerId(event.target.value)}
            required
          >
            <option value="">{copy.appointments.chooseCustomer}</option>
            {activeCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
          {copy.common.service}
          <select
            className={fieldClassName}
            name="serviceId"
            onChange={(event) => setSelectedServiceId(event.target.value)}
          >
            <option value="">{copy.common.serviceNotSpecified}</option>
            {activeServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
            {copy.common.start}
            <input
              className={fieldClassName}
              name="startsAt"
              onChange={(event) => handleStartsAtChange(event.target.value)}
              required
              type="datetime-local"
              value={startsAt}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
            {copy.common.end}
            <input
              className={fieldClassName}
              name="endsAt"
              onChange={(event) => setEndsAt(event.target.value)}
              type="datetime-local"
              value={endsAt}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
          {copy.common.notes}
          <textarea
            className="min-h-[84px] w-full rounded-xl border border-[#e3eaf5] bg-white px-3 py-2 text-sm text-[#0b1328]"
            name="notes"
            placeholder={copy.appointments.notesPlaceholder}
            rows={3}
          />
        </label>

        <label className="flex items-start gap-3">
          <input
            className="mt-1"
            defaultChecked={reminderEnabled}
            disabled={smsDisabled}
            name="sendReminder"
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-semibold text-[#0b1328]">
              {copy.appointments.reminder24h}
            </span>
            <span className="mt-1 block text-xs text-[#64748b]">
              {copy.appointments.reminder24hHelp}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <input
            className="mt-1"
            defaultChecked={confirmationEnabled}
            disabled={smsDisabled}
            name="requestConfirmation"
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-semibold text-[#0b1328]">
              {copy.appointments.askYesNo}
            </span>
            <span className="mt-1 block text-xs text-[#64748b]">
              {copy.appointments.askYesNoHelp}
            </span>
          </span>
        </label>

        {smsDisabled ? (
          <p className="text-xs font-semibold text-[#b45309]">
            Ce client est désinscrit des SMS. Les options de rappel et confirmation sont désactivées.
          </p>
        ) : null}

        <RecurrenceFields
          endsAt={endsAt}
          locale={locale}
          startsAt={startsAt}
          timezone={timezone}
        />

        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-bold text-white transition hover:bg-[#1d4ed8]"
          type="submit"
        >
          {copy.appointments.submit}
        </button>
      </form>
    </div>
  );
}
