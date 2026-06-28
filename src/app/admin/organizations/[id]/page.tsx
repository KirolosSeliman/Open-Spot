import { notFound } from "next/navigation";

import { CompanyAdminVisibilitySection } from "@/components/admin/company-detail/company-admin-visibility";
import { CompanyDateRangeFilter } from "@/components/admin/company-detail/company-date-range-filter";
import { CompanyDetailHeader } from "@/components/admin/company-detail/company-detail-header";
import { CompanyOverviewKpiCards } from "@/components/admin/company-detail/company-kpi-cards";
import {
  CompanyIdentityCard,
  CompanyNavigationCards,
  CompanyOwnerAccessCard
} from "@/components/admin/company-detail/company-identity-section";
import {
  CompanyManagerModeSection,
  CompanyManagerSessionsSection
} from "@/components/admin/company-detail/company-manager-section";
import { loadCompanyDetailOverview } from "@/lib/admin/company-detail-data";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrganizationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const range = parseAdminDateRange({
    range: getSingleSearchParam(resolvedSearchParams.range),
    from: getSingleSearchParam(resolvedSearchParams.from),
    to: getSingleSearchParam(resolvedSearchParams.to)
  });
  const managerModeError = getSingleSearchParam(
    resolvedSearchParams.managerModeError
  );
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <CompanyDetailHeader
          description={access.message}
          organizationId={id}
          refreshHref={`/admin/organizations/${id}`}
          title="Company overview"
        />
      </section>
    );
  }

  const detail = await loadCompanyDetailOverview({
    admin: access.admin,
    organizationId: id,
    range
  });

  if (!detail) {
    notFound();
  }

  const { overview, controlsPanel, kpis } = detail;
  const refreshHref = `/admin/organizations/${overview.organization.id}?range=${overview.range.rangeKey}`;

  return (
    <section className="grid gap-6">
      <CompanyDetailHeader
        activeAction="overview"
        description="Vue d'administration de la plateforme pour la performance, la santé des SMS et l'activité de récupération."
        organizationId={overview.organization.id}
        refreshHref={refreshHref}
        title={overview.organization.name}
      />

      <CompanyDateRangeFilter range={range} rangeKey={overview.range.rangeKey} />

      <CompanyOverviewKpiCards
        estimatedSmsCostLabel={formatEstimatedSmsCost(
          kpis.estimatedSmsCostCents,
          overview.billing.terms.currency
        )}
        estimatedSmsCostTrend={kpis.estimatedSmsCostTrend}
        filledSpots={kpis.filledSpots}
        filledSpotsTrend={kpis.filledSpotsTrend}
        optInCustomersInRange={kpis.optInCustomersInRange}
        optInCustomersTrend={kpis.optInCustomersTrend}
        outboundSms={kpis.outboundSms}
        outboundSmsTrend={kpis.outboundSmsTrend}
        pendingValidations={kpis.pendingValidations}
        pendingValidationsTrend={kpis.pendingValidationsTrend}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CompanyIdentityCard
          createdAt={overview.organization.createdAt}
          organizationId={overview.organization.id}
          slug={overview.organization.slug}
        />
        <CompanyOwnerAccessCard
          accessLevel={overview.access.accessLevel}
          organizationId={overview.organization.id}
          ownerEmail={overview.organization.ownerEmail}
          timezone={overview.organization.timezone}
        />
      </div>

      <CompanyNavigationCards organizationId={overview.organization.id} />

      <CompanyAdminVisibilitySection
        canArchive={controlsPanel.permissions.canArchive}
        canUnarchive={controlsPanel.permissions.canUnarchive}
        controls={controlsPanel.controls}
        organizationId={overview.organization.id}
        returnTo={`/admin/organizations/${overview.organization.id}`}
      />

      <CompanyManagerSessionsSection
        canEndSessions={controlsPanel.permissions.canEndManagerSessions}
        organizationId={overview.organization.id}
        sessions={controlsPanel.activeManagerSessions}
      />

      <CompanyManagerModeSection
        canOpenManagerMode={overview.access.canOpenManagerMode}
        managerModeError={managerModeError}
        organizationId={overview.organization.id}
      />
    </section>
  );
}
