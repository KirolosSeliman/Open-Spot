import { updateBookCallRequestAction } from "@/app/admin/call-requests/actions";
import { BusinessNameLink } from "@/components/admin/business-name-link";
import {
  EmptyState,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import type { BookCallRequestRow } from "@/lib/admin/call-requests";
import {
  bookCallRequestStatuses,
  type BookCallRequestStatus
} from "@/lib/book-call/validation";

const statusLabels: Record<BookCallRequestStatus, string> = {
  new: "Nouveau",
  contacted: "Contacte",
  qualified: "Qualifie",
  closed: "Ferme",
  spam: "Spam",
  converted: "Converti"
};

function formatDate(value: string | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function messagePreview(value: string | null) {
  if (!value) {
    return "Aucun message";
  }

  return value.length > 150 ? `${value.slice(0, 147)}...` : value;
}

function contactPhone(request: BookCallRequestRow) {
  return request.phone.replace(/\s+/g, "");
}

function StatusPill({ status }: { status: BookCallRequestStatus }) {
  const tone =
    status === "new"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "qualified"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status === "spam" || status === "closed"
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${tone}`}>
      {statusLabels[status]}
    </span>
  );
}

function QuickActions({ request }: { request: BookCallRequestRow }) {
  const phone = contactPhone(request);
  const smsBody = `Bonjour ${request.full_name.split(" ")[0] || request.full_name}, ici Open Spot. Merci pour votre demande d'appel. Quel moment vous convient pour discuter? Repondez STOP pour vous desinscrire.`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-xs font-black text-white"
        href={`mailto:${request.email}`}
      >
        Email
      </a>
      <a
        className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--foreground)]"
        href={`tel:${phone}`}
      >
        Tel
      </a>
      <a
        className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--foreground)]"
        href={`sms:${phone}?&body=${encodeURIComponent(smsBody)}`}
      >
        SMS
      </a>
    </div>
  );
}

function RequestUpdateForm({ request }: { request: BookCallRequestRow }) {
  return (
    <form action={updateBookCallRequestAction} className="grid min-w-[16rem] gap-2">
      <input name="requestId" type="hidden" value={request.id} />
      <label className="grid gap-1 text-xs font-black text-[var(--muted)]">
        Statut
        <select
          className="min-h-10 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm font-bold text-[var(--foreground)]"
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
      <label className="grid gap-1 text-xs font-black text-[var(--muted)]">
        Note interne
        <textarea
          className="min-h-20 rounded-2xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
          defaultValue={request.internal_notes ?? ""}
          maxLength={2000}
          name="internalNotes"
          placeholder="Disponibilites, qualification, prochaine action..."
        />
      </label>
      <Button className="min-h-9 px-3 text-xs" type="submit">
        Enregistrer
      </Button>
    </form>
  );
}

function RequestSummary({ request }: { request: BookCallRequestRow }) {
  return (
    <div className="grid gap-2 text-sm leading-6 text-[var(--muted)]">
      <p>
        <span className="font-black text-[var(--foreground)]">Commerce:</span>{" "}
        <BusinessNameLink request={request} />
      </p>
      <p>
        <span className="font-black text-[var(--foreground)]">Type:</span>{" "}
        {request.business_type ?? "Non renseigne"}
      </p>
      <p>
        <span className="font-black text-[var(--foreground)]">Systeme:</span>{" "}
        {request.current_booking_system ?? "Non renseigne"}
      </p>
      <p>
        <span className="font-black text-[var(--foreground)]">Annulations:</span>{" "}
        {request.cancellation_volume ?? "Non renseigne"}
      </p>
    </div>
  );
}

function RequestCard({ request }: { request: BookCallRequestRow }) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4 shadow-sm lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{request.full_name}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
            <BusinessNameLink request={request} />
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
        <div>
          <dt className="font-black text-[var(--foreground)]">Date</dt>
          <dd>{formatDate(request.created_at)}</dd>
        </div>
        <div>
          <dt className="font-black text-[var(--foreground)]">Contact</dt>
          <dd>{request.email} / {request.phone}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <RequestSummary request={request} />
      </div>
      <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-[var(--muted)]">
        {messagePreview(request.preferred_time_message)}
      </p>
      <div className="mt-4 grid gap-4">
        <QuickActions request={request} />
        <RequestUpdateForm request={request} />
      </div>
    </article>
  );
}

export function CallRequestsTable({
  requests
}: {
  requests: BookCallRequestRow[];
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        description="Les nouvelles demandes envoyees depuis /book-call/questions apparaitront ici."
        title="Aucune demande d'appel"
      />
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <TableShell>
          <thead>
            <tr>
              <th className={tableHeadClass}>Date</th>
              <th className={tableHeadClass}>Demande</th>
              <th className={tableHeadClass}>Contact</th>
              <th className={tableHeadClass}>Message</th>
              <th className={tableHeadClass}>Actions</th>
              <th className={tableHeadClass}>Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className={tableCellClass}>
                  <p className="min-w-[8rem] text-sm font-bold">
                    {formatDate(request.created_at)}
                  </p>
                </td>
                <td className={tableCellClass}>
                  <div className="min-w-[14rem]">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black">{request.full_name}</p>
                      <StatusPill status={request.status} />
                    </div>
                    <div className="mt-3">
                      <RequestSummary request={request} />
                    </div>
                  </div>
                </td>
                <td className={tableCellClass}>
                  <div className="grid gap-1 text-sm font-semibold">
                    <a className="text-[var(--primary)]" href={`mailto:${request.email}`}>
                      {request.email}
                    </a>
                    <a className="text-[var(--primary)]" href={`tel:${contactPhone(request)}`}>
                      {request.phone}
                    </a>
                    <span className="text-xs text-[var(--muted)]">
                      Consentement SMS/email: {request.consent_sms_email ? "oui" : "non"}
                    </span>
                  </div>
                </td>
                <td className={tableCellClass}>
                  <p className="max-w-sm rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-[var(--muted)]">
                    {messagePreview(request.preferred_time_message)}
                  </p>
                </td>
                <td className={tableCellClass}>
                  <QuickActions request={request} />
                </td>
                <td className={tableCellClass}>
                  <RequestUpdateForm request={request} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <div className="grid gap-3 lg:hidden">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </>
  );
}
