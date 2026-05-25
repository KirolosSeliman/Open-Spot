import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { getPlatformAdminState } from "@/lib/auth/platform-admin";

export default function AdminReportsPage() {
  const adminState = getPlatformAdminState();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Platform reports must aggregate only authorized organization data."
          eyebrow="Admin"
          title="Platform reports"
        />
        <Card className="mt-8">
          <p className="text-sm text-[var(--muted)]">{adminState.message}</p>
        </Card>
      </section>
    </PageShell>
  );
}
