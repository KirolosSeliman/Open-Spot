import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

const summaryItems = [
  ["Total rows", "0"],
  ["Imported", "0"],
  ["Skipped duplicates", "0"],
  ["Invalid phones", "0"],
  ["Needs consent", "0"],
  ["Opted in", "0"],
  ["Opted out", "0"]
];

export default async function ImportPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="CSV parsing and validation are implemented in server-side utilities. Live import persistence will use organization-scoped server actions."
          eyebrow="Import"
          title="Import customers without silently opting them in."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <h2 className="text-lg font-bold">Upload CSV</h2>
            <input
              accept=".csv,text/csv"
              className="mt-4 w-full rounded-md border border-[var(--line)] bg-white p-3"
              type="file"
            />
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Required mapping: name and phone. Consent values without proof are
              treated as `needs_consent`.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Import result summary</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {summaryItems.map(([label, value]) => (
                <div
                  className="rounded-md border border-[var(--line)] bg-[#fbfbf8] p-3"
                  key={label}
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1 text-xl font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
