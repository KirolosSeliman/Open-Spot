import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { requireDashboardUser } from "@/lib/auth/session";

export default async function OpeningsPage() {
  await requireDashboardUser();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Create openings, send simulator-safe SMS offers, and review replies before manual validation."
          eyebrow="Openings"
          title="The first reply is never automatically confirmed."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard/openings/new">New opening</ButtonLink>
          <ButtonLink href="/dashboard/openings/demo-opening" variant="secondary">
            Preview opening detail
          </ButtonLink>
        </div>
        <Card className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">No live openings loaded</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Supabase-backed organization queries will populate this list.
              </p>
            </div>
            <Link className="text-sm font-semibold text-[var(--primary)]" href="/dashboard/waitlist">
              Review waitlist eligibility
            </Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
