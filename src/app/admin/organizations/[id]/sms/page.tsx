import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { loadAdminSmsDiagnostics } from "@/lib/admin/sms-diagnostics";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

export default async function AdminOrganizationSmsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    notFound();
  }

  const result = await loadAdminSmsDiagnostics({
    admin: access.admin,
    organizationId: id,
    searchParams: resolvedSearchParams,
    auditAction: "admin.organization.sms_viewed"
  });

  const organizationName = result.rows[0]?.organizationName ?? "Company";

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Company SMS
          </p>
          <h1 className="mt-2 text-3xl font-black">{organizationName}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            SMS diagnostics scoped to this company.
          </p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black" href={`/admin/organizations/${id}`}>
          Back to company
        </Link>
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.direction} name="direction">
            <option value="all">All directions</option>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.status} name="status">
            <option value="all">All statuses</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="undelivered">Undelivered</option>
            <option value="received">Received</option>
          </select>
          <input className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4" defaultValue={result.filters.q} name="q" placeholder="Search SMS" type="search" />
          <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        <p className="text-sm font-bold text-[var(--muted)]">
          Showing {result.rows.length} records.
        </p>
        <div className="mt-4 grid gap-3">
          {result.rows.map((row) => (
            <div className="rounded-2xl border border-[var(--line)] p-4" key={row.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black">{dateFormatter.format(new Date(row.createdAt))}</p>
                <p className="text-sm font-bold text-[var(--muted)]">
                  {row.direction} · {row.provider} · {row.status}
                </p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {row.customerName ?? "Unknown customer"} · {row.phoneMasked} · {row.context}
              </p>
              <p className="mt-2 text-sm">{row.bodyPreview}</p>
              {row.error ? <p className="mt-2 text-xs text-red-700">{row.error}</p> : null}
            </div>
          ))}
          {result.rows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No SMS records match these filters.</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
