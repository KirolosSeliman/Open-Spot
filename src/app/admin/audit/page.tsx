import Link from "next/link";

import { Card } from "@/components/ui/card";
import { loadPlatformAdminAuditLog } from "@/lib/admin/audit-log";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

export default async function AdminAuditPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    return (
      <section className="grid gap-6">
        <h1 className="text-3xl font-black">Audit</h1>
        <Card>
          <p className="text-sm text-[var(--muted)]">Admin access required.</p>
        </Card>
      </section>
    );
  }

  const result = await loadPlatformAdminAuditLog({
    admin: access.admin,
    searchParams: resolvedSearchParams
  });

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">Audit log</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Read-only platform admin audit trail.
        </p>
      </div>

      <Card>
        <div className="grid gap-3">
          {result.rows.map((row) => (
            <div className="rounded-2xl border border-[var(--line)] p-4" key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{row.action}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {row.admin_email} · {dateFormatter.format(new Date(row.created_at))}
                  </p>
                </div>
                <p className="max-w-xs break-all text-xs font-mono text-[var(--muted)]">
                  {row.organization_id ?? "global"}
                </p>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {row.entity_type ?? "entity"} · {row.entity_id ?? "—"}
              </p>
              <pre className="mt-3 max-h-28 overflow-auto rounded-2xl bg-[#f7f5ef] p-3 text-xs text-[var(--muted)]">
                {JSON.stringify(row.metadata, null, 2).slice(0, 1000)}
              </pre>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          {result.page > 1 ? (
            <Link className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black" href={`/admin/audit?page=${result.page - 1}`}>
              Previous
            </Link>
          ) : null}
          {result.hasNextPage ? (
            <Link className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black" href={`/admin/audit?page=${result.page + 1}`}>
              Next
            </Link>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
