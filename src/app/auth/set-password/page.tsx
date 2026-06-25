import { redirect } from "next/navigation";

import { ResendAuthEmailForm } from "@/components/auth/resend-auth-email-form";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { setPasswordAction } from "@/lib/auth/set-password-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { error } = await searchParams;

  if (!user) {
    return (
      <PageShell>
        <section className="os-container-wide py-12 sm:py-16 lg:py-24">
          <Card className="mx-auto max-w-lg p-5 sm:p-7">
            <ResendAuthEmailForm
              defaultEmail=""
              defaultMode="signup"
              description="Votre lien semble expire ou a deja ete utilise. Entrez votre email pour recevoir un nouveau lien."
              showModeSwitch
              title="Lien expire ou invalide"
            />
          </Card>
        </section>
      </PageShell>
    );
  }

  if (error) {
    redirect(`/sign-in?auth_error=expired_or_invalid_link&email=${encodeURIComponent(user.email ?? "")}`);
  }

  return (
    <PageShell>
      <section className="os-container-wide py-12 sm:py-16 lg:py-24">
        <Card className="mx-auto max-w-lg p-5 sm:p-7">
          <p className="os-kicker">Acces securise</p>
          <h1 className="os-page-title mt-4">Creez votre mot de passe</h1>
          <p className="os-body-large mt-4">
            Votre acces a Open Spot a ete cree. Choisissez un mot de passe pour
            acceder a votre espace.
          </p>

          <form action={setPasswordAction} className="mt-6 grid gap-5">
            <FormField htmlFor="password" label="Mot de passe" required>
              <Input
                id="password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </FormField>
            <FormField htmlFor="confirmPassword" label="Confirmer le mot de passe" required>
              <Input
                id="confirmPassword"
                minLength={8}
                name="confirmPassword"
                required
                type="password"
              />
            </FormField>
            <Button className="w-full" type="submit">
              Enregistrer mon mot de passe
            </Button>
          </form>
        </Card>
      </section>
    </PageShell>
  );
}
