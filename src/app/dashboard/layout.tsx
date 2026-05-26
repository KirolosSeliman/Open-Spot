import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const workspace = await getActiveOrganizationWorkspace();

  return <DashboardShell workspace={workspace}>{children}</DashboardShell>;
}
