import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  archiveOrganizationAction,
  unarchiveOrganizationAction
} from "@/lib/admin/actions";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  loadAdminOrganizations,
  normalizeAdminTimeRange
} from "@/lib/admin/organizations";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";

const numberFormatter = new Intl.NumberFormat("en-CA");
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(value: string | null) {
  if (!value) {
    return "No activity";
  }

  return dateFormatter.format(new Date(value));
}

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
  const q = getSingleSearchParam(params.q) ?? "";
  const range = normalizeAdminTimeRange(getSingleSearchParam(params.range));
  const tab =
    getSingleSearchParam(params.tab) === "archived" ? "archived" : "active";
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Companies</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {access.message}
          </p>
        </div>
      </section>
    );
  }

  const result = await loadAdminOrganizations({
    admin: access.admin,
    query: q,
    timeRange: range,
    tab
  });

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">Companies</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          View the companies assigned to your platform admin account.
        </p>
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" method="get">
          <input name="tab" type="hidden" value={result.tab} />
          <label className="grid gap-2 text-sm font-bold">
            Search
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm outline-none transition focus:border-[var(--primary)]"
              defaultValue={result.query}
              name="q"
              placeholder="Company, slug, owner email"
              type="search"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Time range
            <select
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold outline-none transition focus:border-[var(--primary)]"
              defaultValue={result.timeRange}
              name="range"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
              type="submit"
            >
              Filter
            </button>
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
              href="/admin/organizations"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          className={`rounded-full border px-4 py-2 text-sm font-black ${
            result.tab === "active"
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--line)] bg-white"
          }`}
          href={`/admin/organizations?tab=active&range=${result.timeRange}${
            result.query ? `&q=${encodeURIComponent(result.query)}` : ""
          }`}
        >
          Active companies ({result.activeCount})
        </Link>
        <Link
          className={`rounded-full border px-4 py-2 text-sm font-black ${
            result.tab === "archived"
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--line)] bg-white"
          }`}
          href={`/admin/organizations?tab=archived&range=${result.timeRange}${
            result.query ? `&q=${encodeURIComponent(result.query)}` : ""
          }`}
        >
          Archived companies ({result.archivedCount})
        </Link>
      </div>

      <div className="text-sm font-bold text-[var(--muted)]">
        {result.filteredCount} companies shown out of {result.totalCount}.
      </div>

      {result.organizations.length === 0 ? (
        <Card>
          <h2 className="text-lg font-black">
            {access.admin.role === "super_admin"
              ? "No companies found."
              : "No companies assigned to this admin."}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Adjust the search or assign organizations through
            platform_admin_organization_access.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
              <thead className="bg-[#fbfaf7] text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Opted-in</th>
                  <th className="px-4 py-3">Openings</th>
                  <th className="px-4 py-3">Filled spots</th>
                  <th className="px-4 py-3">SMS sent</th>
                  <th className="px-4 py-3">SMS failed</th>
                  <th className="px-4 py-3">Estimated SMS cost</th>
                  <th className="px-4 py-3">Billing terms</th>
                  <th className="px-4 py-3">Last activity</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.organizations.map((organization) => (
                  <tr className="border-t border-[var(--line)]" key={organization.id}>
                    <td className="px-4 py-4">
                      <p className="font-black">{organization.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {organization.slug ?? "No slug"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {organization.ownerEmail ?? "Unknown"}
                    </td>
                    <td className="px-4 py-4">{organization.accessLevel}</td>
                    <td className="px-4 py-4">
                      {numberFormatter.format(organization.customersCount)}
                    </td>
                    <td className="px-4 py-4">
                      {numberFormatter.format(organization.optedInCustomersCount)}
                    </td>
                    <td className="px-4 py-4">
                      {numberFormatter.format(organization.openingsCount)}
                    </td>
                    <td className="px-4 py-4">
                      {numberFormatter.format(organization.filledSpotsCount)}
                    </td>
                    <td className="px-4 py-4">
                      {numberFormatter.format(organization.outboundSmsCount)}
                    </td>
                    <td className="px-4 py-4">
                      {numberFormatter.format(organization.failedSmsCount)}
                    </td>
                    <td className="px-4 py-4">
                      {formatEstimatedSmsCost(organization.estimatedSmsCostCents)}
                    </td>
                    <td className="px-4 py-4">
                      <p>{organization.billingTermsSummary}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Monthly {formatEstimatedSmsCost(organization.monthlySubscriptionCents)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(organization.lastActivityAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-2">
                        <Link
                          className="w-fit rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black transition hover:bg-[#f2f7f4]"
                          href={`/admin/organizations/${organization.id}?range=${result.timeRange}`}
                        >
                          View overview
                        </Link>
                        {result.tab === "archived" ? (
                          <form action={unarchiveOrganizationAction}>
                            <input name="organizationId" type="hidden" value={organization.id} />
                            <input name="returnTo" type="hidden" value="/admin/organizations?tab=archived" />
                            <button
                              className="w-fit rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black transition hover:bg-[#f2f7f4]"
                              type="submit"
                            >
                              Unarchive
                            </button>
                          </form>
                        ) : (
                          <details className="max-w-[220px]">
                            <summary className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black">
                              Archive
                            </summary>
                            <form action={archiveOrganizationAction} className="mt-2 grid gap-2">
                              <input name="organizationId" type="hidden" value={organization.id} />
                              <input name="returnTo" type="hidden" value="/admin/organizations?tab=active" />
                              <input
                                className="min-h-10 rounded-2xl border border-[var(--line)] px-3 text-xs"
                                name="reason"
                                placeholder="Reason required"
                                required
                              />
                              <button
                                className="w-fit rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black"
                                type="submit"
                              >
                                Confirm archive
                              </button>
                            </form>
                          </details>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
