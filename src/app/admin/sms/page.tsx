import Link from "next/link";

import { Card } from "@/components/ui/card";
import { loadAdminSmsDiagnostics } from "@/lib/admin/sms-diagnostics";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

function getHrefWithPage(
  searchParams: Record<string, string | string[] | undefined>,
  page: number
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const single = Array.isArray(value) ? value[0] : value;

    if (single && key !== "page") {
      params.set(key, single);
    }
  }

  params.set("page", String(page));
  return `/admin/sms?${params.toString()}`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function statusClass(status: string) {
  if (["failed", "undelivered", "error"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "delivered") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "received") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[var(--line)] bg-white text-[var(--muted)]";
}

export default async function AdminSmsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    return (
      <section className="grid gap-6">
        <h1 className="text-3xl font-black">SMS diagnostics</h1>
        <Card>
          <p className="text-sm text-[var(--muted)]">
            {access.status === "unconfigured" ? access.message : "Admin access required."}
          </p>
        </Card>
      </section>
    );
  }

  const result = await loadAdminSmsDiagnostics({
    admin: access.admin,
    searchParams: resolvedSearchParams
  });

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">SMS diagnostics</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Read-only view of outbound and inbound SMS. Phone numbers are masked and
          message bodies are limited to previews.
        </p>
      </div>

      <Card>
        <form className="grid gap-3 lg:grid-cols-6" method="get">
          <label className="grid gap-2 text-sm font-bold">
            Direction
            <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.direction} name="direction">
              <option value="all">All</option>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Status
            <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.status} name="status">
              <option value="all">All</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="undelivered">Undelivered</option>
              <option value="sent">Sent</option>
              <option value="queued">Queued</option>
              <option value="accepted">Accepted</option>
              <option value="received">Received</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Provider
            <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.provider} name="provider">
              <option value="all">All</option>
              <option value="twilio">Twilio</option>
              <option value="simulator">Simulator</option>
              <option value="plivo">Plivo</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Context
            <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.context} name="context">
              <option value="all">All</option>
              <option value="opening">Opening</option>
              <option value="appointment">Appointment</option>
              <option value="unlinked">Unlinked</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold lg:col-span-2">
            Search
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4"
              defaultValue={result.filters.q}
              name="q"
              placeholder="Company, SID, phone, error"
              type="search"
            />
          </label>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold">
            <input defaultChecked={result.filters.onlyFailed} name="onlyFailed" type="checkbox" value="true" />
            Failed only
          </label>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold">
            <input defaultChecked={result.filters.missingCallback} name="missingCallback" type="checkbox" value="true" />
            Missing callback
          </label>
          <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
            Filter
          </button>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black" href="/admin/sms">
            Reset
          </Link>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[var(--muted)]">
            Showing {result.rows.length} SMS records.
          </p>
          <div className="flex gap-2">
            {result.filters.page > 1 ? (
              <Link className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black" href={getHrefWithPage(resolvedSearchParams, result.filters.page - 1)}>
                Previous
              </Link>
            ) : null}
            {result.hasNextPage ? (
              <Link className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black" href={getHrefWithPage(resolvedSearchParams, result.filters.page + 1)}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              <tr>
                <th className="py-3 pr-4">Time</th>
                <th className="py-3 pr-4">Company</th>
                <th className="py-3 pr-4">Direction</th>
                <th className="py-3 pr-4">Context</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Provider</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Delivery</th>
                <th className="py-3 pr-4">Error</th>
                <th className="py-3 pr-4">Cost</th>
                <th className="py-3 pr-4">Message</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr className="border-t border-[var(--line)] align-top" key={row.id}>
                  <td className="py-4 pr-4">{formatDate(row.createdAt)}</td>
                  <td className="py-4 pr-4">
                    <Link className="font-black underline-offset-4 hover:underline" href={`/admin/organizations/${row.organizationId}`}>
                      {row.organizationName}
                    </Link>
                  </td>
                  <td className="py-4 pr-4">{row.direction}</td>
                  <td className="py-4 pr-4">{row.context}</td>
                  <td className="py-4 pr-4">{row.customerName ?? "Unknown"}</td>
                  <td className="py-4 pr-4 font-mono">{row.phoneMasked}</td>
                  <td className="py-4 pr-4">{row.provider}</td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{row.delivery}</td>
                  <td className="max-w-[180px] py-4 pr-4 text-xs text-[var(--muted)]">{row.error ?? "—"}</td>
                  <td className="py-4 pr-4">{row.estimatedCost}</td>
                  <td className="max-w-[240px] py-4 pr-4 text-xs text-[var(--muted)]">{row.bodyPreview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.rows.length === 0 ? (
          <p className="mt-5 text-sm text-[var(--muted)]">No SMS records match these filters.</p>
        ) : null}
      </Card>
    </section>
  );
}
