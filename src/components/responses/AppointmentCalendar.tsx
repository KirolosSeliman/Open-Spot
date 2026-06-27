"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/dashboard-ui";
import { getDashboardCopy, intlLocale } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import { groupAppointmentsByDay } from "@/lib/responses/calendar-utils";
import type { AppointmentCalendarItem, CalendarInterval } from "@/lib/responses/types";

import { AppointmentDetailsDrawer } from "./AppointmentDetailsDrawer";

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function AppointmentChip({
  item,
  locale,
  onSelect
}: {
  item: AppointmentCalendarItem;
  locale: Locale;
  onSelect: (item: AppointmentCalendarItem) => void;
}) {
  const copy = getDashboardCopy(locale);

  return (
    <button
      className="flex w-full items-start gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 text-left shadow-sm transition hover:border-[var(--primary)] hover:bg-[#f8fbff]"
      onClick={() => onSelect(item)}
      type="button"
    >
      <div className="min-w-[3.5rem] text-sm font-black text-[var(--primary)]">
        {formatTime(item.startsAt, locale)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-black">{item.customerName}</p>
          {item.smsSent ? (
            <span
              aria-label="SMS envoyé"
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
              title="SMS envoyé"
            />
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm font-bold text-[var(--muted)]">
          {item.serviceName ?? copy.common.serviceNotSpecified}
        </p>
        <p className="mt-1 text-xs font-bold text-[var(--muted)]">
          {item.smsSent ? "SMS envoyé" : "SMS non envoyé"}
        </p>
      </div>
    </button>
  );
}

function DayColumn({
  dateLabel,
  items,
  locale,
  onSelect
}: {
  dateLabel: string;
  items: AppointmentCalendarItem[];
  locale: Locale;
  onSelect: (item: AppointmentCalendarItem) => void;
}) {
  return (
    <div className="min-w-0 rounded-[1.25rem] border border-[var(--line)] bg-slate-50 p-3">
      <h3 className="mb-3 text-sm font-black text-[var(--foreground)]">{dateLabel}</h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <AppointmentChip item={item} key={item.id} locale={locale} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({
  items,
  locale,
  onSelect
}: {
  items: AppointmentCalendarItem[];
  locale: Locale;
  onSelect: (item: AppointmentCalendarItem) => void;
}) {
  const days = useMemo(() => groupAppointmentsByDay(items), [items]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {days.map((day) => (
        <DayColumn
          dateLabel={new Intl.DateTimeFormat(intlLocale(locale), {
            weekday: "short",
            day: "numeric",
            month: "short"
          }).format(new Date(`${day.dateKey}T12:00:00`))}
          items={day.items}
          key={day.dateKey}
          locale={locale}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function AppointmentCalendar({
  items,
  interval,
  locale
}: {
  items: AppointmentCalendarItem[];
  interval: CalendarInterval;
  locale: Locale;
}) {
  const [selected, setSelected] = useState<AppointmentCalendarItem | null>(null);
  const days = useMemo(() => groupAppointmentsByDay(items), [items]);

  if (items.length === 0) {
    return (
      <EmptyState
        description="Essayez un autre intervalle ou une autre période."
        title="Aucun rendez-vous planifié sur cet intervalle."
      />
    );
  }

  return (
    <>
      {interval === "1m" ? (
        <MonthGrid items={items} locale={locale} onSelect={setSelected} />
      ) : (
        <div
          className={`grid gap-3 ${
            interval === "1w"
              ? "md:grid-cols-2 xl:grid-cols-4"
              : interval === "2d"
                ? "md:grid-cols-2"
                : "grid-cols-1"
          }`}
        >
          {days.map((day) => (
            <DayColumn
              dateLabel={day.dateLabel}
              items={day.items}
              key={day.dateKey}
              locale={locale}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}
      <AppointmentDetailsDrawer
        item={selected}
        locale={locale}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
