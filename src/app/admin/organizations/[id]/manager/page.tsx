import { notFound } from "next/navigation";

import { CompanyAdminVisibilitySection } from "@/components/admin/company-detail/company-admin-visibility";
import { CompanyDetailHeader } from "@/components/admin/company-detail/company-detail-header";
import {
  CompanyManagerModeSection,
  CompanyManagerSessionsSection
} from "@/components/admin/company-detail/company-manager-section";
import { loadCompanyDetailOverview } from "@/lib/admin/company-detail-data";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrganizationManagerPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const managerModeError = getSingleSearchParam(
    resolvedSearchParams.managerModeError
  );
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    notFound();
  }

  const detail = await loadCompanyDetailOverview({
    admin: access.admin,
    organizationId: id,
    range: parseAdminDateRange({})
  });

  if (!detail) {
    notFound();
  }

  const { overview, controlsPanel } = detail;

  return (
    <section className="grid gap-6">
      <CompanyDetailHeader
        description={`Visibilité admin, sessions gestionnaire et mode gestionnaire pour ${overview.organization.name}.`}
        organizationId={id}
        refreshHref={`/admin/organizations/${id}/manager`}
        title="Mode gestionnaire"
      />

      <CompanyAdminVisibilitySection
        canArchive={controlsPanel.permissions.canArchive}
        canUnarchive={controlsPanel.permissions.canUnarchive}
        controls={controlsPanel.controls}
        organizationId={id}
        returnTo={`/admin/organizations/${id}/manager`}
      />

      <CompanyManagerSessionsSection
        canEndSessions={controlsPanel.permissions.canEndManagerSessions}
        organizationId={id}
        sessions={controlsPanel.activeManagerSessions}
      />

      <CompanyManagerModeSection
        canOpenManagerMode={overview.access.canOpenManagerMode}
        managerModeError={managerModeError}
        organizationId={id}
      />
    </section>
  );
}
