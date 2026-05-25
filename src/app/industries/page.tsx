import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

const industries = ["Salons", "Barbers", "Beauty and esthetique"];

export default function IndustriesPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Built first for small appointment-based businesses that lose revenue when a chair sits empty."
          eyebrow="Industries"
          title="Start with beauty, stay flexible for other sectors."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {industries.map((industry) => (
            <Card key={industry}>
              <h2 className="text-lg font-bold">{industry}</h2>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
