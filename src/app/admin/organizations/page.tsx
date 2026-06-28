import { AdminCompaniesPageContent } from "@/components/admin/companies/admin-companies-page-content";
import { loadAdminCompaniesPageData } from "@/lib/admin/companies-data";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrganizationsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <div>
          <nav aria-label="Breadcrumb" className="text-[13px] font-medium">
            <span className="text-[#2563ff]">Admin</span>
            <span className="mx-2 text-[#94a3b8]">/</span>
            <span className="text-[#64748b]">Companies</span>
          </nav>
          <h1 className="mt-3 text-[2rem] font-bold text-[#0b1328]">Companies</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#64748b]">
            {access.message}
          </p>
        </div>
      </section>
    );
  }

  const data = await loadAdminCompaniesPageData({
    admin: access.admin,
    query: getSingleSearchParam(params.q),
    status: getSingleSearchParam(params.status),
    plan: getSingleSearchParam(params.plan),
    range: getSingleSearchParam(params.range)
  });

  return <AdminCompaniesPageContent data={data} />;
}
