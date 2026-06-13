import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { loadAdminReplyDiagnostics } from "@/lib/admin/reply-diagnostics";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

export default async function AdminOrganizationRepliesPage({
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

  const result = await loadAdminReplyDiagnostics({
    admin: access.admin,
    organizationId: id,
    searchParams: resolvedSearchParams,
    auditAction: "admin.organization.replies_viewed"
  });

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Company replies
          </p>
          <h1 className="mt-2 text-3xl font-black">Reply diagnostics</h1>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black" href={`/admin/organizations/${id}`}>
          Back to company
        </Link>
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.classification} name="classification">
            <option value="all">All classifications</option>
            <option value="opt_out">Opt-out</option>
            <option value="waitlist_positive">Waitlist positive</option>
            <option value="unknown">Unknown</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.linkStatus} name="linkStatus">
            <option value="all">All links</option>
            <option value="linked">Linked</option>
            <option value="unlinked">Unlinked</option>
          </select>
          <input className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4" defaultValue={result.filters.q} name="q" placeholder="Search replies" type="search" />
          <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        <div className="grid gap-3">
          {result.rows.map((row) => (
            <div className="rounded-2xl border border-[var(--line)] p-4" key={`${row.source}-${row.id}`}>
              <p className="font-black">{row.classificationLabel}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {dateFormatter.format(new Date(row.receivedAt))} · {row.customerName ?? "Unknown customer"} · {row.phoneMasked}
              </p>
              <p className="mt-2 text-sm">{row.bodyPreview || "No preview"}</p>
              {row.note ? <p className="mt-2 text-sm font-bold text-amber-800">{row.note}</p> : null}
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
