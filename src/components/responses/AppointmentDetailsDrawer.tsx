"use client";

import Link from "next/link";
import { useEffect } from "react";

import type { AppointmentCalendarItem } from "@/lib/responses/types";
import { getDashboardCopy, intlLocale } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import { formatAppointmentClassification } from "@/lib/responses/formatters";

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateTime(value: string | null, locale: Locale) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AppointmentDetailsDrawer({
  item,
  locale,
  onClose
}: {
  item: AppointmentCalendarItem | null;
  locale: Locale;
  onClose: () => void;
}) {
  const copy = getDashboardCopy(locale);

  useEffect(() => {
    if (!item) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  const confirmationLabels = copy.responses.confirmationStatuses;
  const appointmentStatusLabels = copy.appointments.statuses;
  const confirmationLabel =
    confirmationLabels[
      item.confirmationStatus as keyof typeof confirmationLabels
    ] ?? item.confirmationStatus;
  const statusLabel =
    appointmentStatusLabels[item.status as keyof typeof appointmentStatusLabels] ??
    item.status;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(20,38,46,0.24)] p-0 sm:p-4">
      <button
        aria-label="Fermer le panneau"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="appointment-details-title"
        className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-[var(--line)] bg-white shadow-2xl sm:rounded-[1.5rem] sm:border"
        role="dialog"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--line)] bg-white px-5 py-4">
          <h2 className="text-lg font-black" id="appointment-details-title">
            Détails du rendez-vous
          </h2>
          <button
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white text-lg font-black"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <section className="grid gap-2">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Informations du client
            </h3>
            <p className="text-base font-black">{item.customerName}</p>
            <p className="text-sm font-bold text-[var(--muted)]">{item.customerPhone}</p>
            {item.customerEmail ? (
              <p className="text-sm font-bold text-[var(--muted)]">{item.customerEmail}</p>
            ) : null}
            <p className="text-sm font-bold text-[var(--muted)]">
              Langue : {item.customerLanguage.toUpperCase()}
            </p>
          </section>

          <section className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Rendez-vous
            </h3>
            <p className="font-black">{item.serviceName ?? copy.common.serviceNotSpecified}</p>
            <p className="text-sm font-bold text-[var(--muted)]">
              {formatDateTime(item.startsAt, locale)}
              {item.endsAt ? ` – ${formatTime(item.endsAt, locale)}` : ""}
            </p>
            <p className="text-sm font-bold">{statusLabel}</p>
            <p className="text-sm font-bold text-[var(--muted)]">{item.timezone}</p>
          </section>

          <section className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              SMS
            </h3>
            <p className="text-sm font-bold">
              {item.smsSent ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-label="SMS envoyé"
                    className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"
                  />
                  SMS envoyé
                </span>
              ) : (
                "SMS non envoyé"
              )}
            </p>
            {item.smsSentAt ? (
              <p className="text-sm font-bold text-[var(--muted)]">
                Envoyé le {formatDateTime(item.smsSentAt, locale)}
              </p>
            ) : null}
            {item.smsDeliveryStatus ? (
              <p className="text-sm font-bold text-[var(--muted)]">
                Statut : {item.smsDeliveryStatus}
              </p>
            ) : null}
            {item.smsBody ? (
              <p className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6">
                {item.smsBody}
              </p>
            ) : null}
          </section>

          <section className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Réponse du client
            </h3>
            <p className="text-sm font-bold">
              {formatAppointmentClassification(item.inboundClassification, locale)}
            </p>
            {item.inboundBody ? (
              <p className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6">
                {item.inboundBody}
              </p>
            ) : (
              <p className="text-sm font-bold text-[var(--muted)]">Aucune réponse</p>
            )}
            {item.inboundReceivedAt ? (
              <p className="text-sm font-bold text-[var(--muted)]">
                Reçu le {formatDateTime(item.inboundReceivedAt, locale)}
              </p>
            ) : null}
          </section>

          <section className="grid gap-2">
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
              Confirmation
            </h3>
            <p className="text-sm font-black">{confirmationLabel}</p>
          </section>

          {item.notes ? (
            <section className="grid gap-2">
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
                Notes
              </h3>
              <p className="rounded-xl border border-[var(--line)] bg-slate-50 p-3 text-sm leading-6">
                {item.notes}
              </p>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {item.relatedOpeningId ? (
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 text-sm font-black"
                href={`/dashboard/cancellations/${item.relatedOpeningId}`}
              >
                Voir l&apos;annulation associée
              </Link>
            ) : null}
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-black text-white"
              href={`/dashboard/appointments`}
            >
              Voir les rendez-vous
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
