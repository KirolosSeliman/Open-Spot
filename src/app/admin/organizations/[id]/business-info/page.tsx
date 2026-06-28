import { notFound } from "next/navigation";

import { CompanyDetailBreadcrumbHeader } from "@/components/admin/company-detail/company-detail-header";
import { CompanyDetailCard } from "@/components/admin/company-detail/company-detail-ui";
import { OrganizationBusinessInfoEditor } from "@/components/admin/organization-business-info-editor";
import { loadOrganizationAdminControlsPanel } from "@/lib/admin/organization-controls";
import { loadAdminOrganizationBusinessInfo } from "@/lib/admin/organization-business-info-data";
import { loadAdminOrganizationOverview } from "@/lib/admin/organizations";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrganizationBusinessInfoPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const businessInfoError = getSingleSearchParam(
    resolvedSearchParams.businessInfoError
  );
  const businessInfoUpdated =
    getSingleSearchParam(resolvedSearchParams.businessInfoUpdated) === "1";
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    notFound();
  }

  const [overview, businessInfo, controlsPanel] = await Promise.all([
    loadAdminOrganizationOverview({
      admin: access.admin,
      organizationId: id,
      range: parseAdminDateRange({})
    }),
    loadAdminOrganizationBusinessInfo(id),
    loadOrganizationAdminControlsPanel({
      admin: access.admin,
      organizationId: id
    })
  ]);

  if (!overview || !businessInfo || !controlsPanel) {
    notFound();
  }

  return (
    <section className="grid gap-6">
      <CompanyDetailBreadcrumbHeader
        description="Gérez les informations de base de l'entreprise. Ces détails sont utilisés pour la configuration de la plateforme, la communication et les paramètres opérationnels."
        organizationName={overview.organization.name}
        title="Informations du commerce"
      />

      <CompanyDetailCard>
        <OrganizationBusinessInfoEditor
          businessInfo={businessInfo}
          canEdit={controlsPanel.permissions.canUpdateBusinessInfo}
          errorMessage={businessInfoError}
          returnTo={`/admin/organizations/${id}/business-info`}
          showHeading={false}
          success={businessInfoUpdated}
        />
      </CompanyDetailCard>
    </section>
  );
}
