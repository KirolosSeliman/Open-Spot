import { StatusTile } from "@/components/dashboard/status-tile";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";
import { calculateDashboardMetrics } from "@/lib/reports/metrics";

export default async function DashboardPage() {
  const auth = await requireDashboardUser();
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
          description="Operational placeholder for merchants. Later phases will connect this to Supabase data and RLS-protected organization state."
          eyebrow="Merchant dashboard"
          title="Track openings, replies, and recovered revenue."
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
            value={String(metrics.waitlistCustomers)}
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
          <p className="text-sm leading-6 text-[var(--muted)]">
            {auth.status === "unconfigured"
              ? "Supabase environment values are not configured yet, so live merchant data is intentionally unavailable."
              : `Signed in as ${auth.user.email ?? auth.user.id}. Live organization data will be added through RLS-protected queries.`}
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
