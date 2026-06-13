import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentPlatformAdminAccess } from "@/lib/auth/platform-admin";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const workspace = await getActiveOrganizationWorkspace();
  const adminAccess =
    workspace.status === "ready" ? await getCurrentPlatformAdminAccess() : null;
  const isPlatformAdmin = adminAccess?.status === "authorized";

  return (
    <DashboardShell isPlatformAdmin={isPlatformAdmin} workspace={workspace}>
      {children}
    </DashboardShell>
  );
}
