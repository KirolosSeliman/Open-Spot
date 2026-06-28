"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resendCompanyOwnerInvitationAction } from "@/lib/admin/owner-invitation-actions";
import { cn } from "@/lib/utils/cn";

const methodLabels = {
  invite: "invitation",
  recovery: "réinitialisation du mot de passe",
  signup_resend: "confirmation de compte"
} as const;

export function ResendOwnerInvitationButton({
  disabled = false,
  organizationId,
  ownerEmail,
  variant = "default"
}: {
  disabled?: boolean;
  organizationId: string;
  ownerEmail: string | null;
  variant?: "default" | "embedded";
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

  const content = (
    <>
      <p className="text-sm font-semibold text-[#0b1328]">Invitation propriétaire</p>
      <button
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8] disabled:opacity-50"
        disabled={disabled || isPending || missingEmail}
        onClick={handleResend}
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <rect height="13" rx="2" width="18" x="3" y="5" />
          <path d="m3 7 9 6 9-6" />
        </svg>
        {isPending ? "Envoi en cours…" : "Renvoyer le courriel"}
      </button>
      {message ? (
        <div
          aria-live="polite"
          className={cn(
            "mt-3 rounded-[13px] px-3 py-2 text-xs font-semibold",
            tone === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          )}
          role="status"
        >
          <p>{message}</p>
          {detail ? <p className="mt-1">{detail}</p> : null}
        </div>
      ) : null}
    </>
  );

  if (variant === "embedded") {
    return (
      <div className="rounded-[16px] border border-[#dbeafe] bg-[#eef5ff] p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-[#e2eaf5] pt-5">
      {content}
    </div>
  );
}
