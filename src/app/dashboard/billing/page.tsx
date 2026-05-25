import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

export default async function BillingPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Billing is architecture-ready, but no fake Stripe charging is enabled without configuration."
          eyebrow="Billing"
          title="CAD 34.99/month plus traceable recovered booking commission."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="text-lg font-bold">Subscription status</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Not configured. Stripe webhook handling must be added only when
              Stripe secrets and signature verification are available.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">SMS cost controls</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Daily and monthly counters are modeled. Real sending must check
              limits before provider calls.
            </p>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
