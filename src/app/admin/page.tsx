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
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2563ff]">
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

  return (
    <section className="flex flex-col gap-6">
      <AdminOverviewHeader exportPayload={data.exportPayload} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
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
          icon={<WarningIcon className="h-5 w-5" />}
          iconClassName="bg-[#fef2f2] text-[#ef4444]"
          metric={data.kpis[4]!}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <AdminSmsActivityCard
          className="xl:col-span-6"
          maxCount={data.smsActivity.maxCount}
          points={data.smsActivity.points}
          range={data.smsActivity.range}
        />
        <AdminSummaryCard className="xl:col-span-3" items={data.operationalSummary} />
        <AdminProfileCard className="xl:col-span-3" profile={data.adminProfile} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <TopCompaniesTable
          className="xl:col-span-7"
          rows={data.topCompanies.rows}
          totalCount={data.topCompanies.totalCount}
        />
        <div className="flex flex-col gap-5 xl:col-span-5">
          <RecentCallRequestsCard rows={data.recentCallRequests} />
          <AdminAuditLogCard rows={data.auditLogs} />
        </div>
      </div>
    </section>
  );
}
