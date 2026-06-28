import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  buildAuditLogQueryString,
  type AuditLogFilters,
  type EnrichedPlatformAdminAuditLogRow
} from "@/lib/admin/audit-log";
import {
  getAuditCategoryLabel,
  getAuditImportanceLabel,
  maskAuditEntityId,
  sanitizeAuditMetadataForDisplay,
  type AuditCategory,
  type AuditImportance
} from "@/lib/admin/audit-formatting";
import { cn } from "@/lib/utils/cn";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "long",
  timeStyle: "short"
});

const categoryBadgeClasses: Record<AuditCategory, string> = {
  sms: "border-blue-200 bg-blue-50 text-blue-700",
  company: "border-emerald-200 bg-emerald-50 text-emerald-700",
  billing: "border-violet-200 bg-violet-50 text-violet-700",
  compliance: "border-amber-200 bg-amber-50 text-amber-800",
  client: "border-cyan-200 bg-cyan-50 text-cyan-700",
  security: "border-red-200 bg-red-50 text-red-700",
  system: "border-slate-200 bg-slate-50 text-slate-700",
  view: "border-slate-200 bg-slate-100 text-slate-600",
  other: "border-slate-200 bg-white text-slate-700"
};

const importanceBadgeClasses: Record<AuditImportance, string> = {
  critical: "border-orange-200 bg-orange-50 text-orange-800",
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  view: "border-slate-200 bg-slate-100 text-slate-600"
};

const categoryInitials: Record<AuditCategory, string> = {
  sms: "SM",
  company: "CO",
  billing: "BI",
  compliance: "CF",
  client: "CL",
  security: "SE",
  system: "SY",
  view: "VI",
  other: "AU"
};

const categoryAccentClasses: Record<AuditCategory, string> = {
  sms: "bg-[#eef4ff] text-[#2563ff]",
  company: "bg-[#ecfdf5] text-[#059669]",
  billing: "bg-[#f5f3ff] text-[#7c3aed]",
  compliance: "bg-[#fff7ed] text-[#d97706]",
  client: "bg-[#ecfeff] text-[#0891b2]",
  security: "bg-[#fef2f2] text-[#dc2626]",
  system: "bg-[#f8fafc] text-[#475569]",
  view: "bg-[#f1f5f9] text-[#64748b]",
  other: "bg-[#f8fafc] text-[#64748b]"
};

function AuditLogEntry({ row }: { row: EnrichedPlatformAdminAuditLogRow }) {
  const sanitizedMetadata = sanitizeAuditMetadataForDisplay(row.metadata);
  const metadataText = JSON.stringify(sanitizedMetadata, null, 2);

  return (
    <details className="group rounded-[18px] border border-[#e3eaf5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              aria-hidden="true"
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-wide",
                categoryAccentClasses[row.category]
              )}
            >
              {categoryInitials[row.category]}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0b1328]">{row.label}</h3>
                <Badge className={categoryBadgeClasses[row.category]}>
                  {getAuditCategoryLabel(row.category)}
                </Badge>
                <Badge className={importanceBadgeClasses[row.importance]}>
                  {getAuditImportanceLabel(row.importance)}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[#657492]">
                {row.admin_email ?? "Admin inconnu"} ·{" "}
                <time dateTime={row.created_at}>
                  {dateFormatter.format(new Date(row.created_at))}
                </time>
              </p>
              <p className="mt-1 text-xs text-[#94a3b8]">
                Organisation{" "}
                {row.organization_id
                  ? maskAuditEntityId(row.organization_id)
                  : "Global"}
                {" · "}
                {row.entity_type ?? "entité"} · {maskAuditEntityId(row.entity_id)}
              </p>
              <p className="mt-2 font-mono text-[11px] text-[#cbd5e1]">{row.action}</p>
            </div>
          </div>
          <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#e3eaf5] px-4 text-xs font-semibold text-[#2563ff] transition group-open:bg-[#eef4ff]">
            Détails
          </span>
        </div>
      </summary>

      <div className="border-t border-[#edf2f9] px-4 pb-4 pt-3">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Action brute
            </dt>
            <dd className="mt-1 break-all font-mono text-[#475569]">{row.action}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Admin
            </dt>
            <dd className="mt-1 break-all text-[#0b1328]">
              {row.admin_email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Organization ID
            </dt>
            <dd className="mt-1 break-all font-mono text-[#475569]">
              {row.organization_id ?? "Global"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Entity type
            </dt>
            <dd className="mt-1 break-all text-[#0b1328]">{row.entity_type ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Entity ID
            </dt>
            <dd className="mt-1 break-all font-mono text-[#475569]">
              {row.entity_id ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
              Created at
            </dt>
            <dd className="mt-1 text-[#0b1328]">
              <time dateTime={row.created_at}>
                {dateFormatter.format(new Date(row.created_at))}
              </time>
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
            Metadata
          </p>
          <pre className="mt-2 max-h-56 overflow-auto rounded-xl border border-[#edf2f9] bg-[#f8fbff] p-3 text-xs leading-5 text-[#475569]">
            {metadataText}
          </pre>
        </div>
      </div>
    </details>
  );
}

export function AuditLogList({
  rows,
  page,
  hasNextPage,
  filters
}: {
  rows: EnrichedPlatformAdminAuditLogRow[];
  page: number;
  hasNextPage: boolean;
  filters: AuditLogFilters;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.05rem] font-bold tracking-tight text-[#0b1328]">
          Liste des événements
        </h2>
        <p className="text-sm text-[#657492]">
          {rows.length === 0
            ? "Aucun événement"
            : `${rows.length} événement${rows.length > 1 ? "s" : ""} sur cette page`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#dbe4f0] bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-[#0b1328]">Aucun événement trouvé</p>
          <p className="mt-2 text-sm text-[#657492]">
            Essayez d&apos;élargir la période ou d&apos;afficher les consultations.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <AuditLogEntry key={row.id} row={row} />
          ))}
        </div>
      )}

      {(page > 1 || hasNextPage) && (
        <div className="flex flex-wrap gap-2">
          {page > 1 ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e3eaf5] bg-white px-4 text-sm font-semibold text-[#0b1328] transition hover:bg-[#f8fbff]"
              href={`/admin/audit?${buildAuditLogQueryString(filters, page - 1)}`}
            >
              Précédent
            </Link>
          ) : null}
          {hasNextPage ? (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e3eaf5] bg-white px-4 text-sm font-semibold text-[#0b1328] transition hover:bg-[#f8fbff]"
              href={`/admin/audit?${buildAuditLogQueryString(filters, page + 1)}`}
            >
              Suivant
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
