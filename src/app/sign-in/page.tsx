import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signInAction } from "@/lib/auth/actions";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  await redirectAuthenticatedUserByWorkspace();
  const { error } = await searchParams;

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Sign in with your merchant email and password to manage your cancellation recovery workspace."
          eyebrow="Sign in"
          title="Access your Open Spot dashboard."
        />
        <Card className="mt-8">
          {error ? (
            <p className="mb-4 rounded-md border border-[#f2b8b5] bg-[#fdebea] p-3 text-sm text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <form action={signInAction} className="grid gap-4">
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
            <Button type="submit">Sign in</Button>
          </form>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Pas encore de compte ?{" "}
            <Link
              className="font-bold text-[var(--primary-strong)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href="/signup"
            >
              Créer un compte
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
