"use client";

import { useRouter } from "next/navigation";

import { ConfirmModal } from "@/components/admin/confirm-modal";
import { sendBillingPaymentReminderAction } from "@/lib/billing/manual-billing-actions";

type BillingPaymentReminderButtonProps = {
  organizationId: string;
  organizationName: string;
  canSend: boolean;
  disabledReason: string | null;
  contactName: string | null;
  contactPhone: string | null;
  billingPeriod: string;
  amountDue: string;
  messagePreview: string;
  lastReminderSentAt: string | null;
};

function formatReminderDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function BillingPaymentReminderButton({
  organizationId,
  organizationName,
  canSend,
  disabledReason,
  contactName,
  contactPhone,
  billingPeriod,
  amountDue,
  messagePreview,
  lastReminderSentAt
}: BillingPaymentReminderButtonProps) {
  const router = useRouter();
  const formattedLastReminder = formatReminderDate(lastReminderSentAt);

  return (
    <div className="grid gap-3">
      <ConfirmModal
        cancelLabel="Annuler"
        confirmLabel="Envoyer le rappel"
        description={
          <div className="grid gap-3 text-sm">
            <p>
              Un SMS sera envoyé au contact de facturation de cette compagnie.
            </p>
            <dl className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Compagnie
                </dt>
                <dd className="mt-1 font-black">{organizationName}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Destinataire
                </dt>
                <dd className="mt-1 font-black">
                  {contactName ?? "—"} — {contactPhone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Période
                </dt>
                <dd className="mt-1 font-black">{billingPeriod}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Montant dû
                </dt>
                <dd className="mt-1 font-black">{amountDue}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Message
                </dt>
                <dd className="mt-1 whitespace-pre-wrap font-semibold leading-6 text-[var(--foreground)]">
                  {messagePreview}
                </dd>
              </div>
            </dl>
          </div>
        }
        disabled={!canSend}
        loadingLabel="Envoi..."
        onConfirm={async () => {
          const result = await sendBillingPaymentReminderAction(organizationId);

          if (!result.ok) {
            throw new Error(
              result.error ??
                "Impossible d'envoyer le rappel de paiement pour le moment."
            );
          }

          router.refresh();
        }}
        title="Envoyer un rappel de paiement"
        triggerClassName="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        triggerDisabled={!canSend}
        triggerLabel="Envoyer un rappel de paiement"
      />

      {formattedLastReminder ? (
        <p className="text-sm font-semibold text-[var(--muted)]">
          Dernier rappel envoyé : {formattedLastReminder}
        </p>
      ) : null}

      {!canSend && disabledReason ? (
        <p className="text-sm font-bold text-[#74510f]">{disabledReason}</p>
      ) : null}
    </div>
  );
}
