import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

export default async function SmsPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Review outbound, inbound, failed, and simulator messages without exposing provider secrets."
          eyebrow="SMS"
          title="SMS logs stay organization-scoped."
        />
        <Card className="mt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Search phone or customer" />
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>All directions</option>
              <option>Outbound</option>
              <option>Inbound</option>
            </select>
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>All statuses</option>
              <option>Sent</option>
              <option>Failed</option>
              <option>Received</option>
            </select>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Live SMS rows will include provider, status, related customer,
            related opening, and error message.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
