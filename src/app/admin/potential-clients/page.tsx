import Link from "next/link";

import { PotentialClientCopyButton } from "@/components/admin/potential-client-copy-button";
import {
  DashboardPageHeader,
  EmptyState,
  MetricCard,
  Panel,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  archivePotentialClientAction,
  markPotentialClientContactedAction,
  updatePotentialClientAction
} from "@/lib/potential-clients/actions";
import {
  loadPotentialClients,
  type PotentialClientRow
} from "@/lib/potential-clients/data";
import { potentialClientStatuses } from "@/lib/potential-clients/validation";

type PotentialClientsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const statusLabels: Record<PotentialClientRow["status"], string> = {
  new: "New",
  contacted: "Contacted",
  call_booked: "Call booked",
  qualified: "Qualified",
  not_a_fit: "Not a fit",
  won: "Won",
  lost: "Lost",
  archived: "Archived"
};

function firstParam(
  value: string | string[] | undefined,
  fallback = ""
) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function smsHref(lead: PotentialClientRow) {
  const number = lead.phone_normalized ?? lead.phone;
  const firstName = lead.full_name.split(" ")[0] || lead.full_name;
  const body = `Hi ${firstName}, this is Open Spot. Thanks for requesting a call. What time works best for a quick 15-minute chat? Reply STOP to opt out.`;

  return `sms:${number}?&body=${encodeURIComponent(body)}`;
}

function emailHref(lead: PotentialClientRow) {
  const subject = "Your Open Spot call request";
  const body = [
    `Hi ${lead.full_name.split(" ")[0] || lead.full_name},`,
    "",
    "Thanks for requesting a call with Open Spot. What time works best for a quick 15-minute chat?",
    "",
    "Reply STOP to opt out."
  ].join("\n");

  return `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function StatusPill({ status }: { status: PotentialClientRow["status"] }) {
  const tone =
    status === "new"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "won"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status === "archived" || status === "lost" || status === "not_a_fit"
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${tone}`}>
      {statusLabels[status]}
    </span>
  );
}

function LeadActions({ lead }: { lead: PotentialClientRow }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-xs font-black text-white"
          href={smsHref(lead)}
        >
          Text
        </Link>
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--line)] bg-white px-3 text-xs font-black text-[var(--foreground)]"
          href={emailHref(lead)}
        >
          Email
        </Link>
        <PotentialClientCopyButton label="Copy phone" value={lead.phone_normalized ?? lead.phone} />
        <PotentialClientCopyButton label="Copy email" value={lead.email} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <form action={markPotentialClientContactedAction} className="flex gap-2">
          <input name="leadId" type="hidden" value={lead.id} />
          <input name="channel" type="hidden" value="sms" />
          <Button className="min-h-9 w-full px-3 text-xs" type="submit" variant="secondary">
            Mark SMS sent
          </Button>
        </form>
        <form action={markPotentialClientContactedAction} className="flex gap-2">
          <input name="leadId" type="hidden" value={lead.id} />
          <input name="channel" type="hidden" value="email" />
          <Button className="min-h-9 w-full px-3 text-xs" type="submit" variant="outline">
            Mark email sent
          </Button>
        </form>
      </div>
    </div>
  );
}

function LeadUpdateForm({ lead }: { lead: PotentialClientRow }) {
  return (
    <form action={updatePotentialClientAction} className="grid min-w-[18rem] gap-2">
      <input name="leadId" type="hidden" value={lead.id} />
      <label className="grid gap-1 text-xs font-black text-[var(--muted)]">
        Status
        <select
          className="min-h-10 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm font-bold text-[var(--foreground)]"
          defaultValue={lead.status}
          name="status"
        >
          {potentialClientStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-black text-[var(--muted)]">
        Notes
        <textarea
          className="min-h-20 rounded-2xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
          defaultValue={lead.notes ?? ""}
          maxLength={2000}
          name="notes"
          placeholder="Fit, timing, plan discussed, objections..."
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-9 px-3 text-xs" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
}

function ArchiveForm({ leadId }: { leadId: string }) {
  return (
    <form action={archivePotentialClientAction}>
      <input name="leadId" type="hidden" value={leadId} />
      <Button className="min-h-9 px-3 text-xs" type="submit" variant="destructive">
        Archive
      </Button>
    </form>
  );
}

function LeadCard({ lead }: { lead: PotentialClientRow }) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4 shadow-sm lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{lead.business_name}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
            {lead.full_name} · {lead.business_type}
          </p>
        </div>
        <StatusPill status={lead.status} />
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
        <div>
          <dt className="font-black text-[var(--foreground)]">Requested</dt>
          <dd>{formatDate(lead.created_at)}</dd>
        </div>
        <div>
          <dt className="font-black text-[var(--foreground)]">Contact</dt>
          <dd>{lead.email} · {lead.phone}</dd>
        </div>
        <div>
          <dt className="font-black text-[var(--foreground)]">Consent</dt>
          <dd>{lead.consent_to_contact ? `Captured ${formatDate(lead.consented_at)}` : "Missing"}</dd>
        </div>
      </dl>
      {lead.message ? (
        <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-[var(--muted)]">
          {lead.message}
        </p>
      ) : null}
      <div className="mt-4 grid gap-4">
        <LeadActions lead={lead} />
        <LeadUpdateForm lead={lead} />
        <ArchiveForm leadId={lead.id} />
      </div>
    </article>
  );
}

