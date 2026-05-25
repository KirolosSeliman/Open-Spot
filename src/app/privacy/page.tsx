import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Draft privacy page for beta preparation. Legal review is required before production launch."
          eyebrow="Privacy"
          title="Privacy commitments start with consent and tenant isolation."
        />
        <Card className="mt-8">
          <ul className="grid gap-3 text-sm leading-6 text-[var(--muted)]">
            <li>Imported customers are not opted in without proof.</li>
            <li>Opted-out customers must be excluded from future recovery SMS.</li>
            <li>Organization data must remain isolated by RLS and server checks.</li>
            <li>Customers can request data deletion through the merchant or platform support process.</li>
            <li>This placeholder requires legal review before production use.</li>
          </ul>
        </Card>
      </section>
    </PageShell>
  );
}
