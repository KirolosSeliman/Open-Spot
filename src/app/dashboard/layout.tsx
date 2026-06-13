import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isPlatformAdminEmail } from "@/lib/auth/platform-admin";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const workspace = await getActiveOrganizationWorkspace();
  const isPlatformAdmin =
    workspace.status === "ready" && isPlatformAdminEmail(workspace.user.email);

  return (
    <DashboardShell isPlatformAdmin={isPlatformAdmin} workspace={workspace}>
      {children}
    </DashboardShell>
  );
}
