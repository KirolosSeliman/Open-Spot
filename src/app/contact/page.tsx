import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="This placeholder keeps the public route ready while beta contact channels are finalized."
          eyebrow="Contact"
          title="Talk to 2e Chance RDV."
        />
        <Card className="mt-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Business name" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Your name" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Email" type="email" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Phone" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Business type" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Current booking system" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Estimated cancellations per week" type="number" />
            <textarea className="min-h-24 rounded-md border border-[var(--line)] px-3 py-2 sm:col-span-2" placeholder="Message" />
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
