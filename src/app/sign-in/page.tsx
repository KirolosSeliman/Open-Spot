import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { signInAction } from "@/lib/auth/actions";
import { getRequestLocale } from "@/lib/i18n/locale";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    redirect?: string;
  }>;
};

const signInCopy = {
  fr: {
    eyebrow: "Connexion",
    title: "Accédez à votre espace Open Spot.",
    description:
      "Connectez-vous pour gérer les ouvertures, les réponses SMS, la liste d’attente et la validation manuelle.",
    email: "Email",
    password: "Mot de passe",
    submit: "Connexion",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte"
  },
  en: {
    eyebrow: "Sign in",
    title: "Access your Open Spot workspace.",
    description:
      "Sign in to manage openings, SMS replies, the waitlist, and manual validation.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    noAccount: "No account yet?",
    createAccount: "Create account"
  }
} as const;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  await redirectAuthenticatedUserByWorkspace();
  const locale = await getRequestLocale();
  const t = signInCopy[locale];
  const { error, redirect } = await searchParams;

  return (
    <PageShell>
      <section className="os-container-wide grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
        <div>
          <p className="os-kicker">{t.eyebrow}</p>
          <h1 className="os-page-title mt-5">{t.title}</h1>
          <p className="os-body-large mt-6">{t.description}</p>
        </div>

        <Card className="p-5 sm:p-7">
          {error ? (
            <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}
          <form action={signInAction} className="grid gap-5">
            {redirect ? (
              <input name="redirect" type="hidden" value={redirect} />
            ) : null}
            <FormField htmlFor="email" label={t.email} required>
              <Input id="email" name="email" required type="email" />
            </FormField>
            <FormField htmlFor="password" label={t.password} required>
              <Input
                id="password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </FormField>
            <Button className="w-full" type="submit">{t.submit}</Button>
          </form>
          <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
            {t.noAccount}{" "}
            <Link
              className="font-black text-[var(--primary)] underline-offset-4 hover:underline"
              href="/signup"
            >
              {t.createAccount}
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