export default async function PotentialClientsPage({
  searchParams
}: PotentialClientsPageProps) {
  await requireCurrentPlatformAdmin();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = firstParam(resolvedSearchParams.status, "all");
  const q = firstParam(resolvedSearchParams.q);
  const notice = firstParam(resolvedSearchParams.notice);
  const errorMessage = firstParam(resolvedSearchParams.error);
  const { filteredLeads, stats, error } = await loadPotentialClients({
    q,
    status
  });

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Review businesses that requested a call, follow up by SMS or email, and keep lead status notes auditable for the sales workflow."
        title="Potential Clients"
      />

      {notice ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </p>
      ) : null}
      {errorMessage || error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {errorMessage || error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Fresh request-call submissions" label="New leads" tone="violet" value={String(stats.new)} />
        <MetricCard detail="At least one follow-up logged" label="Contacted" value={String(stats.contacted)} />
        <MetricCard detail="Discovery calls scheduled" label="Call booked" tone="amber" value={String(stats.callBooked)} />
        <MetricCard detail="Closed Open Spot customers" label="Won" tone="green" value={String(stats.won)} />
      </div>

      <Panel
        description="Use filters to keep follow-up focused. Text links include the required opt-out wording: Reply STOP to opt out."
        title="Lead inbox"
      >
        <form className="mb-5 grid gap-3 md:grid-cols-[1fr_14rem_auto]" method="get">
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-semibold"
            defaultValue={q}
            name="q"
            placeholder="Search name, business, email, phone, type..."
          />
          <select
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
            defaultValue={status}
            name="status"
          >
            <option value="all">All statuses</option>
            {potentialClientStatuses.map((leadStatus) => (
              <option key={leadStatus} value={leadStatus}>
                {statusLabels[leadStatus]}
              </option>
            ))}
          </select>
          <Button type="submit">Filter</Button>
        </form>

        {filteredLeads.length === 0 ? (
          <EmptyState
            description="New request-call submissions will appear here after the public form is submitted."
            title="No potential clients match this view"
          />
        ) : (
          <>
            <div className="hidden lg:block">
              <TableShell>
                <thead>
                  <tr>
                    <th className={tableHeadClass}>Lead</th>
                    <th className={tableHeadClass}>Contact</th>
                    <th className={tableHeadClass}>Consent</th>
                    <th className={tableHeadClass}>Follow-up</th>
                    <th className={tableHeadClass}>Status and notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className={tableCellClass}>
                        <div className="min-w-[13rem]">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black">{lead.business_name}</p>
                            <StatusPill status={lead.status} />
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                            {lead.full_name} · {lead.business_type}
                          </p>
                          <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                            Requested {formatDate(lead.created_at)}
                          </p>
                          {lead.message ? (
                            <p className="mt-3 max-w-sm rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-[var(--muted)]">
                              {lead.message}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className={tableCellClass}>
                        <div className="grid gap-1 text-sm font-semibold">
                          <a className="text-[var(--primary)]" href={`mailto:${lead.email}`}>
                            {lead.email}
                          </a>
                          <a className="text-[var(--primary)]" href={`tel:${lead.phone_normalized ?? lead.phone}`}>
                            {lead.phone}
                          </a>
                          <span className="text-xs text-[var(--muted)]">
                            Prefers {lead.preferred_contact_method}
                          </span>
                        </div>
                      </td>
                      <td className={tableCellClass}>
                        <div className="max-w-[12rem] text-sm leading-6 text-[var(--muted)]">
                          <p className="font-black text-[var(--foreground)]">
                            {lead.consent_to_contact ? "Consent captured" : "Consent missing"}
                          </p>
                          <p>{formatDate(lead.consented_at)}</p>
                          <p className="mt-2 text-xs">{lead.consent_text}</p>
                        </div>
                      </td>
                      <td className={tableCellClass}>
                        <LeadActions lead={lead} />
                        <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                          Last contacted: {formatDate(lead.last_contacted_at)}
                        </p>
                      </td>
                      <td className={tableCellClass}>
                        <div className="grid gap-3">
                          <LeadUpdateForm lead={lead} />
                          <ArchiveForm leadId={lead.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
