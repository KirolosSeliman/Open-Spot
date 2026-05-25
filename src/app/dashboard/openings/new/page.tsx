import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

export default async function NewOpeningPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Draft openings first. Sending SMS offers requires eligible opted-in customers and server-side checks."
          eyebrow="New opening"
          title="Create a last-minute opening."
        />
        <Card className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Opening title" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Service optional" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" type="datetime-local" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Duration minutes" type="number" />
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>No discount</option>
              <option>Fixed amount</option>
              <option>Percentage</option>
              <option>Custom offer label</option>
            </select>
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Normal price cents" type="number" />
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            This form is intentionally not wired to persistence until organization
            context and server actions are connected.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
