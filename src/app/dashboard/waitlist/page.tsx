import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { QrCode } from "@/components/waitlist/qr-code";
import { requireDashboardUser } from "@/lib/auth/session";

const waitlistUrl = "http://localhost:3000/b/demo-salon/waitlist";

export default async function DashboardWaitlistPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Share the public waitlist link or QR code. Public submissions use a server route and do not expose customer tables."
          eyebrow="Waitlist"
          title="Collect explicit SMS consent before eligibility."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <h2 className="text-lg font-bold">QR waitlist link</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <QrCode value={waitlistUrl} />
              <p className="break-all text-sm leading-6 text-[var(--muted)]">
                {waitlistUrl}
              </p>
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Entries</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
                <option>All services</option>
              </select>
              <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
                <option>Active</option>
                <option>Paused</option>
                <option>Booked</option>
                <option>Removed</option>
              </select>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              Live entries will show source, status, and consent eligibility.
              Customers with `needs_consent` or `opted_out` cannot receive SMS
              offers.
            </p>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
