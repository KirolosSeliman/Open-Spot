import Link from "next/link";

import { AdminExportButton } from "@/components/admin/overview/admin-export-button";
import { BuildingIcon } from "@/components/admin/overview/admin-overview-icons";
import type { AdminOverviewData } from "@/lib/admin/overview-data";

export function AdminOverviewHeader({
  exportPayload
}: {
  exportPayload: AdminOverviewData["exportPayload"];
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563ff]">
          Admin Open Spot
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b1328] sm:text-4xl">
          Vue interne plateforme
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#657492] sm:text-base">
          Aperçu opérationnel interne de la plateforme pour les compagnies visibles sur
          votre compte administrateur.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563ff] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,255,0.25)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
          href="/admin/organizations"
        >
          <BuildingIcon className="h-4 w-4" />
          Voir les compagnies
        </Link>
        <AdminExportButton exportPayload={exportPayload} />
      </div>
    </header>
  );
}
