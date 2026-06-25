"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resendCompanyOwnerInvitationAction } from "@/lib/admin/owner-invitation-actions";
import { Button } from "@/components/ui/button";

const methodLabels = {
  invite: "invitation",
  recovery: "réinitialisation du mot de passe",
  signup_resend: "confirmation de compte"
} as const;

export function ResendOwnerInvitationButton({
  disabled = false,
  organizationId,
  ownerEmail
}: {
  disabled?: boolean;
  organizationId: string;
  ownerEmail: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");
  const [isPending, startTransition] = useTransition();
  const missingEmail = !ownerEmail?.trim();

  function handleResend() {
    if (missingEmail) {
      setTone("error");
      setDetail(null);
      setMessage("Aucun courriel propriétaire n'est associé à cette compagnie.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      setDetail(null);

      const result = await resendCompanyOwnerInvitationAction(organizationId);

      if (result.ok) {
        setTone("success");
        setMessage(result.message);
        setDetail(
          `Envoyé à : ${result.sentTo}. Méthode : ${methodLabels[result.method]}.`
        );
      } else {
        setTone("error");
        setMessage(result.message);
      }

      router.refresh();
    });
  }

  return (
    <div className="mt-5 border-t border-[var(--line)] pt-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
        Invitation propriétaire
      </p>
      <Button
        className="mt-3 w-full sm:w-auto"
        disabled={disabled || isPending || missingEmail}
        isLoading={isPending}
        loadingText="Envoi en cours…"
        onClick={handleResend}
        type="button"
        variant="secondary"
      >
        Renvoyer le courriel
      </Button>
      {message ? (
        <div
          aria-live="polite"
          className={`mt-3 rounded-2xl px-4 py-3 text-sm font-bold ${
            tone === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          <p>{message}</p>
          {detail ? <p className="mt-2 text-xs font-semibold">{detail}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
