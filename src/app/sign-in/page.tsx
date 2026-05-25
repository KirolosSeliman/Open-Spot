import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Authentication is wired for Supabase, but the interactive sign-in form is intentionally deferred until the auth UI phase."
          eyebrow="Sign in"
          title="Merchant access will require Supabase Auth."
        />
        <Card className="mt-8">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Configure `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` before enabling live merchant sign
            in. Service role keys must never be exposed in this page.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
