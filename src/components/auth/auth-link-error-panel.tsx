"use client";

import { ResendAuthEmailForm } from "@/components/auth/resend-auth-email-form";

type AuthLinkErrorPanelProps = {
  defaultEmail?: string;
};

export function AuthLinkErrorPanel({
  defaultEmail = ""
}: AuthLinkErrorPanelProps) {
  return (
    <div className="mb-5">
      <ResendAuthEmailForm
        defaultEmail={defaultEmail}
        defaultMode="signup"
        description="Ce lien a peut-etre expire ou deja ete utilise. Entrez votre email pour recevoir un nouveau lien."
        showModeSwitch
        title="Lien expire ou invalide"
      />
    </div>
  );
}
