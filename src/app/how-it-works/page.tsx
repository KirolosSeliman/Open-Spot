import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Comment ça marche",
  description:
    "Découvrez le flux Open Spot : consentement SMS, alerte d'annulation, réponses clients et validation manuelle par le marchand.",
  path: "/how-it-works"
});
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

const steps = [
  "Collect explicit SMS waitlist consent.",
  "Create a last-minute opening.",
  "Send SMS only to eligible opted-in customers.",
  "Review replies in timestamp order.",
  "Manually validate one customer."
];

export default function HowItWorksPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="A lightweight add-on for appointment businesses that already have a booking workflow."
          eyebrow="How it works"
          title="Cancellation recovery, not calendar replacement."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <Card key={step}>
              <p className="text-sm font-semibold text-[var(--primary)]">
                Step {index + 1}
              </p>
              <h2 className="mt-2 text-lg font-bold">{step}</h2>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
