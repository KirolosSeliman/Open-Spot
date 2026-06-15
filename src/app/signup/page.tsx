import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { signUpAction } from "@/lib/auth/actions";
import { getRequestLocale } from "@/lib/i18n/locale";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const signupCopy = {
  fr: {
    eyebrow: "Créer un compte",
    title: "Lancez votre espace Open Spot.",
    description:
      "Créez votre compte marchand, puis configurez le commerce qui possédera les clients, services, ouvertures et messages SMS.",
    email: "Email",
    password: "Mot de passe",
    passwordHelp: "Minimum 8 caractères.",
    submit: "Créer un compte",
    hasAccount: "Déjà un compte ?",
    signIn: "Se connecter",
    note:
      "Si la confirmation email est activée dans Supabase, confirmez l’email avant de continuer l’onboarding.",
    panelTitle: "Après l’inscription",
    panelItems: ["Créer le commerce", "Définir la langue", "Ajouter services et clients consentants"]
  },
  en: {
    eyebrow: "Create account",
    title: "Start your Open Spot workspace.",
    description:
      "Create your merchant account, then configure the business that owns customers, services, openings, and SMS messages.",
    email: "Email",
    password: "Password",
    passwordHelp: "Minimum 8 characters.",
    submit: "Create account",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    note:
      "If email confirmation is enabled in Supabase, confirm the email before continuing onboarding.",
    panelTitle: "After signup",
    panelItems: ["Create the business", "Set the language", "Add services and opted-in customers"]
  }
} as const;

export default async function SignupPage({ searchParams }: SignupPageProps) {
  await redirectAuthenticatedUserByWorkspace();
  const locale = await getRequestLocale();
  const t = signupCopy[locale];
  const { error } = await searchParams;

  return (
    <PageShell>
      <section className="os-container-wide grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-24">
        <div>
          <p className="os-kicker">{t.eyebrow}</p>
          <h1 className="os-page-title mt-5">{t.title}</h1>
          <p className="os-body-large mt-6">{t.description}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {t.panelItems.map((item) => (
              <div className="rounded-3xl border border-[var(--line)] bg-white p-4 text-sm font-black shadow-sm" key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-5 sm:p-7">
          <h2 className="text-2xl font-black">{t.panelTitle}</h2>
          {error ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}
          <form action={signUpAction} className="mt-5 grid gap-5">
            <FormField htmlFor="email" label={t.email} required>
              <Input id="email" name="email" required type="email" />
            </FormField>
            <FormField
              helperText={t.passwordHelp}
              htmlFor="password"
              label={t.password}
              required
            >
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
            {t.hasAccount}{" "}
            <Link
              className="font-black text-[var(--primary)] underline-offset-4 hover:underline"
              href="/sign-in"
            >
              {t.signIn}
            </Link>
          </p>
          <p className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
            {t.note}
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
