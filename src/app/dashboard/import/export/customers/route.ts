import { NextResponse } from "next/server";

import { loadCustomersWithConsent } from "@/lib/dashboard/operations-data";
import { buildCustomerExportCsv } from "@/lib/import/export";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { canManageCustomers } from "@/lib/organization/permissions";

export async function GET() {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    return NextResponse.json(
      { error: "Supabase must be configured before exporting clients." },
      { status: 503 }
    );
  }

  if (!canManageCustomers(workspace.organization.role)) {
    return NextResponse.json(
      { error: "You do not have permission to export clients." },
      { status: 403 }
    );
  }

  const csv = buildCustomerExportCsv(await loadCustomersWithConsent());

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="open-spot-${workspace.organization.slug}-clients.csv"`
    }
  });
}
