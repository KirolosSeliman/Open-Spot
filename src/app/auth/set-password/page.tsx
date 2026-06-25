import { Suspense } from "react";

import { SetPasswordForm } from "@/components/auth/set-password-form";
import { AuthStateCard } from "@/components/auth/auth-state-card";

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthStateCard
          action={null}
          description="Nous vérifions votre accès sécurisé."
          kicker="Création du mot de passe"
          title="Vérification de votre session…"
        />
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
