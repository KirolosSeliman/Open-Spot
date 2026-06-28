import Link from "next/link";

import { AuditFilters } from "@/components/admin/audit/audit-filters";
import { AuditKpiCards } from "@/components/admin/audit/audit-kpi-cards";
import { AuditLogList } from "@/components/admin/audit/audit-log-list";
import { Card } from "@/components/ui/card";
import {
  buildAuditLogQueryString,
  loadPlatformAdminAuditLog
} from "@/lib/admin/audit-log";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

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
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Journal d&apos;audit</h1>
        </div>
        <Card>
          <p className="text-sm text-[var(--muted)]">Accès administrateur requis.</p>
        </Card>
      </section>
    );
  }

  const result = await loadPlatformAdminAuditLog({
    admin: access.admin,
    searchParams: resolvedSearchParams
  });
  const queryString = buildAuditLogQueryString(result.filters, result.page);
  const refreshHref = queryString ? `/admin/audit?${queryString}` : "/admin/audit";

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#0b1328]">
            Journal d&apos;audit
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657492]">
            Historique sécurisé des actions importantes effectuées dans la
            plateforme.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e3eaf5] bg-white px-5 text-sm font-semibold text-[#0b1328] transition hover:bg-[#f8fbff]"
          href={refreshHref}
        >
          Rafraîchir
        </Link>
      </div>

      <AuditKpiCards stats={result.stats} />
      <AuditFilters filters={result.filters} rangeLabel={result.rangeLabel} />
      <AuditLogList
        filters={result.filters}
        hasNextPage={result.hasNextPage}
        page={result.page}
        rows={result.rows}
      />
    </section>
  );
}
