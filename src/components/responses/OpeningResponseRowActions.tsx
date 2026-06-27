"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { OpeningResponseCustomer } from "@/lib/dashboard/operations-data";
import {
  canConfirmOpeningCustomer,
  canRejectOpeningCustomer
} from "@/lib/responses/formatters";
import { rejectOpeningOfferFromResponsesAction } from "@/lib/responses/actions";

import { CheckIcon, DotsIcon, XIcon } from "./responses-icons";

export function OpeningResponseRowActions({
  openingId,
  openingStatus,
  customer,
  recoveredValueCents,
  canValidate,
  confirmLabel,
  rejectLabel,
  validatingLabel
}: {
  openingId: string;
  openingStatus: string;
  customer: OpeningResponseCustomer;
  recoveredValueCents: number;
  canValidate: boolean;
  confirmLabel: string;
  rejectLabel: string;
  validatingLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmationSmsWarning, setConfirmationSmsWarning] = useState<string | null>(
    null
  );
  const canConfirm = canValidate && canConfirmOpeningCustomer(customer, openingStatus);
  const canReject = canValidate && canRejectOpeningCustomer(customer, openingStatus);
  const isConfirmed = customer.offerStatus === "selected";

  function handleConfirm() {
    setError(null);
    setNotice(null);
    setConfirmationSmsWarning(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/openings/${openingId}/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedOfferId: customer.offerId,
            recoveredValueCents
          })
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(
            typeof payload.error === "string"
              ? payload.error
              : "La validation manuelle a échoué."
          );
          return;
        }

        if (typeof payload.notice === "string") {
          setNotice(payload.notice);
        }

        if (typeof payload.confirmationSmsWarning === "string") {
          setConfirmationSmsWarning(payload.confirmationSmsWarning);
        }

        router.refresh();
      } catch {
        setError("La validation manuelle a échoué.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          aria-label={`${confirmLabel} ${customer.customerName}`}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
            isConfirmed
              ? "bg-[var(--primary)] text-white shadow-[0_6px_14px_rgba(79,125,243,0.22)]"
              : "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)]"
          }`}
          disabled={!canConfirm || isPending || isConfirmed}
          onClick={handleConfirm}
          type="button"
        >
          <CheckIcon />
          {isPending ? validatingLabel : confirmLabel}
        </button>

        {canReject ? (
          <form action={rejectOpeningOfferFromResponsesAction}>
            <input name="openingId" type="hidden" value={openingId} />
            <input name="offerId" type="hidden" value={customer.offerId} />
            <button
              aria-label={`${rejectLabel} ${customer.customerName}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={isPending}
              type="submit"
            >
              <XIcon />
              {rejectLabel}
            </button>
          </form>
        ) : (
          <button
            aria-label={`${rejectLabel} ${customer.customerName}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 opacity-45"
            disabled
            type="button"
          >
            <XIcon />
            {rejectLabel}
          </button>
        )}

        <Link
          aria-label={`Options pour ${customer.customerName}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          href={`/dashboard/cancellations/${openingId}`}
          title="Voir l'annulation"
        >
          <DotsIcon />
        </Link>
      </div>
      {error ? (
        <p className="text-xs font-bold text-[#8a1f17]" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-xs font-bold text-[#245d30]" role="status">
          {notice}
        </p>
      ) : null}
      {confirmationSmsWarning ? (
        <p className="text-xs font-bold text-[#74510f]" role="status">
          {confirmationSmsWarning}
        </p>
      ) : null}
    </div>
  );
}
