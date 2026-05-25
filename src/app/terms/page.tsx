import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Draft terms placeholder. Final legal terms must be reviewed before beta merchants rely on them."
          eyebrow="Terms"
          title="Merchant validation remains required."
        />
        <Card className="mt-8">
          <p className="text-sm leading-6 text-[var(--muted)]">
            2e Chance RDV helps merchants contact opted-in customers. It does not
            automatically book appointments or replace the merchant&apos;s scheduling
            system.
          </p>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)]">
            <li>Merchants are responsible for imported contact consent.</li>
            <li>No guarantee is made that every cancellation will be filled.</li>
            <li>Customers can reply STOP to unsubscribe from SMS.</li>
            <li>This placeholder requires legal review before production use.</li>
          </ul>
        </Card>
      </section>
    </PageShell>
  );
}
