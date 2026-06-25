import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { ImportExportPanel } from "@/components/import/import-export-panel";
import Link from "next/link";
import {
  confirmCustomerCsvImportAction,
} from "@/lib/import/actions";
import {
  mapCsvToCustomerImportRows,
  validateCustomerImportRows
} from "@/lib/import/customer-import";

type ImportPageProps = {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    preview?: string;
    created?: string;
    updated?: string;
    invalid?: string;
    duplicates?: string;
    optedOutPreserved?: string;
  }>;
};

function formatConsentStatus(status: string) {
  const labels: Record<string, string> = {
    needs_consent: "Consentement requis",
    opted_in: "Consentement confirmé",
    opted_out: "Désinscrit"
  };

  return labels[status] ?? status;
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  const {
    error,
    imported,
    preview,
    created,
    updated,
    invalid,
    duplicates,
    optedOutPreserved
  } = await searchParams;
  const decodedPreview = preview ? decodeURIComponent(preview) : "";
  const validation = decodedPreview
    ? validateCustomerImportRows(mapCsvToCustomerImportRows(decodedPreview))
    : null;

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Import CSV avec validation et aperçu avant toute écriture."
        title="Import clients"
      />
      {error ? (
        <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          {error}
        </p>
      ) : null}
      {imported ? (
        <div className="rounded-xl border border-[#b7dfc5] bg-[#edf8f3] p-3 text-sm font-bold text-[var(--primary-strong)]">
          <p>Import termine. Les doublons ont ete evites par telephone et organisation.</p>
          <p className="mt-2 text-xs leading-5">
            Created: {created ?? "0"} · Updated: {updated ?? "0"} · Invalid:
            {" "}
            {invalid ?? "0"} · Duplicates: {duplicates ?? "0"} · Opted-out
            preserved: {optedOutPreserved ?? "0"}
          </p>
        </div>
      ) : null}
      <Panel title="Import / export">
        <div className="mb-4 rounded-2xl border border-[var(--line)] bg-slate-50 p-3 text-sm text-[var(--muted)]">
          Pas de fichier CSV ? Utilisez l’import rapide par{" "}
          <Link
            className="font-black text-[var(--primary)] underline"
            href="/dashboard/import/paste"
          >
            copier-coller
          </Link>
          .
        </div>
        <ImportExportPanel initialCsv={decodedPreview} />
      </Panel>
      {validation ? (
        <Panel title="Résumé de l’import">
          <dl className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Lignes totales", validation.summary.totalRows],
              ["Lignes valides", validation.summary.validRows],
              ["Doublons", validation.summary.duplicateRows],
              ["Téléphones invalides", validation.summary.invalidPhoneRows],
              ["Consentement requis", validation.summary.needsConsentRows],
              ["Consentement confirmé", validation.summary.optedInRows],
              ["Désinscrits", validation.summary.optedOutRows]
            ].map(([label, value]) => (
              <div
                className="rounded-2xl border border-[var(--line)] bg-slate-50 p-3"
                key={label}
              >
                <dt className="text-xs font-black uppercase text-[var(--muted)]">
                  {label}
                </dt>
                <dd className="mt-1 text-2xl font-black">{value}</dd>
              </div>
            ))}
          </dl>
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Nom</th>
                <th className={tableHeadClass}>Téléphone</th>
                <th className={tableHeadClass}>Consentement</th>
                <th className={tableHeadClass}>Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {validation.rows.map((row, index) => (
                <tr key={`${row.input.phone}-${index}`}>
                  <td className={tableCellClass}>{row.input.fullName}</td>
                  <td className={tableCellClass}>{row.phoneE164 ?? row.input.phone}</td>
                  <td className={tableCellClass}>
                    {formatConsentStatus(row.consentStatus)}
                  </td>
                  <td className={tableCellClass}>
                    <StatusBadge>{row.status}</StatusBadge>
                    {row.errors.length > 0 ? (
                      <p className="mt-2 text-xs text-[#8a1f17]">
                        {row.errors.join(" ")}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <form action={confirmCustomerCsvImportAction} className="mt-5">
            <input name="csv" type="hidden" value={decodedPreview} />
            <input name="fileName" type="hidden" value="dashboard-import.csv" />
            <button
              className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
              type="submit"
            >
              Confirmer l’import
            </button>
          </form>
        </Panel>
      ) : (
        <Panel title="Fonctionnement">
          <EmptyState
            description="Collez un CSV avec au minimum un nom et un téléphone. Les consentements absents restent en consentement requis."
            title="Aucun aperçu pour le moment."
          />
        </Panel>
      )}
    </div>
  );
}
