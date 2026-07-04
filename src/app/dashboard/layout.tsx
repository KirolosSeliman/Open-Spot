import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentPlatformAdminAccess } from "@/lib/auth/platform-admin";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const workspace = await getActiveOrganizationWorkspace();
  const locale = await getRequestLocale();
  const adminAccess =
    workspace.status === "ready" ? await getCurrentPlatformAdminAccess() : null;
  const isPlatformAdmin = adminAccess?.status === "authorized";

  return (
    <DashboardShell
      initialLocale={locale}
      isPlatformAdmin={isPlatformAdmin}
      workspace={workspace}
    >
      {children}
    </DashboardShell>
  );
}
