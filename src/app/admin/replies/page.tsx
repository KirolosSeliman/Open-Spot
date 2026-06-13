import Link from "next/link";

import { Card } from "@/components/ui/card";
import { loadAdminReplyDiagnostics } from "@/lib/admin/reply-diagnostics";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

export default async function AdminRepliesPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    return (
      <section className="grid gap-6">
        <h1 className="text-3xl font-black">Reply diagnostics</h1>
        <Card>
          <p className="text-sm text-[var(--muted)]">
            {access.status === "unconfigured" ? access.message : "Admin access required."}
          </p>
        </Card>
      </section>
    );
  }

  const result = await loadAdminReplyDiagnostics({
    admin: access.admin,
    searchParams: resolvedSearchParams
  });

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">Reply diagnostics</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Linked and unlinked inbound replies. Positive waitlist replies remain
          merchant-validation only.
        </p>
      </div>

      <Card>
        <form className="grid gap-3 lg:grid-cols-6" method="get">
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.classification} name="classification">
            <option value="all">All classifications</option>
            <option value="opt_out">Opt-out</option>
            <option value="appointment_confirm">Appointment confirmed</option>
            <option value="appointment_cancel">Appointment cancelled</option>
            <option value="waitlist_positive">Waitlist positive</option>
            <option value="unknown">Unknown</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.linkStatus} name="linkStatus">
            <option value="all">All link statuses</option>
            <option value="linked">Linked</option>
            <option value="unlinked">Unlinked</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.context} name="context">
            <option value="all">All contexts</option>
            <option value="opening">Opening</option>
            <option value="appointment">Appointment</option>
            <option value="unknown">Unknown</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.provider} name="provider">
            <option value="all">All providers</option>
            <option value="twilio">Twilio</option>
            <option value="simulator">Simulator</option>
          </select>
          <input className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 lg:col-span-2" defaultValue={result.filters.q} name="q" placeholder="Company, phone, SMS body" type="search" />
          <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
            Filter
          </button>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black" href="/admin/replies">
            Reset
          </Link>
        </form>
      </Card>

      <Card>
        <p className="text-sm font-bold text-[var(--muted)]">
          Showing {result.rows.length} replies.
        </p>
        <div className="mt-5 grid gap-3">
          {result.rows.map((row) => (
            <div className="rounded-2xl border border-[var(--line)] bg-white p-4" key={`${row.source}-${row.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{row.classificationLabel}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {dateFormatter.format(new Date(row.receivedAt))} · {row.context} · {row.linkStatus}
                  </p>
                </div>
                {row.organizationId ? (
                  <Link className="text-sm font-black underline-offset-4 hover:underline" href={`/admin/organizations/${row.organizationId}/replies`}>
                    {row.organizationName}
                  </Link>
                ) : (
                  <span className="text-sm font-bold text-[var(--muted)]">No company</span>
                )}
              </div>
              <p className="mt-3 text-sm">
                {row.customerName ?? "Unknown customer"} · {row.phoneMasked}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{row.bodyPreview || "No body preview"}</p>
              {row.note ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  {row.note}
                </p>
              ) : null}
            </div>
          ))}
          {result.rows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No replies match these filters.</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
