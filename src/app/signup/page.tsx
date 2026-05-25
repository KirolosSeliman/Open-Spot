import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Initial onboarding captures business basics, language, services, QR waitlist setup, and customer import next steps."
          eyebrow="Onboarding"
          title="Set up your cancellation recovery workspace."
        />
        <Card className="mt-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Organization name" />
            <input className="min-h-11 rounded-md border border-[var(--line)] px-3" placeholder="Business type" />
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>English</option>
              <option>Francais</option>
            </select>
            <select className="min-h-11 rounded-md border border-[var(--line)] px-3">
              <option>America/Toronto</option>
            </select>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            After account creation, merchants should add services, copy the
            waitlist QR link, and import customers without automatic opt-in.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
