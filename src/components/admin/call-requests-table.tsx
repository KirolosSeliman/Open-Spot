import Link from "next/link";

import { updateBookCallRequestAction } from "@/app/admin/call-requests/actions";
import { BusinessNameLink } from "@/components/admin/business-name-link";
import {
  ChevronRightIcon,
  MailIcon,
  PhoneIcon
} from "@/components/admin/call-requests/call-requests-icons";
import type { BookCallRequestRow } from "@/lib/admin/call-requests";
import {
  bookCallRequestStatuses,
  type BookCallRequestStatus
} from "@/lib/book-call/validation";
import { cn } from "@/lib/utils/cn";

const statusLabels: Record<BookCallRequestStatus, string> = {
  new: "Nouveau",
  contacted: "Contactée",
  qualified: "Qualifiée",
  closed: "Fermée",
  spam: "Spam",
  converted: "Converti"
};

const statusStyles: Record<
  BookCallRequestStatus,
  { badge: string; dot: string; select: string }
> = {
  new: {
    badge: "bg-[#eef5ff] text-[#2563ff]",
    dot: "bg-[#2563ff]",
    select: "text-[#2563ff]"
  },
  contacted: {
    badge: "bg-[#fff7ed] text-[#ea580c]",
    dot: "bg-[#f59e0b]",
    select: "text-[#ea580c]"
  },
  qualified: {
    badge: "bg-[#ecfdf5] text-[#16a34a]",
    dot: "bg-[#16a34a]",
    select: "text-[#16a34a]"
  },
  converted: {
    badge: "bg-[#ecfdf5] text-[#16a34a]",
    dot: "bg-[#16a34a]",
    select: "text-[#16a34a]"
  },
  closed: {
    badge: "bg-[#f1f5f9] text-[#64748b]",
    dot: "bg-[#94a3b8]",
    select: "text-[#64748b]"
  },
  spam: {
    badge: "bg-[#fef2f2] text-[#dc2626]",
    dot: "bg-[#dc2626]",
    select: "text-[#dc2626]"
  }
};

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("fr-CA", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

function formatRequestDate(value: string | null) {
  if (!value) {
    return { date: "Non renseigné", time: "" };
  }

  const parsed = new Date(value);

  return {
    date: dateFormatter.format(parsed),
    time: timeFormatter.format(parsed)
  };
}

function messagePreview(value: string | null) {
  if (!value?.trim()) {
    return "Aucun message";
  }

  return value.length > 150 ? `${value.slice(0, 147)}...` : value;
}

function contactPhone(request: BookCallRequestRow) {
  return request.phone.replace(/\s+/g, "");
}

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : "Non renseigné";
}

