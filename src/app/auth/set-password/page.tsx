import { redirect } from "next/navigation";

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

  if (!user && !error) {
    redirect(
      `/sign-in?error=${encodeURIComponent("Ce lien d'acces est invalide ou a expire. Contactez l'administrateur pour recevoir un nouveau lien.")}`
    );
  }

  return (
    <PageShell>
      <section className="os-container-wide py-12 sm:py-16 lg:py-24">
        <Card className="mx-auto max-w-lg p-5 sm:p-7">
          <p className="os-kicker">Acces securise</p>
          <h1 className="os-page-title mt-4">Creez votre mot de passe</h1>
          <p className="os-body-large mt-4">
            Votre acces a 2e Chance RDV a ete cree. Choisissez un mot de passe pour
            acceder a votre espace.
          </p>

          {error ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <form action={setPasswordAction} className="mt-6 grid gap-5">
            <FormField htmlFor="password" label="Nouveau mot de passe" required>
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
