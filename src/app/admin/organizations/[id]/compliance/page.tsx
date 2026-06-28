import { notFound } from "next/navigation";

import { CompanyDetailHeader } from "@/components/admin/company-detail/company-detail-header";
import { CompanySimpleKpiCard } from "@/components/admin/company-detail/company-kpi-cards";
import {
  CompanyComplianceOverviewCard,
  CompanyInternalSupportSection,
  CompanySmsControlsSection
} from "@/components/admin/company-detail/company-support-compliance-section";
import { CompanyDetailCard, CompanyDetailSectionTitle } from "@/components/admin/company-detail/company-detail-ui";
import { Card } from "@/components/ui/card";
import { markComplianceReviewAction } from "@/lib/admin/actions";
import { loadCompanyDetailOverview } from "@/lib/admin/company-detail-data";
import { loadAdminCompliance } from "@/lib/admin/compliance";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const numberFormatter = new Intl.NumberFormat("fr-CA");

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export default async function AdminOrganizationCompliancePage({
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
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    notFound();
  }

  const [detail, complianceResult] = await Promise.all([
    loadCompanyDetailOverview({
      admin: access.admin,
      organizationId: id,
      range
    }),
    loadAdminCompliance({
      admin: access.admin,
      organizationId: id,
      searchParams: resolvedSearchParams,
      auditAction: "admin.organization.compliance_viewed"
    })
  ]);

  if (!detail) {
    notFound();
  }

  const { overview, controlsPanel } = detail;
  const refreshHref = `/admin/organizations/${id}/compliance?range=${overview.range.rangeKey}`;

  return (
    <section className="grid gap-6">
      <CompanyDetailHeader
        activeAction="compliance"
        description={`Gérez le support interne, les contrôles SMS et la conformité pour ${overview.organization.name}.`}
        organizationId={id}
        refreshHref={refreshHref}
        title="Support interne et conformité"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <CompanySimpleKpiCard
          icon={<CalendarIcon />}
          title="Ouvertures récentes"
          value={numberFormatter.format(overview.kpis.openingsCreated)}
        />
        <CompanySimpleKpiCard
          icon={<AlertIcon />}
          title="SMS échoués"
          value={numberFormatter.format(overview.kpis.failedSms)}
        />
        <CompanySimpleKpiCard
          icon={<ClockIcon />}
          title="Validations en attente"
          value={numberFormatter.format(overview.kpis.pendingValidations)}
        />
      </div>

      <CompanyComplianceOverviewCard
        currency={overview.billing.terms.currency}
        optedOutCustomers={overview.kpis.optedOutCustomers}
        recoveredValueCents={overview.kpis.recoveredValueCents}
        unknownReplies={overview.kpis.unknownOrUnlinkedReplies}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <CompanyInternalSupportSection
          controls={controlsPanel.controls}
          organizationId={id}
          permissions={{
            canUpdateSupportStatus: controlsPanel.permissions.canUpdateSupportStatus,
            canUpdateAdminNote: controlsPanel.permissions.canUpdateAdminNote,
            canMarkInternalTest: controlsPanel.permissions.canMarkInternalTest
          }}
        />
        <CompanySmsControlsSection
          controls={controlsPanel.controls}
          organizationId={id}
          permissions={{
            canPauseSms: controlsPanel.permissions.canPauseSms,
            canResumeSms: controlsPanel.permissions.canResumeSms,
            canDisable: controlsPanel.permissions.canDisable,
            canReactivate: controlsPanel.permissions.canReactivate,
            canRunHealthCheck: controlsPanel.permissions.canRunHealthCheck
          }}
        />
      </div>

      <CompanyDetailCard>
        <CompanyDetailSectionTitle>Indicateurs conformité détaillés</CompanyDetailSectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CompanySimpleKpiCard
            icon={<AlertIcon />}
            title="Envois potentiellement risqués"
            value={numberFormatter.format(complianceResult.metrics.potentialRiskySends)}
          />
          <CompanySimpleKpiCard
            icon={<AlertIcon />}
            title="Consentements manquants"
            value={numberFormatter.format(complianceResult.metrics.missingConsentRecords)}
          />
          <CompanySimpleKpiCard
            icon={<AlertIcon />}
            title="Callbacks manquants"
            value={numberFormatter.format(complianceResult.metrics.missingStatusCallbacks)}
          />
        </div>
      </CompanyDetailCard>

      {complianceResult.issues.length > 0 ? (
        <CompanyDetailCard>
          <CompanyDetailSectionTitle>Problèmes de conformité</CompanyDetailSectionTitle>
          <p className="mt-2 text-sm text-[#64748b]">
            Vue opérationnelle en lecture seule. Les revues ne modifient pas le consentement.
          </p>
          <div className="mt-5 grid gap-3">
            {complianceResult.issues.map((issue) => (
              <Card className="rounded-[16px] border-[#e2eaf5] p-4 shadow-none" key={issue.key}>
                <p className="font-bold text-[#0b1328]">{issue.title}</p>
                <p className="mt-1 text-sm text-[#64748b]">
                  {issue.severity} · {issue.status} · {issue.evidence}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">{issue.description}</p>
                <form action={markComplianceReviewAction} className="mt-4 flex flex-wrap gap-2">
                  <input name="organizationId" type="hidden" value={id} />
                  <input name="issueKey" type="hidden" value={issue.key} />
                  <input name="issueType" type="hidden" value={issue.type} />
                  <input name="severity" type="hidden" value={issue.severity} />
                  <input
                    className="min-h-10 rounded-[13px] border border-[#e2eaf5] bg-white px-3 text-sm"
                    name="note"
                    placeholder="Note interne"
                  />
                  <button
                    className="rounded-[13px] border border-[#e2eaf5] px-4 py-2 text-sm font-bold"
                    name="status"
                    type="submit"
                    value="reviewed"
                  >
                    Revu
                  </button>
                  <button
                    className="rounded-[13px] border border-[#e2eaf5] px-4 py-2 text-sm font-bold"
                    name="status"
                    type="submit"
                    value="resolved"
                  >
                    Résolu
                  </button>
                  <button
                    className="rounded-[13px] border border-[#e2eaf5] px-4 py-2 text-sm font-bold"
                    name="status"
                    type="submit"
                    value="dismissed"
                  >
                    Ignorer
                  </button>
                </form>
              </Card>
            ))}
          </div>
        </CompanyDetailCard>
      ) : null}
    </section>
  );
}
