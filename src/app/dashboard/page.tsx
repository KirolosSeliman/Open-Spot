import { StatusTile } from "@/components/dashboard/status-tile";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { calculateDashboardMetrics } from "@/lib/reports/metrics";

export default async function DashboardPage() {
  const workspace = await getActiveOrganizationWorkspace();
  const metrics = calculateDashboardMetrics({
    openingsCreated: 0,
    openingsFilled: 0,
    smsSent: 0,
    responsesReceived: 0,
    recoveredBookings: [],
    waitlistCustomers: 0,
    optOuts: 0
  });

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading
          description={
            workspace.status === "ready"
              ? `${workspace.organization.name} is active. Role: ${workspace.organization.role}.`
              : "Supabase environment values are not configured yet, so live merchant data is intentionally unavailable."
          }
          eyebrow="Merchant dashboard"
          title={
            workspace.status === "ready"
              ? `Welcome, ${workspace.organization.name}`
              : "Track openings, replies, and recovered revenue."
          }
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatusTile
            detail="No live SMS sends exist in phase 1."
            label="Openings"
            value={String(metrics.openingsCreated)}
          />
          <StatusTile
            detail="Respondents will be ordered by timestamp."
            label="Replies"
            value={`${metrics.responseRate}%`}
          />
          <StatusTile
            detail="Only validated bookings count."
            label="Recovered revenue"
            value={`CAD ${(metrics.recoveredRevenueCents / 100).toFixed(2)}`}
          />
          <StatusTile
            detail="Customers eligible only after explicit opt-in."
            label="Waitlist customers"
            value={
              workspace.status === "ready"
                ? String(workspace.counts.customers)
                : String(metrics.waitlistCustomers)
            }
          />
          <StatusTile
            detail="Outbound and inbound simulator messages."
            label="SMS sent"
            value={String(metrics.smsSent)}
          />
          <StatusTile
            detail="Estimated only after validation."
            label="Commission estimate"
            value={`CAD ${(metrics.estimatedCommissionCents / 100).toFixed(2)}`}
          />
        </div>
        <Card className="mt-6">
          {workspace.status === "ready" ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="font-semibold">Default language</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {workspace.organization.defaultLanguage}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Timezone</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {workspace.organization.timezone}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Services</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {workspace.counts.services}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Signed in</dt>
                <dd className="mt-1 break-all text-[var(--muted)]">
                  {workspace.user.email ?? workspace.user.id}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">
              Supabase environment values are not configured yet, so live
              merchant data is intentionally unavailable.
            </p>
          )}
        </Card>
      </section>
    </PageShell>
  );
}
