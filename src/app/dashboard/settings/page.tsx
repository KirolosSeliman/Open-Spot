import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Organization settings changes must be role-protected and audited before live persistence."
          eyebrow="Settings"
          title="Configure the merchant workspace."
        />
        <Card className="mt-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Business name" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Business phone" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Business email" />
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>America/Toronto</option>
            </select>
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>English</option>
              <option>Francais</option>
            </select>
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="SMS sending window" />
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
