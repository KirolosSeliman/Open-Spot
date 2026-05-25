import { StatusTile } from "@/components/dashboard/status-tile";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";
import { calculateDashboardMetrics } from "@/lib/reports/metrics";

export default async function ReportsPage() {
  await requireDashboardUser();
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
          description="Filter by date range, service, and status once live data is connected."
          eyebrow="Reports"
          title="Measure recovered revenue only after validation."
        />
        <Card className="mt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" type="date" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" type="date" />
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>All services</option>
            </select>
          </div>
        </Card>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatusTile label="Recovered revenue" value={`CAD ${(metrics.recoveredRevenueCents / 100).toFixed(2)}`} detail="Confirmed bookings only." />
          <StatusTile label="Filled openings" value={String(metrics.openingsFilled)} detail="Openings validated by merchant." />
          <StatusTile label="Opt-outs" value={String(metrics.optOuts)} detail="Excluded from future sends." />
        </div>
      </section>
    </PageShell>
  );
}
