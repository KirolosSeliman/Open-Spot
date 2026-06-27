"use client";

import { useState } from "react";

import { AppointmentEditDrawer } from "@/components/dashboard/appointments/appointment-edit-drawer";
import { CalendarControls } from "@/components/dashboard/appointments/calendar-controls";
import { DayCalendarView } from "@/components/dashboard/appointments/day-calendar-view";
import { MonthCalendarView } from "@/components/dashboard/appointments/month-calendar-view";
import { NewAppointmentForm } from "@/components/dashboard/appointments/new-appointment-form";
import type { CalendarAppointment } from "@/components/dashboard/appointments/types";
import { UpcomingAppointmentsCard } from "@/components/dashboard/appointments/upcoming-appointments-card";
import { WeekCalendarView } from "@/components/dashboard/appointments/week-calendar-view";
import type { CalendarViewMode } from "@/lib/appointments/calendar";
import type {
  CustomerWithConsent,
  ServiceRow
} from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

function scrollToNewAppointmentForm() {
  document
    .getElementById("new-appointment-form")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AppointmentsCalendarShell({
  locale,
  timezone,
  view,
  dateKey,
  appointments,
  upcomingAppointments,
  customers,
  services,
  reminderEnabled,
  confirmationEnabled,
  error
}: {
  locale: Locale;
  timezone: string;
  view: CalendarViewMode;
  dateKey: string;
  appointments: CalendarAppointment[];
  upcomingAppointments: CalendarAppointment[];
  customers: CustomerWithConsent[];
  services: ServiceRow[];
  reminderEnabled: boolean;
  confirmationEnabled: boolean;
  error?: string;
}) {
  const copy = getDashboardCopy(locale);
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2563eb]">
            {copy.appointments.eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#0b1328]">
            {copy.appointments.title}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-[#64748b]">
            {copy.appointments.description}
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#2563eb] px-5 text-sm font-bold text-white transition hover:bg-[#1d4ed8] lg:self-auto"
          onClick={scrollToNewAppointmentForm}
          type="button"
        >
          <span aria-hidden="true">+</span>
          {copy.appointments.addButton}
        </button>
      </div>

      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <div className="min-w-0 rounded-[24px] border border-[#e3eaf5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <CalendarControls
            dateKey={dateKey}
            locale={locale}
            timezone={timezone}
            view={view}
          />
          <div className="mt-5 min-h-[700px]">
            {view === "month" ? (
              <MonthCalendarView
                appointments={appointments}
                dateKey={dateKey}
                locale={locale}
                onSelectAppointment={setSelectedAppointment}
                timezone={timezone}
              />
            ) : null}
            {view === "week" ? (
              <WeekCalendarView
                appointments={appointments}
                dateKey={dateKey}
                locale={locale}
                onSelectAppointment={setSelectedAppointment}
                timezone={timezone}
              />
            ) : null}
            {view === "day" ? (
              <DayCalendarView
                appointments={appointments}
                dateKey={dateKey}
                locale={locale}
                onSelectAppointment={setSelectedAppointment}
                timezone={timezone}
              />
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 gap-6">
          <NewAppointmentForm
            confirmationEnabled={confirmationEnabled}
            customers={customers}
            dateKey={dateKey}
            error={error}
            locale={locale}
            reminderEnabled={reminderEnabled}
            services={services}
            timezone={timezone}
            view={view}
          />
          <UpcomingAppointmentsCard
            appointments={upcomingAppointments}
            dateKey={dateKey}
            locale={locale}
            timezone={timezone}
          />
        </div>
      </div>

      <AppointmentEditDrawer
        appointment={selectedAppointment}
        locale={locale}
        onClose={() => setSelectedAppointment(null)}
        services={services}
      />
    </div>
  );
}
