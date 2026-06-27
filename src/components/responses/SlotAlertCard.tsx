"use client";

import Link from "next/link";
import { useState } from "react";

import type { OpeningResponseGroup } from "@/lib/dashboard/operations-data";
import { getOpeningStatusPresentation } from "@/lib/responses/formatters";
import type { Locale } from "@/lib/i18n/types";
import { getDashboardCopy, intlLocale } from "@/lib/i18n/dashboard-copy";

import {
  CalendarSlotIcon,
  ChevronDownIcon,
  EyeIcon
} from "./responses-icons";
import { ResponsesTable } from "./ResponsesTable";

function formatSlotDateTime(
  start: string | null,
  end: string | null,
  locale: Locale
) {
  if (!start) {
    return getDashboardCopy(locale).common.dateUnknown;
  }

  const dateFormatter = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const timeFormatter = new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit"
  });
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)}${
    endDate ? ` – ${timeFormatter.format(endDate)}` : ""
  }`;
}

function statusBadgeClass(tone: "success" | "warning" | "neutral") {
  switch (tone) {
    case "success":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function SlotAlertCard({
  group,
  locale,
  recoveredValueCents,
  canValidate,
  defaultExpanded = false
}: {
  group: OpeningResponseGroup;
  locale: Locale;
  recoveredValueCents: number;
  canValidate: boolean;
  defaultExpanded?: boolean;
}) {
  const copy = getDashboardCopy(locale);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const status = getOpeningStatusPresentation(group.openingStatus, locale);
  const title = group.serviceName ?? group.openingTitle;
  const statusLabel =
    status.tone === "success"
      ? "Créneau récupéré"
      : status.tone === "warning"
        ? "En attente"
        : status.label;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3ff] text-[var(--primary)]">
            <CalendarSlotIcon />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[15px] font-black capitalize text-[var(--foreground)]">
                {title}
              </h2>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-black ${statusBadgeClass(status.tone)}`}
              >
                {statusLabel}
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
              {formatSlotDateTime(group.startTime, group.endTime, locale)}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-bold text-slate-500">
              <span>
                {group.sentCount} SMS envoyé{group.sentCount > 1 ? "s" : ""}
              </span>
              <span>
                {group.responseCount} réponse{group.responseCount > 1 ? "s" : ""}
              </span>
              <span>
                {group.positiveCount} positif{group.positiveCount > 1 ? "s" : ""}
              </span>
              <span>{group.noReplyCount} sans réponse</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:pl-4">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[var(--foreground)] transition hover:bg-slate-50"
            href={`/dashboard/cancellations/${group.openingId}`}
          >
            <EyeIcon />
            <span className="hidden sm:inline">{copy.responses.openingsPanel.view}</span>
            <span className="sm:hidden">Voir</span>
          </Link>
          <button
            aria-expanded={expanded}
            aria-label={expanded ? "Réduire l'alerte" : "Développer l'alerte"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--muted)] transition hover:bg-slate-50"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            <ChevronDownIcon open={expanded} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <ResponsesTable
            canValidate={canValidate}
            group={group}
            locale={locale}
            recoveredValueCents={recoveredValueCents}
          />
        </div>
      ) : null}
    </article>
  );
}
