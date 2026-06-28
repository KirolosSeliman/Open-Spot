import { AdminAuditLogCard } from "@/components/admin/overview/admin-audit-log-card";
import {
  BuildingIcon,
  CalendarIcon,
  DollarIcon,
  MessageIcon,
  WarningIcon
} from "@/components/admin/overview/admin-overview-icons";
import { AdminOverviewHeader } from "@/components/admin/overview/admin-overview-header";
import { AdminKpiCard } from "@/components/admin/overview/admin-kpi-card";
import { AdminProfileCard } from "@/components/admin/overview/admin-profile-card";
import { AdminSmsActivityCard } from "@/components/admin/overview/admin-sms-activity-card";
import { AdminSummaryCard } from "@/components/admin/overview/admin-summary-card";
import { RecentCallRequestsCard } from "@/components/admin/overview/recent-call-requests-card";
import { TopCompaniesTable } from "@/components/admin/overview/top-companies-table";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { loadAdminOverviewData } from "@/lib/admin/overview-data";

function resolveSmsRangeParam(
  searchParams: Record<string, string | string[] | undefined>
) {
  const value = Array.isArray(searchParams.smsRange)
    ? searchParams.smsRange[0]
    : searchParams.smsRange;

  if (value === "7d") {
    return "7d";
  }

  if (value === "90d") {
    return "90d";
  }

  return "30d";
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563ff]">
            Admin Open Spot
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#0b1328]">
            L&apos;accès administrateur n&apos;est pas configuré.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657492]">
            {access.message}
          </p>
        </div>
      </section>
    );
  }

  const data = await loadAdminOverviewData({
    admin: access.admin,
    searchParams: resolvedSearchParams
  });
  const smsRangeParam = resolveSmsRangeParam(resolvedSearchParams);

  return (
    <section className="grid gap-6">
      <AdminOverviewHeader exportPayload={data.exportPayload} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard
          icon={<BuildingIcon className="h-5 w-5" />}
          metric={data.kpis[0]!}
        />
        <AdminKpiCard
          icon={<MessageIcon className="h-5 w-5" />}
          metric={data.kpis[1]!}
        />
        <AdminKpiCard
          icon={<DollarIcon className="h-5 w-5" />}
          metric={data.kpis[2]!}
        />
        <AdminKpiCard
          icon={<CalendarIcon className="h-5 w-5" />}
          metric={data.kpis[3]!}
        />
        <AdminKpiCard
          icon={<WarningIcon className="h-5 w-5 text-[#ef4444]" />}
          iconClassName="bg-[#fef2f2] text-[#ef4444]"
          metric={data.kpis[4]!}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <AdminSmsActivityCard
          maxCount={data.smsActivity.maxCount}
          points={data.smsActivity.points}
          range={data.smsActivity.range}
          topPage={data.topCompanies.page}
        />
        <AdminSummaryCard items={data.operationalSummary} />
        <AdminProfileCard profile={data.adminProfile} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <TopCompaniesTable
          page={data.topCompanies.page}
          rows={data.topCompanies.rows}
          smsRange={smsRangeParam}
          totalCount={data.topCompanies.totalCount}
          totalPages={data.topCompanies.totalPages}
        />
        <div className="grid gap-4 xl:col-span-2">
          <RecentCallRequestsCard rows={data.recentCallRequests} />
          <AdminAuditLogCard rows={data.auditLogs} />
        </div>
      </div>
    </section>
  );
}
