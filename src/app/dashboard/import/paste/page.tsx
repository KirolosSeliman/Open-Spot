import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import {
  confirmPastedCustomerImportAction,
  previewPastedCustomerImportAction
} from "@/lib/import/actions";
import { validateCustomerImportRows } from "@/lib/import/customer-import";
import { mapPastedTextToCustomerImportRows } from "@/lib/import/paste";

type PasteImportPageProps = {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    preview?: string;
  }>;
};

export default async function PasteImportPage({
  searchParams
}: PasteImportPageProps) {
  const { error, imported, preview } = await searchParams;
  const decodedPreview = preview ? decodeURIComponent(preview) : "";
  const validation = decodedPreview
    ? validateCustomerImportRows(mapPastedTextToCustomerImportRows(decodedPreview))
    : null;

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Collez des noms et telephones. Rien n'est ecrit avant la confirmation."
        title="Import rapide par copier-coller"
      />
      {error ? (
        <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          {error}
        </p>
      ) : null}
      {imported ? (
        <p className="rounded-xl border border-[#b7dfc5] bg-[#edf8f3] p-3 text-sm font-bold text-[var(--primary-strong)]">
          Import termine. Les clients sont marques source copy_paste.
        </p>
      ) : null}
      <Panel title="Paste preview">
        <form action={previewPastedCustomerImportAction} className="grid gap-4">
          <textarea
            className="min-h-48 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-sm focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-100"
            defaultValue={decodedPreview}
            name="pastedText"
            placeholder={"Maya 5145551001\nSarah 514-555-1002\nLina Nguyen (514) 555-1003"}
          />
          <button
            className="w-fit rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
            type="submit"
          >
            Preview pasted clients
          </button>
        </form>
      </Panel>
      {validation ? (
        <Panel title="Import result summary">
          <dl className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total rows", validation.summary.totalRows],
              ["Valid rows", validation.summary.validRows],
              ["Duplicates", validation.summary.duplicateRows],
              ["Invalid phones", validation.summary.invalidPhoneRows],
              ["Needs consent", validation.summary.needsConsentRows],
              ["Opted in", validation.summary.optedInRows]
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
                <th className={tableHeadClass}>Name</th>
                <th className={tableHeadClass}>Phone</th>
                <th className={tableHeadClass}>Consent</th>
                <th className={tableHeadClass}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {validation.rows.map((row, index) => (
                <tr key={`${row.input.phone}-${index}`}>
                  <td className={tableCellClass}>
                    {row.input.fullName || "Missing name"}
                  </td>
                  <td className={tableCellClass}>
                    {row.phoneE164 ?? (row.input.phone || "Missing phone")}
                  </td>
                  <td className={tableCellClass}>{row.consentStatus}</td>
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
          <form
            action={confirmPastedCustomerImportAction}
            className="mt-5 grid gap-4"
          >
            <input name="pastedText" type="hidden" value={decodedPreview} />
            <label className="flex gap-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-3 text-sm leading-6 text-[var(--muted)]">
              <input
                className="mt-1 h-4 w-4"
                name="hasConsentProof"
                type="checkbox"
              />
              I confirm these clients explicitly agreed to receive SMS from this
              business. Leave unchecked to import them as needs_consent.
            </label>
            <button
              className="w-fit rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
              type="submit"
            >
              Confirm paste import
            </button>
          </form>
        </Panel>
      ) : (
        <Panel title="How it works">
          <EmptyState
            description="Chaque ligne doit contenir un telephone. Le texte restant devient le nom detecte. Le consentement SMS reste needs_consent par defaut."
            title="Aucune preview pour le moment."
          />
        </Panel>
      )}
    </div>
  );
}
