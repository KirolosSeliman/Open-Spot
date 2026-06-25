import { Suspense } from "react";

import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";
import { AuthStateCard } from "@/components/auth/auth-state-card";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthStateCard
          action={null}
          description="Nous préparons votre accès sécurisé à Open Spot."
          title="Vérification du lien…"
        />
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
