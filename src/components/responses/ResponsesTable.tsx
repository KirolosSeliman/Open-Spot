import Link from "next/link";

import type { OpeningResponseGroup } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import {
  formatCustomerReplyStatus,
  formatReplyBadge,
  getInitials
} from "@/lib/responses/formatters";

import { OpeningResponseRowActions } from "./OpeningResponseRowActions";

function replyTextClass(tone: "positive" | "negative" | "neutral" | "other") {
  switch (tone) {
    case "positive":
      return "text-emerald-600";
    case "negative":
      return "text-rose-600";
    default:
      return "text-slate-400";
  }
}

export function ResponsesTable({
  group,
  locale,
  recoveredValueCents,
  canValidate
}: {
  group: OpeningResponseGroup;
  locale: Locale;
  recoveredValueCents: number;
  canValidate: boolean;
}) {
  const copy = getDashboardCopy(locale);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-black text-[var(--foreground)]">
          Réponses ({group.customers.length})
        </h3>
      </div>
      <div className="os-mobile-table-scroll max-w-full min-w-0 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {["Contact", "Téléphone", "Rang", "Réponse", "Statut", "Actions"].map(
                (label) => (
                  <th
                    className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-slate-500"
                    key={label}
                    scope="col"
                  >
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {group.customers.map((customer) => {
              const reply = formatReplyBadge(customer);
              const statusLabel = formatCustomerReplyStatus(customer, locale);
              const isManual = customer.offerStatus === "selected";

              return (
                <tr className="hover:bg-slate-50/60" key={customer.offerId}>
                  <td className="min-w-0 px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                        {getInitials(customer.customerName)}
                      </span>
                      <span className="min-w-0 truncate font-bold text-[var(--foreground)]">
                        {customer.customerName}
                      </span>
                    </div>
                  </td>
                  <td className="min-w-0 truncate px-4 py-3.5 font-semibold text-slate-600">
                    {customer.customerPhone || copy.common.phoneUnknown}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-600">
                    {customer.responseRank ? `#${customer.responseRank}` : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-sm font-black ${replyTextClass(reply.tone)}`}
                    >
                      {reply.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {isManual ? (
                      <span className="inline-flex rounded-full bg-[#edf3ff] px-2.5 py-1 text-xs font-black text-[var(--primary)]">
                        {statusLabel}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">
                        {statusLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <OpeningResponseRowActions
                      canValidate={canValidate}
                      confirmLabel="Confirmer"
                      customer={customer}
                      openingId={group.openingId}
                      openingStatus={group.openingStatus}
                      recoveredValueCents={recoveredValueCents}
                      rejectLabel="Refuser"
                      validatingLabel="Validation..."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResponsesPagination({
  page,
  pageSize,
  total,
  buildPageHref
}: {
  page: number;
  pageSize: number;
  total: number;
  buildPageHref: (page: number, pageSize: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageSizeOptions = [10, 20, 50];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <p className="text-sm font-semibold text-slate-500">
        Affichage de {start} à {end} sur {total} alerte{total > 1 ? "s" : ""}
      </p>

      <div className="flex items-center justify-center gap-2">
        <Link
          aria-label="Page précédente"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-600 ${
            page <= 1 ? "pointer-events-none opacity-35" : "hover:bg-slate-50"
          }`}
          href={buildPageHref(Math.max(1, page - 1), pageSize)}
        >
          ‹
        </Link>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(79,125,243,0.25)]">
          {page}
        </span>
        <Link
          aria-label="Page suivante"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-600 ${
            page >= totalPages ? "pointer-events-none opacity-35" : "hover:bg-slate-50"
          }`}
          href={buildPageHref(Math.min(totalPages, page + 1), pageSize)}
        >
          ›
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
        {pageSizeOptions.map((option) => (
          <Link
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
              option === pageSize
                ? "bg-[var(--primary)] text-white shadow-[0_6px_14px_rgba(79,125,243,0.22)]"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            href={buildPageHref(1, option)}
            key={option}
          >
            {option} / page
          </Link>
        ))}
      </div>
    </div>
  );
}
