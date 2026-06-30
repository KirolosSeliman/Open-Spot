"use client";

import { useState } from "react";

import { previewCustomerCsvImportAction } from "@/lib/import/actions";

export function ImportExportPanel({
  initialCsv = ""
}: {
  initialCsv?: string;
}) {
  const [csv, setCsv] = useState(initialCsv);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <form
        action={previewCustomerCsvImportAction}
        className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3">
          <div>
            <h2 className="text-base font-black">Import CSV</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Sélectionnez un fichier CSV, vérifiez l&apos;aperçu, puis confirmez
              l&apos;import. Aucune donnée n&apos;est écrite avant confirmation.
            </p>
          </div>
          <label className="grid min-h-40 cursor-pointer place-items-center rounded-2xl border border-dashed border-[var(--primary)] bg-[var(--primary-soft)] p-5 text-center text-sm font-bold text-[var(--primary-strong)]">
            <span>Choisir un fichier CSV</span>
            <span className="mt-1 text-xs font-semibold text-[var(--muted)]">
              Formats acceptés : .csv, text/csv
            </span>
            <input
              accept=".csv,text/csv"
              className="sr-only"
              name="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setError("");

                if (!file) {
                  setFileName("");
                  setCsv("");
                  return;
                }

                const isCsv =
                  file.name.toLowerCase().endsWith(".csv") ||
                  file.type === "text/csv" ||
                  file.type === "application/vnd.ms-excel";

                if (!isCsv) {
                  setFileName(file.name);
                  setCsv("");
                  setError("Type de fichier non pris en charge. Choisissez un fichier CSV.");
                  return;
                }

                setFileName(file.name);
                void file.text().then(setCsv).catch(() => {
                  setCsv("");
                  setError("Impossible de lire ce fichier CSV.");
                });
              }}
              type="file"
            />
          </label>
          {fileName ? (
            <p className="rounded-xl border border-[var(--line)] bg-[#fbfaf7] px-3 py-2 text-sm font-bold">
              Fichier sélectionné : {fileName}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] px-3 py-2 text-sm font-bold text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <input name="csv" type="hidden" value={csv} />
          <button
            className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!csv || Boolean(error)}
            type="submit"
          >
            Prévisualiser l&apos;import
          </button>
        </div>
      </form>

      <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black">Export clients</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Téléchargez seulement les clients de votre organisation, pour sauvegarde,
          audit, corrections ou migration.
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
          href="/dashboard/import/export/customers"
        >
          Télécharger le CSV clients
        </a>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black">Modèle d&apos;import</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Téléchargez les colonnes attendues pour préparer un fichier propre
          avant l&apos;import.
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
          href="/dashboard/import/export/template"
        >
          Télécharger le modèle CSV
        </a>
      </section>
    </div>
  );
}
