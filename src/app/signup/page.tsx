import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/i18n/locale";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";

const copy = {
  fr: {
    eyebrow: "Accès par invitation",
    title: "Votre compte est créé depuis votre invitation.",
    description:
      "Pour protéger les données de chaque commerce, la création de compte public est désactivée.",
    help: "Ouvrez le lien d'invitation ou de réinitialisation envoyé par Open Spot. Si le lien a expiré, demandez un nouveau lien.",
    signIn: "Vous avez déjà un compte ? Connexion",
    requestLink: "Demander un lien d'accès"
  },
  en: {
    eyebrow: "Invitation access",
    title: "Your account is created from your invitation.",
    description:
      "To protect each business workspace, public account creation is disabled.",
    help: "Open the invitation or password setup link sent by Open Spot. If the link expired, request a new one.",
    signIn: "Already have an account? Sign in",
    requestLink: "Request an access link"
  }
} as const;

export default async function SignupPage() {
  await redirectAuthenticatedUserByWorkspace();
  const locale = await getRequestLocale();
  const t = copy[locale];

  return (
    <PageShell>
      <section className="os-container-wide grid min-w-0 gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
        <div>
          <p className="os-kicker">{t.eyebrow}</p>
          <h1 className="os-page-title mt-5">{t.title}</h1>
          <p className="os-body-large mt-6">{t.description}</p>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{t.help}</p>
          <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
            <Link
              className="font-black text-[var(--primary)] underline-offset-4 hover:underline"
              href="/sign-in"
            >
              {t.signIn}
            </Link>
          </p>
        </div>

        <Card className="min-w-0 p-5 sm:p-7">
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#DDE5F0] bg-[#F8FAFD] p-5">
              <p className="text-sm font-black text-[#07142F]">{t.eyebrow}</p>
              <p className="mt-3 text-sm leading-6 text-[#50617D]">{t.help}</p>
            </div>
            <Link
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--primary-strong)]"
              href="/sign-in"
            >
              {t.requestLink}
            </Link>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
