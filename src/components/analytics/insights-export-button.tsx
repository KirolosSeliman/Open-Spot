"use client";

import { buildInsightsCsv, getInsightsExportFilename } from "@/lib/analytics/export";
import type { InsightsExportPayload } from "@/lib/analytics/types";

export function InsightsExportButton({
  payload
}: {
  payload: InsightsExportPayload;
}) {
  function handleExport() {
    const csv = buildInsightsCsv(payload);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getInsightsExportFilename();
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#dbeafe] bg-white px-4 py-2.5 text-sm font-semibold text-[#2563ff] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-[#eff6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
      onClick={handleExport}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
      </svg>
      Exporter
    </button>
  );
}
