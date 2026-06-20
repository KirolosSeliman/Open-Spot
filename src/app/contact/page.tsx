import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Share your appointment workflow and Open Spot will follow up with a practical setup recommendation."
          eyebrow="Contact"
          title="Talk to Open Spot."
        />
        <Card className="mt-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              Request a 15-minute call.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
              The request form captures your contact details, consent, and notes so
              the Open Spot team can follow up by SMS or email without pretending
              anything has already been booked.
            </p>
            <Link className="os-primary-cta mt-7" href="/book-call">
              Request a call
            </Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
