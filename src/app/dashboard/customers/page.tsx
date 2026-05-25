import { ConsentBadge } from "@/components/customers/consent-badge";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

const sampleRows = [
  {
    name: "No customer data loaded",
    phone: "+1 --- --- ----",
    consent: "needs_consent" as const,
    waitlist: "Not connected"
  }
];

export default async function CustomersPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Manage customers and consent status. Live data requires Supabase configuration and organization context."
          eyebrow="Customers"
          title="Customer records must stay tied to one organization."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="min-h-11 min-w-0 rounded-md border border-[var(--line)] px-3"
                placeholder="Search by name or phone"
                type="search"
              />
              <select className="min-h-11 min-w-0 rounded-md border border-[var(--line)] px-3">
                <option>All consent statuses</option>
                <option>Opted in</option>
                <option>Needs consent</option>
                <option>Opted out</option>
              </select>
            </div>
            <div className="mt-5 max-w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[var(--muted)]">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Consent</th>
                    <th className="py-2">Waitlist</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row) => (
                    <tr className="border-t border-[var(--line)]" key={row.phone}>
                      <td className="py-3">{row.name}</td>
                      <td className="py-3">{row.phone}</td>
                      <td className="py-3">
                        <ConsentBadge status={row.consent} />
                      </td>
                      <td className="py-3">{row.waitlist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="min-w-0">
            <h2 className="text-lg font-bold">Add customer</h2>
            <div className="mt-4 grid gap-3">
              <input className="min-h-11 min-w-0 rounded-md border border-[var(--line)] px-3" placeholder="Full name" />
              <input className="min-h-11 min-w-0 rounded-md border border-[var(--line)] px-3" placeholder="+1 514 000 0000" />
              <input className="min-h-11 min-w-0 rounded-md border border-[var(--line)] px-3" placeholder="Email optional" />
              <select className="min-h-11 min-w-0 rounded-md border border-[var(--line)] px-3">
                <option>Needs consent</option>
                <option>Opted in with staff-added proof</option>
                <option>Opted out</option>
              </select>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Opted-in manual entries must record `staff_added`, consent copy,
                timestamp, and actor ID through the server action before live use.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
