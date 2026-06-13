import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { markComplianceReviewAction } from "@/lib/admin/actions";
import { loadAdminCompliance } from "@/lib/admin/compliance";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const numberFormatter = new Intl.NumberFormat("en-CA");

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </Card>
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
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    notFound();
  }

  const result = await loadAdminCompliance({
    admin: access.admin,
    organizationId: id,
    searchParams: resolvedSearchParams,
    auditAction: "admin.organization.compliance_viewed"
  });

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Company compliance
          </p>
          <h1 className="mt-2 text-3xl font-black">Compliance</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Read-only operational compliance view. Reviews do not change consent.
          </p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black" href={`/admin/organizations/${id}`}>
          Back to company
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Opted out" value={numberFormatter.format(result.metrics.optedOutCustomers)} />
        <Metric label="Potential risky sends" value={numberFormatter.format(result.metrics.potentialRiskySends)} />
        <Metric label="Missing consent" value={numberFormatter.format(result.metrics.missingConsentRecords)} />
        <Metric label="Missing callbacks" value={numberFormatter.format(result.metrics.missingStatusCallbacks)} />
      </div>

      <Card>
        <h2 className="text-lg font-black">Issues</h2>
        <div className="mt-4 grid gap-3">
          {result.issues.map((issue) => (
            <div className="rounded-2xl border border-[var(--line)] p-4" key={issue.key}>
              <p className="font-black">{issue.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {issue.severity} · {issue.status} · {issue.evidence}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{issue.description}</p>
              <form action={markComplianceReviewAction} className="mt-4 flex flex-wrap gap-2">
                <input name="organizationId" type="hidden" value={id} />
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
            <p className="text-sm text-[var(--muted)]">No compliance issues match this scope.</p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
