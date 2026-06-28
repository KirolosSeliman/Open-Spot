import { notFound } from "next/navigation";

import {
  CompanyAnalyticsCharts,
  CompanyBillingKpiCards,
  formatCompanyMoney
} from "@/components/admin/company-detail/company-analytics-section";
import { CompanyBillingTermsForm } from "@/components/admin/company-detail/company-billing-terms-form";
import { CompanyDetailHeader } from "@/components/admin/company-detail/company-detail-header";
import { CompanyManualBillingPanel } from "@/components/admin/company-detail/company-manual-billing-panel";
import { CompanyDetailCard } from "@/components/admin/company-detail/company-detail-ui";
import { loadCompanyDetailOverview } from "@/lib/admin/company-detail-data";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { loadManualBillingForAdmin } from "@/lib/billing/manual-billing-data";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { loadBillingPaymentReminderContext } from "@/lib/sms/billing-payment-reminder";

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrganizationBillingPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const range = parseAdminDateRange({
    range: getSingleSearchParam(query.range),
    from: getSingleSearchParam(query.from),
    to: getSingleSearchParam(query.to)
  });
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <CompanyDetailHeader
          activeAction="billing"
          description={access.message}
          organizationId={id}
          refreshHref={`/admin/organizations/${id}/billing`}
          title="Facturation et analytique"
        />
      </section>
    );
  }

  if (access.status !== "authorized") {
    notFound();
  }

  const [detail, manualBillingPanel] = await Promise.all([
    loadCompanyDetailOverview({
      admin: access.admin,
      organizationId: id,
      range
    }),
    loadManualBillingForAdmin({
      admin: access.admin,
      organizationId: id
    })
  ]);

  if (!detail || !manualBillingPanel) {
    notFound();
  }

  const { overview, controlsPanel, estimatedTotalContributionCents } = detail;
  const { billing, events, organizationName } = manualBillingPanel;
  const canManageBilling = access.admin.role === "super_admin";
  const paymentReminder = await loadBillingPaymentReminderContext({
    organizationId: id,
    organizationName,
    billing
  });
  const currency = overview.billing.terms.currency;
  const refreshHref = `/admin/organizations/${id}/billing?range=${overview.range.rangeKey}`;

  return (
    <section className="grid gap-6">
      <CompanyDetailHeader
        activeAction="billing"
        description={`Gérez les conditions de facturation et suivez les performances financières et opérationnelles de ${overview.organization.name}.`}
        organizationId={id}
        refreshHref={refreshHref}
        title="Facturation et analytique"
      />

      {query.error ? (
        <CompanyDetailCard className="border-red-200 bg-red-50 text-red-800">
          <p className="font-bold">Échec de la mise à jour de la facturation</p>
          <p className="mt-1 text-sm">{String(query.error)}</p>
        </CompanyDetailCard>
      ) : null}
      {query.saved ? (
        <CompanyDetailCard className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <p className="font-bold">Modifications de facturation enregistrées.</p>
        </CompanyDetailCard>
      ) : null}
      {query.reminderSent ? (
        <CompanyDetailCard className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <p className="font-bold">Rappel de paiement envoyé.</p>
        </CompanyDetailCard>
      ) : null}

      <CompanyBillingTermsForm
        canEdit={controlsPanel.permissions.canUpdateBillingTerms}
        notes={overview.billing.notes}
        organizationId={id}
        terms={overview.billing.terms}
      />

      <CompanyBillingKpiCards
        estimatedContributionLabel={formatCompanyMoney(
          estimatedTotalContributionCents,
          currency
        )}
        estimatedSmsCostLabel={formatCompanyMoney(
          overview.billing.estimatedSmsCostInRangeCents,
          currency
        )}
        filledSpotFeesLabel={formatCompanyMoney(
          overview.billing.filledSpotFeesInRangeCents,
          currency
        )}
        filledSpotsInRange={overview.billing.filledSpotsInRange}
        monthlySubscriptionLabel={formatCompanyMoney(
          overview.billing.terms.monthlySubscriptionCents,
          currency
        )}
      />

      <div id="analytics">
        <CompanyAnalyticsCharts charts={overview.charts} currency={currency} />
      </div>

      {overview.billing.warnings.length > 0 ? (
        <CompanyDetailCard>
          {overview.billing.warnings.map((warning) => (
            <p className="text-sm text-[#64748b]" key={warning}>
              {warning}
            </p>
          ))}
        </CompanyDetailCard>
      ) : null}

      <CompanyManualBillingPanel
        billing={billing}
        canManageBilling={canManageBilling}
        events={events}
        organizationId={id}
        organizationName={organizationName}
        paymentReminder={paymentReminder}
      />
    </section>
  );
}
