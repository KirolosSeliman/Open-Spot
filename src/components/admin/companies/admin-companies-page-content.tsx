import { AdminCompaniesFilters } from "@/components/admin/companies/admin-companies-filters";
import { AdminCompaniesHeader } from "@/components/admin/companies/admin-companies-header";
import { AdminCompaniesKpiCards } from "@/components/admin/companies/admin-companies-kpi-cards";
import { AdminCompaniesTable } from "@/components/admin/companies/admin-companies-table";
import type { AdminCompaniesPageData } from "@/lib/admin/companies-data";

export function AdminCompaniesPageContent({
  data
}: {
  data: AdminCompaniesPageData;
}) {
  return (
    <section className="grid gap-6">
      <AdminCompaniesHeader notificationCount={data.notificationCount} />
      <AdminCompaniesKpiCards kpis={data.kpis} />

      <div className="overflow-hidden rounded-[20px] border border-[#e3eaf5] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <AdminCompaniesFilters
          availablePlans={data.availablePlans}
          filters={data.filters}
        />
        <AdminCompaniesTable
          companies={data.companies}
          filteredCount={data.filteredCount}
          range={data.filters.range}
          totalCount={data.totalCount}
        />
      </div>
    </section>
  );
}
