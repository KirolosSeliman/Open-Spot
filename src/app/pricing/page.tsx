import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

const pricingCards = [
  {
    label: "Starting point",
    title: "Discussed after a call",
    text:
      "Pricing is set after understanding your cancellation volume, services, and current workflow."
  },
  {
    label: "Workflow fit",
    title: "Adapted to your business",
    text:
      "Open Spot is meant to recover missed appointment revenue without forcing you to replace your booking system."
  },
  {
    label: "Before paid rollout",
    title: "Clear limits first",
    text:
      "SMS usage, recovery assumptions, and any commercial model are clarified before launch."
  }
];

export default function PricingPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="No public fixed monthly price is shown because the right setup depends on the merchant's cancellation volume, services, and SMS usage."
          eyebrow="Pricing"
          title="Pricing adapted to your business."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {pricingCards.map((card) => (
            <Card key={card.label}>
              <p className="text-sm font-semibold text-[var(--muted)]">
                {card.label}
              </p>
              <p className="mt-3 text-2xl font-bold">{card.title}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {card.text}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Link
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)]"
            href="/book-call/questions"
          >
            Discuss my business
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
