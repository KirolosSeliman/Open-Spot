"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { AuthBackToSignInLink, AuthStateCard } from "@/components/auth/auth-state-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/form-field";
import { setPasswordAction } from "@/lib/auth/set-password-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SetPasswordView = "checking" | "form" | "no-session";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full"
      disabled={pending}
      isLoading={pending}
      loadingText="Enregistrement…"
      type="submit"
    >
      Enregistrer mon mot de passe
    </Button>
  );
}

export function SetPasswordForm() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<SetPasswordView>("checking");
  const errorMessage = searchParams.get("error");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      setView(session ? "form" : "no-session");
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (view === "checking") {
    return (
      <AuthStateCard
        action={null}
        description="Nous vérifions votre accès sécurisé."
        kicker="Création du mot de passe"
        title="Vérification de votre session…"
      />
    );
  }

  if (view === "no-session") {
    return (
      <AuthStateCard
        action={<AuthBackToSignInLink />}
        description="Demandez à l'administrateur Open Spot de renvoyer l'invitation depuis la page Company Overview."
        kicker="Création du mot de passe"
        title="Votre session a expiré"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="os-container-wide py-12 sm:py-16 lg:py-24">
        <Card className="mx-auto max-w-lg p-5 sm:p-7">
          <p className="os-kicker">Création du mot de passe</p>
          <h1 className="os-page-title mt-4">Créez votre mot de passe.</h1>
          <p className="os-body-large mt-4">
            Définissez le mot de passe qui vous permettra d&apos;accéder à votre espace
            Open Spot.
          </p>

          {errorMessage ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <form action={setPasswordAction} className="mt-6 grid gap-5">
            <FormField htmlFor="password" label="Nouveau mot de passe" required>
              <Input id="password" minLength={8} name="password" required type="password" />
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
            <SubmitButton />
          </form>
        </Card>
      </section>
    </main>
  );
}
