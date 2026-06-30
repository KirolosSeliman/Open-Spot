import Link from "next/link";

import { updateBookCallRequestDetailAction } from "@/app/admin/call-requests/[requestId]/actions";
import { CallRequestConversionCard } from "@/components/admin/call-request-conversion-card";
import { Button, ButtonLink } from "@/components/ui/button";
import type { BookCallRequestRow } from "@/lib/book-call/conversion-types";
import { isConversionComplete } from "@/lib/book-call/conversion-types";
import {
  bookCallRequestStatuses,
  type BookCallRequestStatus
} from "@/lib/book-call/validation";

const statusLabels: Record<BookCallRequestStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  closed: "Fermé",
  spam: "Spam",
  converted: "Converti"
};

function formatDate(value: string | null) {
  if (!value) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function contactPhone(request: BookCallRequestRow) {
  return request.phone.replace(/\s+/g, "");
}

function StatusPill({ status }: { status: BookCallRequestStatus }) {
  const tone =
    status === "converted"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "new"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "qualified"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : status === "spam" || status === "closed"
            ? "border-slate-200 bg-slate-50 text-slate-600"
            : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${tone}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

function QuickActions({ request }: { request: BookCallRequestRow }) {
  const phone = contactPhone(request);
  const smsBody = `Bonjour ${request.full_name.split(" ")[0] || request.full_name}, ici Open Spot. Merci pour votre demande d'appel. Quel moment vous convient pour discuter ? Répondez STOP pour vous désinscrire.`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-xs font-black text-white"
        href={`mailto:${request.email}`}
      >
        Courriel
      </a>
      <a
        className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--foreground)]"
        href={`tel:${phone}`}
      >
        Tél.
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

export function CallRequestDetailView({
  request,
  notice,
  errorMessage
}: {
  request: BookCallRequestRow;
  notice?: string;
  errorMessage?: string;
}) {
  const converted = isConversionComplete(request);
  const displayStatus = (request.status === "converted" || converted
    ? "converted"
    : request.status) as BookCallRequestStatus;

  return (
    <div className="grid gap-6">
      <nav aria-label="Fil d'Ariane" className="text-sm font-semibold text-[var(--muted)]">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link className="text-[var(--primary)] hover:underline" href="/admin">
              Administration
            </Link>
          </li>
          <li aria-hidden="true">→</li>
          <li>
            <Link className="text-[var(--primary)] hover:underline" href="/admin/call-requests">
              Demandes d&apos;appel
            </Link>
          </li>
          <li aria-hidden="true">→</li>
          <li className="font-black text-[var(--foreground)]">{request.business_name}</li>
        </ol>
      </nav>

      <header className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black tracking-tight">{request.business_name}</h1>
              <StatusPill status={displayStatus} />
              {converted ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                  Client officiel
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--muted)]">{request.full_name}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Demande reçue le {formatDate(request.created_at)}
            </p>
          </div>
          <ButtonLink href="/admin/call-requests" variant="outline">
            Retour à la boîte de demandes
          </ButtonLink>
        </div>
      </header>

      {notice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black">Coordonnées</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-black">Nom complet</dt>
                <dd className="mt-1 text-[var(--muted)]">{request.full_name}</dd>
              </div>
              <div>
                <dt className="font-black">Commerce</dt>
                <dd className="mt-1 text-[var(--muted)]">{request.business_name}</dd>
              </div>
              <div>
                <dt className="font-black">Courriel</dt>
                <dd className="mt-1 break-all text-[var(--muted)]">{request.email}</dd>
              </div>
              <div>
                <dt className="font-black">Téléphone</dt>
                <dd className="mt-1 text-[var(--muted)]">{request.phone}</dd>
              </div>
              <div>
                <dt className="font-black">Type de commerce</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {request.business_type ?? "Non renseigné"}
                </dd>
              </div>
            </dl>
            <div className="mt-5">
              <QuickActions request={request} />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black">Besoins du commerce</h2>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="font-black">Système actuellement utilisé</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {request.current_booking_system ?? "Non renseigné"}
                </dd>
              </div>
              <div>
                <dt className="font-black">Annulations par semaine</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {request.cancellation_volume ?? "Non renseigné"}
                </dd>
              </div>
              <div>
                <dt className="font-black">Message initial</dt>
                <dd className="mt-1 rounded-2xl bg-slate-50 p-4 leading-6 text-[var(--muted)]">
                  {request.preferred_time_message ?? "Aucun message"}
                </dd>
              </div>
              <div>
                <dt className="font-black">Source</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {request.source_path}
                  {request.source_url ? ` — ${request.source_url}` : ""}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black">Consentement</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="font-black">Consentement SMS/courriel (prise de contact)</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {request.consent_sms_email ? "Oui" : "Non"}
                </dd>
              </div>
              <div>
                <dt className="font-black">Note</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  Ce consentement couvre le suivi manuel de la demande d&apos;appel, pas le
                  marketing SMS automatisé.
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black">Suivi interne</h2>
            <form action={updateBookCallRequestDetailAction} className="mt-4 grid gap-4">
              <input name="requestId" type="hidden" value={request.id} />
              <label className="grid gap-2 text-sm">
                <span className="font-black text-[var(--muted)]">Statut</span>
                <select
                  className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
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
              <label className="grid gap-2 text-sm">
                <span className="font-black text-[var(--muted)]">Note interne</span>
                <textarea
                  className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold"
                  defaultValue={request.internal_notes ?? ""}
                  maxLength={2000}
                  name="internalNotes"
                  placeholder="Disponibilités, qualification, prochaine action..."
                />
              </label>
              <Button type="submit">Enregistrer</Button>
              <p className="text-xs text-[var(--muted)]">
                Dernière modification : {formatDate(request.updated_at)}
              </p>
            </form>
          </section>

          <CallRequestConversionCard request={request} />
        </div>
      </div>
    </div>
  );
}
