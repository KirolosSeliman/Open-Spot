import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export default function PricingPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Simple starting price for beta merchants, with commission counted only after the merchant validates a recovered booking."
          eyebrow="Pricing"
          title="CAD 34.99 per month plus recovered booking commission."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold text-[var(--muted)]">
              Base subscription
            </p>
            <p className="mt-3 text-3xl font-bold">CAD 34.99/month</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Merchant dashboard, waitlist, import, SMS simulator, and core
              recovery workflow foundation.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-[var(--muted)]">
              Commission concept
            </p>
            <p className="mt-3 text-3xl font-bold">Configurable later</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Commission applies only after manual merchant validation, not when
              a customer simply replies first.
            </p>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-[var(--muted)]">
              SMS usage
            </p>
            <p className="mt-3 text-3xl font-bold">Fair-use details to finalize</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              No unrealistic unlimited SMS promise. Usage limits and provider
              pass-through costs must be finalized before paid launch.
            </p>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
