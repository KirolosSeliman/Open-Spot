import "server-only";

import type { AdminDateRange } from "@/lib/admin/date-range";
import { getPreviousAdminDateRange } from "@/lib/admin/date-range";
import { loadOrganizationAdminControlsPanel } from "@/lib/admin/organization-controls";
import {
  loadAdminOrganizationOverview,
  type AdminOrganizationOverview
} from "@/lib/admin/organizations";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";

export type CompanyDetailKpiTrend = {
  /** Percentage change vs previous period, null if not computable. */
  percentChange: number | null;
  /** Absolute change vs previous period. */
  absoluteChange: number;
};

export type CompanyDetailOverviewKpis = {
  /** booking_requests confirmed/completed + offers selected in range (via loadAdminOrganizationOverview). */
  filledSpots: number;
  filledSpotsTrend: CompanyDetailKpiTrend;
  /** sms_messages direction outbound in range. */
  outboundSms: number;
  outboundSmsTrend: CompanyDetailKpiTrend;
  /** aggregateSmsCost / estimateSmsCostCents on outbound messages in range. */
  estimatedSmsCostCents: number;
  estimatedSmsCostTrend: CompanyDetailKpiTrend;
  /** sms_consents status opted_in created within range. */
  optInCustomersInRange: number;
  optInCustomersTrend: CompanyDetailKpiTrend;
  /** opening_offers responded + booking_requests pending_merchant_validation in range. */
  pendingValidations: number;
  pendingValidationsTrend: CompanyDetailKpiTrend;
};

export type CompanyDetailOverview = {
  overview: AdminOrganizationOverview;
  controlsPanel: Awaited<ReturnType<typeof loadOrganizationAdminControlsPanel>>;
  kpis: CompanyDetailOverviewKpis;
  /** Estimated total contribution = subscription + spot fees + estimated SMS cost for the range. */
  estimatedTotalContributionCents: number;
};

function computeTrend(current: number, previous: number): CompanyDetailKpiTrend {
  const absoluteChange = current - previous;

  if (previous === 0) {
    return {
      percentChange: current === 0 ? 0 : null,
      absoluteChange
    };
  }

  return {
    percentChange: Number(((absoluteChange / previous) * 100).toFixed(1)),
    absoluteChange
  };
}

function sumOptInInRange(overview: AdminOrganizationOverview) {
  return overview.charts.customerGrowthByDay.reduce(
    (sum, row) => sum + row.optedInCustomers,
    0
  );
}

function buildOverviewKpis(
  current: AdminOrganizationOverview,
  previous: AdminOrganizationOverview | null
): CompanyDetailOverviewKpis {
  const optInCustomersInRange = sumOptInInRange(current);
  const previousOptIn = previous ? sumOptInInRange(previous) : 0;

  return {
    filledSpots: current.kpis.filledSpots,
    filledSpotsTrend: computeTrend(
      current.kpis.filledSpots,
      previous?.kpis.filledSpots ?? 0
    ),
    outboundSms: current.kpis.outboundSms,
    outboundSmsTrend: computeTrend(
      current.kpis.outboundSms,
      previous?.kpis.outboundSms ?? 0
    ),
    estimatedSmsCostCents: current.kpis.estimatedSmsCostCents,
    estimatedSmsCostTrend: computeTrend(
      current.kpis.estimatedSmsCostCents,
      previous?.kpis.estimatedSmsCostCents ?? 0
    ),
    optInCustomersInRange,
    optInCustomersTrend: computeTrend(
      optInCustomersInRange,
      previousOptIn
    ),
    pendingValidations: current.kpis.pendingValidations,
    pendingValidationsTrend: computeTrend(
      current.kpis.pendingValidations,
      previous?.kpis.pendingValidations ?? 0
    )
  };
}

export async function loadCompanyDetailOverview({
  admin,
  organizationId,
  range
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
  range: AdminDateRange;
}): Promise<CompanyDetailOverview | null> {
  const [overview, controlsPanel, previousOverview] = await Promise.all([
    loadAdminOrganizationOverview({ admin, organizationId, range }),
    loadOrganizationAdminControlsPanel({ admin, organizationId }),
    loadAdminOrganizationOverview({
      admin,
      organizationId,
      range: getPreviousAdminDateRange(range),
      skipAudit: true
    })
  ]);

  if (!overview || !controlsPanel) {
    return null;
  }

  const estimatedTotalContributionCents =
    overview.billing.terms.monthlySubscriptionCents +
    overview.billing.filledSpotFeesInRangeCents +
    overview.billing.estimatedSmsCostInRangeCents;

  return {
    overview,
    controlsPanel,
    kpis: buildOverviewKpis(overview, previousOverview),
    estimatedTotalContributionCents
  };
}

export async function loadCompanyDetailAnalytics({
  admin,
  organizationId,
  range
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
  range: AdminDateRange;
}) {
  const data = await loadCompanyDetailOverview({ admin, organizationId, range });
  return data;
}
