import Link from "next/link";

import { Card } from "@/components/ui/card";
import { markComplianceReviewAction } from "@/lib/admin/actions";
import { loadAdminCompliance } from "@/lib/admin/compliance";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const numberFormatter = new Intl.NumberFormat("en-CA");

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card>
      <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-black">{value}</p>
      {note ? <p className="mt-2 text-xs text-[var(--muted)]">{note}</p> : null}
    </Card>
  );
}

export default async function AdminCompliancePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    return (
      <section className="grid gap-6">
        <h1 className="text-3xl font-black">Compliance</h1>
        <Card>
          <p className="text-sm text-[var(--muted)]">
            {access.status === "unconfigured" ? access.message : "Admin access required."}
          </p>
        </Card>
      </section>
    );
  }

  const result = await loadAdminCompliance({
    admin: access.admin,
    searchParams: resolvedSearchParams
  });

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black">Compliance dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Operational SMS compliance visibility only. This is not legal advice,
          and reviews do not change customer consent or override opt-outs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Opted-out customers" value={numberFormatter.format(result.metrics.optedOutCustomers)} />
        <Metric label="Potential risky sends" note="Current consent comparison" value={numberFormatter.format(result.metrics.potentialRiskySends)} />
        <Metric label="Missing consent" value={numberFormatter.format(result.metrics.missingConsentRecords)} />
        <Metric label="Unlinked replies" value={numberFormatter.format(result.metrics.unlinkedInboundReplies)} />
        <Metric label="Missing callbacks" value={numberFormatter.format(result.metrics.missingStatusCallbacks)} />
        <Metric label="Unknown replies" value={numberFormatter.format(result.metrics.unknownReplies)} />
        <Metric label="Failed SMS rate" value={`${Math.round(result.metrics.failedSmsRate * 100)}%`} />
        <Metric label="SMS paused" value={numberFormatter.format(result.metrics.organizationsWithSmsPaused)} />
        <Metric label="Disabled companies" value={numberFormatter.format(result.metrics.organizationsDisabled)} />
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.status} name="status">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3" defaultValue={result.filters.severity} name="severity">
            <option value="all">All severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4" defaultValue={result.filters.q} name="q" placeholder="Search issues" type="search" />
          <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Compliance issues</h2>
        <div className="mt-4 grid gap-3">
          {result.issues.map((issue) => (
            <div className="rounded-2xl border border-[var(--line)] p-4" key={issue.key}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{issue.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {issue.organizationId ? (
                      <Link className="underline-offset-4 hover:underline" href={`/admin/organizations/${issue.organizationId}/compliance`}>
                        {issue.organizationName}
                      </Link>
                    ) : (
                      issue.organizationName
                    )}{" "}
                    · {issue.severity} · {issue.status}
                  </p>
                </div>
                <p className="text-sm font-black">{issue.evidence}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{issue.description}</p>
              <form action={markComplianceReviewAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                <input name="organizationId" type="hidden" value={issue.organizationId ?? ""} />
                <input name="issueKey" type="hidden" value={issue.key} />
                <input name="issueType" type="hidden" value={issue.type} />
                <input name="severity" type="hidden" value={issue.severity} />
                <input className="min-h-10 rounded-2xl border border-[var(--line)] bg-white px-3 text-sm" name="note" placeholder="Internal note" />
                <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black" name="status" type="submit" value="reviewed">
                  Reviewed
                </button>
                <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black" name="status" type="submit" value="resolved">
                  Resolved
                </button>
                <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-black" name="status" type="submit" value="dismissed">
                  Dismiss
                </button>
              </form>
            </div>
          ))}
          {result.issues.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No compliance issues match these filters.</p>
          ) : null}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Recent opt-outs</h2>
        <div className="mt-4 grid gap-3">
          {result.recentOptOuts.map((optOut) => (
            <div className="rounded-2xl border border-[var(--line)] p-4" key={optOut.id}>
              <p className="font-black">{optOut.organizationName}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {optOut.customerName} · {optOut.phoneMasked} · {optOut.source}
              </p>
              {optOut.bodyPreview ? <p className="mt-2 text-sm">{optOut.bodyPreview}</p> : null}
            </div>
          ))}
          {result.recentOptOuts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No recent opt-outs in this range.</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
