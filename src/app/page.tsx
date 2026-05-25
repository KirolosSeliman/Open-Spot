import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const principles = [
  "Customers reply by SMS. No customer app required.",
  "Imported customers need clear consent before recovery messages.",
  "Merchants manually validate the recovered booking before confirmation."
];

const sections = [
  ["Problem", "Last-minute cancellations create empty chairs, lost revenue, and rushed manual messaging."],
  ["How it works", "Import customers, collect QR waitlist opt-ins, create an opening, send SMS, review replies, and validate one customer."],
  ["Not a booking system", "2e Chance RDV works beside Fresha, Booksy, Square, phone booking, DMs, or a paper agenda."],
  ["Manual validation", "Replying YES or OUI requests the spot. The merchant still chooses and confirms the customer."],
  ["Recovered revenue dashboard", "Reports focus on validated bookings, response rate, opt-outs, and commission estimates."]
];

export default function HomePage() {
  return (
    <PageShell>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
        <div>
          <SectionHeading
            description="2e Chance RDV helps salons, barbers, and beauty businesses recover lost revenue with a simple SMS waitlist, customer import, QR signup, and manual booking validation."
            eyebrow="SMS-first cancellation recovery"
            title="Fill last-minute cancellations by SMS without changing your current booking system."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/pricing">View pricing</ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Preview dashboard
            </ButtonLink>
          </div>
        </div>
        <Card className="self-start">
          <p className="text-sm font-semibold text-[var(--primary)]">
            Launch constraints
          </p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[var(--muted)]">
            {principles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-14 sm:px-6 md:grid-cols-2">
        {sections.map(([title, description]) => (
          <Card key={title}>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
