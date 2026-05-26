import type { ReactNode } from "react";

import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  await getActiveOrganizationWorkspace();

  return children;
}
