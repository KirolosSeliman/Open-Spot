import Link from "next/link";

import { ResendAuthEmailForm } from "@/components/auth/resend-auth-email-form";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/i18n/locale";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

const forgotPasswordCopy = {
  fr: {
    eyebrow: "Réinitialisation",
    title: "Mot de passe oublié ?",
    description:
      "Entrez le courriel approuvé de votre commerce pour recevoir un lien de réinitialisation sécurisé.",
    backToSignIn: "Retour à la connexion"
  },
  en: {
    eyebrow: "Password reset",
    title: "Forgot your password?",
    description:
      "Enter the approved email for your business to receive a secure password reset link.",
    backToSignIn: "Back to sign in"
  }
} as const;

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  await redirectAuthenticatedUserByWorkspace();
  const locale = await getRequestLocale();
  const t = forgotPasswordCopy[locale];
  const { email } = await searchParams;

  return (
    <PageShell>
      <section className="os-container-wide grid min-w-0 gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
        <div>
          <p className="os-kicker">{t.eyebrow}</p>
          <h1 className="os-page-title mt-5">{t.title}</h1>
          <p className="os-body-large mt-6">{t.description}</p>
        </div>

        <Card className="min-w-0 p-5 sm:p-7">
          <ResendAuthEmailForm
            defaultEmail={email ?? ""}
            defaultMode="recovery"
            showHeader={false}
          />
          <p className="mt-6 text-center text-sm leading-6 text-[var(--muted)] sm:text-left">
            <Link
              className="font-black text-[var(--primary)] underline-offset-4 hover:underline"
              href="/sign-in"
            >
              {t.backToSignIn}
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
