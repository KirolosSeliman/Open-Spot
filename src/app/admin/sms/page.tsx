import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { getPlatformAdminState } from "@/lib/auth/platform-admin";

export default function AdminSmsPage() {
  const adminState = getPlatformAdminState();

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Monitor SMS volume, failed sends, providers, and opt-out totals without exposing secrets."
          eyebrow="Admin"
          title="SMS operations"
        />
        <Card className="mt-8">
          <p className="text-sm text-[var(--muted)]">{adminState.message}</p>
        </Card>
      </section>
    </PageShell>
  );
}
