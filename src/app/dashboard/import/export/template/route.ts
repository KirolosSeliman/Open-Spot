import { NextResponse } from "next/server";

import { buildImportTemplateCsv } from "@/lib/import/export";

export async function GET() {
  return new NextResponse(buildImportTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="open-spot-import-template.csv"'
    }
  });
}
