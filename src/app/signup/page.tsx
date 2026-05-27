import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signUpAction } from "@/lib/auth/actions";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  await redirectAuthenticatedUserByWorkspace();
  const { error } = await searchParams;

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Create your merchant account first, then set up your organization workspace."
          eyebrow="Sign up"
          title="Start your Open Spot account."
        />
        <Card className="mt-8">
          {error ? (
            <p className="mb-4 rounded-md border border-[#f2b8b5] bg-[#fdebea] p-3 text-sm text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <form action={signUpAction} className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold" htmlFor="email">
              Email
              <input
                className="min-h-11 rounded-md border border-[var(--line)] px-3"
                id="email"
                name="email"
                required
                type="email"
              />
            </label>
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="password"
            >
              Password
              <input
                className="min-h-11 rounded-md border border-[var(--line)] px-3"
                id="password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </label>
            <Button type="submit">Create account</Button>
          </form>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Déjà un compte ?{" "}
            <Link
              className="font-black text-[var(--primary-strong)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href="/sign-in"
            >
              Se connecter
            </Link>
          </p>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            If email confirmation is enabled in Supabase, confirm the email and
            sign in before organization onboarding.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
