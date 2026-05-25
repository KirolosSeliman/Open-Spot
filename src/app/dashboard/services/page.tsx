import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

export default async function ServicesPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Create, edit, and deactivate services with normal price and duration."
          eyebrow="Services"
          title="Keep service setup simple and reusable."
        />
        <Card className="mt-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Service name" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Duration minutes" type="number" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Normal price cents" type="number" />
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
