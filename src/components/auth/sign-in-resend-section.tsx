"use client";

import Link from "next/link";
import { useState } from "react";

import { ResendAuthEmailForm } from "@/components/auth/resend-auth-email-form";
import { Button, ButtonLink } from "@/components/ui/button";

type SignInResendSectionProps = {
  defaultEmail?: string;
  defaultOpen?: boolean;
  errorMessage?: string | null;
};

export function SignInResendSection({
  defaultEmail = "",
  defaultOpen = false,
  errorMessage = null
}: SignInResendSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <div className="mb-5 rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
        {errorMessage ? (
          <div className="mb-4">
            <p className="text-sm font-black text-[var(--foreground)]">
              Lien expire ou invalide
            </p>
            <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Ce lien a peut-etre expire ou deja ete utilise. Vous pouvez demander un
              nouvel email ou creer votre compte avec l&apos;email accepte par Open Spot.
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">
            Vous avez recu un email d&apos;invitation ou de creation de compte ?
          </p>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            onClick={() => setOpen(true)}
            type="button"
            variant="secondary"
          >
            Renvoyer l&apos;email
          </Button>
          <ButtonLink className="w-full sm:w-auto" href="/signup" variant="outline">
            Creer mon compte
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-[var(--line)] bg-slate-50 p-4 sm:p-5">
      {errorMessage ? (
        <div className="mb-4">
          <p className="text-sm font-black text-[var(--foreground)]">
            Lien expire ou invalide
          </p>
          <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </p>
        </div>
      ) : null}
      <ResendAuthEmailForm
        defaultEmail={defaultEmail}
        defaultMode="signup"
        description="Entrez votre email pour recevoir un nouveau lien de creation de compte ou de reinitialisation."
        showModeSwitch
        title="Renvoyer l'email"
      />
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        Vous preferez creer votre acces directement ?{" "}
        <Link
          className="font-black text-[var(--primary)] underline-offset-4 hover:underline"
          href="/signup"
        >
          Creer mon compte
        </Link>
      </p>
    </div>
  );
}