function StatusBadge({ status }: { status: BookCallRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        statusStyles[status].badge
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function ContactActions({ request }: { request: BookCallRequestRow }) {
  const phone = contactPhone(request);
  const emailDisabled = !request.email?.trim();
  const phoneDisabled = !phone;

  return (
    <div className="flex flex-col gap-1">
      {emailDisabled ? (
        <span
          aria-disabled="true"
          className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-[#e3eaf5] bg-[#f8fafc] px-2 text-[10px] font-semibold text-[#94a3b8]"
        >
          <MailIcon className="h-3 w-3" />
          Courriel
        </span>
      ) : (
        <a
          className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-[#e3eaf5] bg-white px-2 text-[10px] font-semibold text-[#0b1328] transition hover:border-[#2563ff]/30 hover:bg-[#eef5ff] hover:text-[#2563ff]"
          href={`mailto:${request.email}`}
        >
          <MailIcon className="h-3 w-3" />
          Courriel
        </a>
      )}
      {phoneDisabled ? (
        <span
          aria-disabled="true"
          className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-[#e3eaf5] bg-[#f8fafc] px-2 text-[10px] font-semibold text-[#94a3b8]"
        >
          <PhoneIcon className="h-3 w-3" />
          Tél.
        </span>
      ) : (
        <a
          className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-[#e3eaf5] bg-white px-2 text-[10px] font-semibold text-[#0b1328] transition hover:border-[#2563ff]/30 hover:bg-[#eef5ff] hover:text-[#2563ff]"
          href={`tel:${phone}`}
        >
          <PhoneIcon className="h-3 w-3" />
          Tél.
        </a>
      )}
    </div>
  );
}

function RequestRowForm({ request }: { request: BookCallRequestRow }) {
  const styles = statusStyles[request.status];

  return (
    <form action={updateBookCallRequestAction} className="contents">
      <input name="requestId" type="hidden" value={request.id} />

      <td className="px-2 py-2.5 align-top xl:px-3 xl:py-3">
        <label className="sr-only" htmlFor={`status-${request.id}`}>
          Statut pour {request.full_name}
        </label>
        <div className="relative w-full min-w-0">
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
              styles.dot
            )}
          />
          <select
            className={cn(
              "h-8 w-full min-w-0 appearance-none rounded-full border border-[#e3eaf5] bg-white pl-6 pr-7 text-[11px] font-semibold outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10",
              styles.select
            )}
            defaultValue={request.status}
            id={`status-${request.id}`}
            name="status"
          >
            {bookCallRequestStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <ChevronRightIcon className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-[#94a3b8]" />
        </div>
      </td>

      <td className="px-2 py-2.5 align-top xl:px-3 xl:py-3">
        <label className="sr-only" htmlFor={`notes-${request.id}`}>
          Note interne pour {request.full_name}
        </label>
        <textarea
          className="min-h-[44px] w-full min-w-0 resize-none rounded-[8px] border border-[#e3eaf5] bg-white px-2 py-1.5 text-[11px] leading-4 text-[#0b1328] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10"
          defaultValue={request.internal_notes ?? ""}
          id={`notes-${request.id}`}
          maxLength={2000}
          name="internalNotes"
          placeholder="Disponibilités, qualification, prochaine action..."
          rows={2}
        />
      </td>

      <td className="px-2 py-2.5 align-top xl:px-3 xl:py-3">
        <div className="flex w-full min-w-0 flex-col gap-1.5">
          <button
            className="inline-flex h-8 w-full items-center justify-center rounded-full border border-[#2563ff]/25 bg-white px-2 text-[11px] font-semibold text-[#2563ff] transition hover:bg-[#eef5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
            type="submit"
          >
            Enregistrer
          </button>
          <Link
            className="inline-flex h-7 w-full items-center justify-center gap-0.5 text-[11px] font-semibold text-[#64748b] transition hover:text-[#2563ff]"
            href={`/admin/call-requests/${request.id}`}
          >
            Plus de détails
            <ChevronRightIcon className="h-3 w-3" />
          </Link>
        </div>
      </td>
    </form>
  );
}

function RequestSummary({ request }: { request: BookCallRequestRow }) {
  return (
    <div className="mt-1.5 space-y-0.5 text-[11px] leading-4 text-[#64748b]">
      <p className="break-words">
        <span className="font-semibold text-[#0b1328]">Commerce:</span>{" "}
        <BusinessNameLink request={request} />
      </p>
      <p className="break-words">
        <span className="font-semibold text-[#0b1328]">Type:</span>{" "}
        {displayValue(request.business_type)}
      </p>
      <p className="break-words">
        <span className="font-semibold text-[#0b1328]">Système:</span>{" "}
        {displayValue(request.current_booking_system)}
      </p>
      <p className="break-words">
        <span className="font-semibold text-[#0b1328]">Annulations:</span>{" "}
        {displayValue(request.cancellation_volume)}
      </p>
    </div>
  );
}

function RequestCard({ request }: { request: BookCallRequestRow }) {
  const { date, time } = formatRequestDate(request.created_at);

  return (
    <article className="rounded-[20px] border border-[#e3eaf5] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wide text-[#0b1328]">
            {request.full_name}
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">
            {date}
            {time ? ` · ${time}` : ""}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <RequestSummary request={request} />

      <div className="mt-3 grid gap-1 text-sm">
        <a className="font-medium text-[#2563ff]" href={`mailto:${request.email}`}>
          {request.email}
        </a>
        <a className="font-medium text-[#2563ff]" href={`tel:${contactPhone(request)}`}>
          {request.phone}
        </a>
        <p className="text-xs text-[#64748b]">
          Consentement SMS/courriel : {request.consent_sms_email ? "oui" : "non"}
        </p>
      </div>

      <p
        className="mt-3 rounded-[10px] bg-[#f8fbff] px-3 py-2 text-xs leading-5 text-[#64748b]"
        title={request.preferred_time_message ?? undefined}
      >
        {messagePreview(request.preferred_time_message)}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <ContactActions request={request} />
      </div>

      <form action={updateBookCallRequestAction} className="mt-4 grid gap-3">
        <input name="requestId" type="hidden" value={request.id} />
        <label className="grid gap-1.5 text-xs font-semibold text-[#64748b]">
          Statut
          <select
            className="h-10 rounded-xl border border-[#e3eaf5] bg-white px-3 text-sm font-medium text-[#0b1328]"
            defaultValue={request.status}
            name="status"
          >
            {bookCallRequestStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-[#64748b]">
          Note interne
          <textarea
            className="min-h-[64px] rounded-[10px] border border-[#e3eaf5] bg-white px-3 py-2 text-sm text-[#0b1328]"
            defaultValue={request.internal_notes ?? ""}
            maxLength={2000}
            name="internalNotes"
            placeholder="Disponibilités, qualification, prochaine action..."
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#2563ff]/25 px-4 text-sm font-semibold text-[#2563ff]"
            type="submit"
          >
            Enregistrer
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center gap-1 px-2 text-sm font-semibold text-[#64748b]"
            href={`/admin/call-requests/${request.id}`}
          >
            Plus de détails
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </form>
    </article>
  );
}

const tableHeadClass =
  "sticky top-0 z-10 bg-[#f8fbff] px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b] xl:px-3 xl:py-2.5 xl:text-[11px]";

const tableCellClass =
  "px-2 py-2.5 align-top text-[#0b1328] xl:px-3 xl:py-3";

export function CallRequestsTable({
  requests
}: {
  requests: BookCallRequestRow[];
}) {
  if (requests.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-[#e3eaf5] bg-[#f8fbff] px-6 py-10 text-center">
        <div>
          <h3 className="text-base font-bold text-[#0b1328]">
            Aucune demande d&apos;appel
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748b]">
            Les nouvelles demandes envoyées depuis /book-call/questions apparaîtront
            ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden h-full min-h-0 xl:block">
        <div className="h-full min-h-0 overflow-auto rounded-[16px] border border-[#e3eaf5] [scrollbar-color:#cbd5e1_#f8fbff] [scrollbar-width:thin]">
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[21%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[7%]" />
              <col className="w-[11%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#e3eaf5]">
                <th className={tableHeadClass}>Date</th>
                <th className={tableHeadClass}>Demande</th>
                <th className={tableHeadClass}>Contact</th>
                <th className={tableHeadClass}>Message</th>
                <th className={tableHeadClass}>Actions</th>
                <th className={tableHeadClass}>Statut</th>
                <th className={tableHeadClass}>Note interne</th>
                <th className={tableHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3eaf5] bg-white">
              {requests.map((request) => {
                const { date, time } = formatRequestDate(request.created_at);

                return (
                  <tr key={request.id} className="group">
                    <td className={tableCellClass}>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold leading-4 text-[#0b1328] xl:text-xs">
                          {date}
                        </p>
                        {time ? (
                          <p className="mt-0.5 text-[10px] text-[#64748b] xl:text-[11px]">
                            {time}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#0b1328]">
                            {request.full_name}
                          </p>
                          <StatusBadge status={request.status} />
                        </div>
                        <RequestSummary request={request} />
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <div className="grid min-w-0 gap-0.5 text-[11px] xl:text-xs">
                        <a
                          className="truncate font-medium text-[#2563ff] hover:underline"
                          href={`mailto:${request.email}`}
                          title={request.email}
                        >
                          {request.email}
                        </a>
                        <a
                          className="truncate font-medium text-[#2563ff] hover:underline"
                          href={`tel:${contactPhone(request)}`}
                          title={request.phone}
                        >
                          {request.phone}
                        </a>
                        <span className="text-[10px] leading-4 text-[#64748b] xl:text-[11px]">
                          Consentement SMS/courriel :{" "}
                          {request.consent_sms_email ? "oui" : "non"}
                        </span>
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <p
                        className="line-clamp-3 rounded-[8px] bg-[#f8fbff] px-2 py-1.5 text-[10px] leading-4 text-[#64748b] xl:text-[11px] xl:leading-5"
                        title={request.preferred_time_message ?? undefined}
                      >
                        {messagePreview(request.preferred_time_message)}
                      </p>
                    </td>
                    <td className={tableCellClass}>
                      <ContactActions request={request} />
                    </td>
                    <RequestRowForm request={request} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-full min-h-0 overflow-auto xl:hidden">
        <div className="grid gap-3 pb-1">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      </div>
    </>
  );
}
