"use client";

import {
  buildAdminOverviewCsv,
  getAdminOverviewExportFilename
} from "@/lib/admin/overview-export";
import type { AdminOverviewData } from "@/lib/admin/overview-data";
import { DownloadIcon } from "@/components/admin/overview/admin-overview-icons";

export function AdminExportButton({
  exportPayload
}: {
  exportPayload: AdminOverviewData["exportPayload"];
}) {
  function handleExport() {
    const csv = buildAdminOverviewCsv(exportPayload);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getAdminOverviewExportFilename();
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e1e9f5] bg-white px-5 text-sm font-semibold text-[#0b1328] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
      onClick={handleExport}
      type="button"
    >
      <DownloadIcon className="h-4 w-4 text-[#657492]" />
      Exporter le rapport
    </button>
  );
}
