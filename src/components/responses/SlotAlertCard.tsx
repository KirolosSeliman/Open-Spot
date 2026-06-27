"use client";

import Link from "next/link";
import { useState } from "react";

import type { OpeningResponseGroup } from "@/lib/dashboard/operations-data";
import { getOpeningStatusPresentation } from "@/lib/responses/formatters";
import type { Locale } from "@/lib/i18n/types";
import { getDashboardCopy, intlLocale } from "@/lib/i18n/dashboard-copy";

import { ResponsesTable } from "./ResponsesTable";

function CalendarIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 3v2M16 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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
    hour: "2-digit",
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
      return "bg-emerald-50 text-emerald-700";
    case "warning":
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-slate-100 text-[var(--foreground)]";
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

  return (
    <article className="rounded-[1.35rem] border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-[var(--primary)]">
            <CalendarIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-[var(--foreground)]">{title}</h2>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusBadgeClass(status.tone)}`}
              >
                {status.tone === "warning" && group.openingStatus !== "filled"
                  ? "En attente"
                  : status.label}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-[var(--muted)]">
              {formatSlotDateTime(group.startTime, group.endTime, locale)}
            </p>
            <div className="mt-3 grid gap-2 text-xs font-black text-[var(--muted)] sm:grid-cols-4">
              <span>
                {group.sentCount} SMS envoyé{group.sentCount > 1 ? "s" : ""}
              </span>
              <span>
                {group.responseCount} réponse{group.responseCount > 1 ? "s" : ""}
              </span>
              <span>
                {group.positiveCount} positif{group.positiveCount > 1 ? "s" : ""}
              </span>
              <span>
                {group.noReplyCount} sans réponse
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-black text-[var(--foreground)] hover:bg-slate-50"
            href={`/dashboard/cancellations/${group.openingId}`}
          >
            <span aria-hidden>👁</span>
            {copy.responses.openingsPanel.view}
          </Link>
          <button
            aria-expanded={expanded}
            aria-label={expanded ? "Réduire l'alerte" : "Développer l'alerte"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-slate-50"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? "▴" : "▾"}
          </button>
        </div>
      </div>

      {expanded ? (
        <ResponsesTable
          canValidate={canValidate}
          group={group}
          locale={locale}
          recoveredValueCents={recoveredValueCents}
        />
      ) : null}
    </article>
  );
}
