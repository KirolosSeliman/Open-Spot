"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  convertCallRequestAction,
  resendCallRequestInvitationAction
} from "@/app/admin/call-requests/[requestId]/actions";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  canConvertRequest,
  isConversionComplete,
  type BookCallRequestRow,
  type ConversionResult
} from "@/lib/book-call/conversion-types";

function formatDate(value: string | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function canShowResendInvitation(request: BookCallRequestRow) {
  if (!isConversionComplete(request) || !request.email?.trim()) {
    return false;
  }

  return Boolean(
    request.organization_id &&
      (request.invitation_status === "sent" ||
        request.invitation_status === "failed" ||
        request.invitation_status === "pending" ||
        request.conversion_status === "invite_failed" ||
        request.invitation_status === "not_required")
  );
}

function getResendButtonLabel(request: BookCallRequestRow) {
  if (
    request.invitation_status === "sent" ||
    request.last_invitation_attempt_at
  ) {
    return "Renvoyer l'email";
  }

  return "Envoyer l'invitation";
}

export function CallRequestConversionCard({
  request
}: {
  request: BookCallRequestRow;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendTone, setResendTone] = useState<"success" | "error">("success");
  const [isResending, startResend] = useTransition();
  const converted = isConversionComplete(request);
  const canConvert = canConvertRequest(request);
  const showResend = canShowResendInvitation(request);

  async function handleConvert() {
    const conversionResult = await convertCallRequestAction(request.id);
    setResult(conversionResult);
    router.refresh();
  }

  function handleResend() {
    startResend(async () => {
      setResendMessage(null);
      const resendResult = await resendCallRequestInvitationAction(request.id);

      if (resendResult.status === "sent") {
        setResendTone("success");
        setResendMessage(
          "Email renvoye. Demandez au client de verifier sa boite de reception."
        );
      } else {
        setResendTone("error");
        setResendMessage(resendResult.errorMessage);
      }

      router.refresh();
    });
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Conversion en client</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Cree le commerce officiel, rattache le proprietaire et envoie une invitation
            securisee pour creer le mot de passe.
          </p>
        </div>
        {converted ? (
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            Client officiel
          </span>
        ) : null}
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-black text-[var(--foreground)]">Commerce</dt>
          <dd className="mt-1 text-[var(--muted)]">{request.business_name}</dd>
        </div>
        <div>
          <dt className="font-black text-[var(--foreground)]">Proprietaire</dt>
          <dd className="mt-1 text-[var(--muted)]">{request.full_name}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-black text-[var(--foreground)]">Email d&apos;invitation</dt>
          <dd className="mt-1 break-all text-[var(--muted)]">{request.email}</dd>
        </div>
        {converted ? (
          <>
            <div>
              <dt className="font-black text-[var(--foreground)]">Converti le</dt>
              <dd className="mt-1 text-[var(--muted)]">{formatDate(request.converted_at)}</dd>
            </div>
            <div>
              <dt className="font-black text-[var(--foreground)]">Invitation</dt>
              <dd className="mt-1 text-[var(--muted)]">
                {request.invitation_status ?? "inconnue"}
              </dd>
            </div>
            {request.last_invitation_attempt_at ? (
              <div className="sm:col-span-2">
                <dt className="font-black text-[var(--foreground)]">Dernier renvoi</dt>
                <dd className="mt-1 text-[var(--muted)]">
                  {formatDate(request.last_invitation_attempt_at)}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>

      {result ? (
        <p
          aria-live="polite"
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
            result.status === "failed" || result.status === "processing"
              ? "border border-red-200 bg-red-50 text-red-800"
              : result.status === "partial"
                ? "border border-amber-200 bg-amber-50 text-amber-900"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          {result.status === "completed" && result.invitationSent
            ? `Client cree avec succes. Une invitation a ete envoyee a ${result.email}.`
            : null}
          {result.status === "completed" && !result.invitationSent && result.existingUser
            ? `Le commerce a ete ajoute comme client. Le compte existant ${result.email} a ete rattache a l'organisation.`
            : null}
          {result.status === "partial"
            ? result.errorMessage
            : null}
          {result.status === "failed"
            ? result.errorMessage
            : null}
          {result.status === "processing"
            ? result.errorMessage
            : null}
          {result.status === "already_converted"
            ? "Cette demande est deja convertie."
            : null}
        </p>
      ) : null}

      {resendMessage ? (
        <p
          aria-live="polite"
          className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${
            resendTone === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {resendMessage}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {!converted ? (
          <ConfirmModal
            confirmLabel="Creer le client et envoyer l'invitation"
            description={
              <>
                <p>Cette action va :</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>creer le commerce comme client officiel;</li>
                  <li>
                    creer ou rattacher le compte proprietaire pour {request.email};
                  </li>
                  <li>
                    envoyer un lien securise permettant de creer le mot de passe;
                  </li>
                  <li>marquer cette demande comme convertie.</li>
                </ol>
                <p>
                  Le compte sera cree avec un acces proprietaire securise. L&apos;envoi SMS ne
                  sera pas automatiquement active.
                </p>
              </>
            }
            disabled={!canConvert}
            loadingLabel="Creation en cours..."
            onConfirm={handleConvert}
            title={`Ajouter ${request.business_name} comme client ?`}
            triggerDisabled={!canConvert}
            triggerLabel="Ajouter comme client"
          />
        ) : null}

        {showResend ? (
          <Button
            className="w-full sm:w-auto"
            disabled={isResending}
            isLoading={isResending}
            loadingText="Envoi en cours..."
            onClick={handleResend}
            type="button"
            variant="primary"
          >
            {getResendButtonLabel(request)}
          </Button>
        ) : null}

        {converted && request.organization_id ? (
          <ButtonLink
            className="w-full sm:w-auto"
            href={`/admin/organizations/${request.organization_id}`}
            variant="secondary"
          >
            Voir le client
          </ButtonLink>
        ) : null}

        <ButtonLink className="w-full sm:w-auto" href="/admin/call-requests" variant="outline">
          Retour aux demandes
        </ButtonLink>
      </div>

      {!canConvert && !converted ? (
        <p className="mt-4 text-sm font-semibold text-[var(--muted)]">
          Conversion indisponible : verifiez l&apos;email et le nom du commerce.
        </p>
      ) : null}
    </section>
  );
}
