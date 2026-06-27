import Link from "next/link";

import {
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import type { OpeningResponseGroup } from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import {
  formatCustomerReplyStatus,
  formatReplyBadge,
  getInitials
} from "@/lib/responses/formatters";

import { OpeningResponseRowActions } from "./OpeningResponseRowActions";

function replyBadgeClass(tone: "positive" | "negative" | "neutral" | "other") {
  switch (tone) {
    case "positive":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "negative":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    default:
      return "bg-slate-50 text-[var(--muted)] ring-slate-100";
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
    <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <h3 className="text-sm font-black text-[var(--foreground)]">
          Réponses ({group.customers.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <TableShell>
          <thead>
            <tr>
              <th className={tableHeadClass}>Contact</th>
              <th className={tableHeadClass}>Téléphone</th>
              <th className={tableHeadClass}>Rang</th>
              <th className={tableHeadClass}>Réponse</th>
              <th className={tableHeadClass}>Statut</th>
              <th className={tableHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] bg-white">
            {group.customers.map((customer) => {
              const reply = formatReplyBadge(customer);
              const statusLabel = formatCustomerReplyStatus(customer, locale);
              const isManual = customer.offerStatus === "selected";

              return (
                <tr key={customer.offerId}>
                  <td className={tableCellClass}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-xs font-black text-[var(--primary)]">
                        {getInitials(customer.customerName)}
                      </span>
                      <span className="font-bold">{customer.customerName}</span>
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    {customer.customerPhone || copy.common.phoneUnknown}
                  </td>
                  <td className={tableCellClass}>
                    {customer.responseRank ? `#${customer.responseRank}` : "—"}
                  </td>
                  <td className={tableCellClass}>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ring-inset ${replyBadgeClass(reply.tone)}`}
                    >
                      {reply.label}
                    </span>
                  </td>
                  <td className={tableCellClass}>
                    {isManual ? (
                      <span className="inline-flex rounded-full bg-[#edf3ff] px-2.5 py-1 text-xs font-black text-[var(--primary)]">
                        {statusLabel}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {statusLabel}
                      </span>
                    )}
                  </td>
                  <td className={tableCellClass}>
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
        </TableShell>
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
    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-[var(--muted)]">
        Affichage de {start} à {end} sur {total} alerte{total > 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          aria-label="Page précédente"
          className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[var(--line)] bg-white text-sm font-black ${
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
          }`}
          href={buildPageHref(Math.max(1, page - 1), pageSize)}
        >
          ‹
        </Link>
        <span className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-white">
          {page}
        </span>
        <Link
          aria-label="Page suivante"
          className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[var(--line)] bg-white text-sm font-black ${
            page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
          }`}
          href={buildPageHref(Math.min(totalPages, page + 1), pageSize)}
        >
          ›
        </Link>
        <div className="ml-2 flex items-center gap-2 text-sm font-bold">
          {pageSizeOptions.map((option) => (
            <Link
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                option === pageSize
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--foreground)]"
              }`}
              href={buildPageHref(1, option)}
              key={option}
            >
              {option} / page
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
