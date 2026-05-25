import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { requireDashboardUser } from "@/lib/auth/session";

type OpeningDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const respondents = [
  { name: "First respondent", response: "OUI", rank: 1, status: "responded" },
  { name: "Second respondent", response: "YES", rank: 2, status: "responded" }
];

export default async function OpeningDetailPage({ params }: OpeningDetailPageProps) {
  const { id } = await params;
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading
          description={`Opening ${id}. Respondents are ordered by response time, but merchant validation decides the winner.`}
          eyebrow="Opening detail"
          title="Review replies before validating one customer."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card className="min-w-0">
            <h2 className="text-lg font-bold">Respondents</h2>
            <div className="mt-4 grid gap-3">
              {respondents.map((respondent) => (
                <div className="rounded-md border border-[var(--line)] p-3" key={respondent.rank}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      #{respondent.rank} {respondent.name}
                    </p>
                    <span className="rounded-full bg-[#dff5eb] px-2.5 py-1 text-xs font-semibold text-[#166044]">
                      {respondent.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Reply: {respondent.response}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">Manual validation</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Validation must call the atomic database function, fill the
              opening once, reject other offers, create a recovered booking, and
              send confirmation/unavailable messages.
            </p>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
