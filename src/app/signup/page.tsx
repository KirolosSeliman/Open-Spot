import Link from "next/link";

import { CreateAccountForm } from "@/components/auth/create-account-form";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/i18n/locale";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";

const copy = {
  fr: {
    eyebrow: "Creation de compte",
    title: "Creez votre compte Open Spot.",
    description:
      "Utilisez le meme email que celui transmis lors de votre demande. Si votre commerce a ete accepte, vous pourrez creer votre acces.",
    help: "Votre commerce doit d'abord avoir ete accepte par Open Spot."
  },
  en: {
    eyebrow: "Account creation",
    title: "Create your Open Spot account.",
    description:
      "Use the same email you shared during your request. If your business was accepted, you can create your access.",
    help: "Your business must first have been accepted by Open Spot."
  }
} as const;

export default async function SignupPage() {
  await redirectAuthenticatedUserByWorkspace();
  const locale = await getRequestLocale();
  const t = copy[locale];

  return (
    <PageShell>
      <section className="os-container-wide grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
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
              Vous avez deja un compte ? Connexion
            </Link>
          </p>
        </div>

        <Card className="p-5 sm:p-7">
          <CreateAccountForm />
        </Card>
      </section>
    </PageShell>
  );
}
