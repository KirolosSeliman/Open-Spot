"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { OpeningResponseCustomer } from "@/lib/dashboard/operations-data";
import {
  canConfirmOpeningCustomer,
  canRejectOpeningCustomer
} from "@/lib/responses/formatters";
import { rejectOpeningOfferFromResponsesAction } from "@/lib/responses/actions";

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
  const canConfirm = canValidate && canConfirmOpeningCustomer(customer, openingStatus);
  const canReject = canValidate && canRejectOpeningCustomer(customer, openingStatus);

  function handleConfirm() {
    setError(null);
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

        router.refresh();
      } catch {
        setError("La validation manuelle a échoué.");
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          aria-label={`${confirmLabel} ${customer.customerName}`}
          className="min-h-9 rounded-full px-3 text-xs"
          disabled={!canConfirm || isPending}
          isLoading={isPending}
          loadingText={validatingLabel}
          onClick={handleConfirm}
          type="button"
          variant={customer.offerStatus === "selected" ? "primary" : "primary"}
        >
          {confirmLabel}
        </Button>
        {canReject ? (
          <form action={rejectOpeningOfferFromResponsesAction}>
            <input name="openingId" type="hidden" value={openingId} />
            <input name="offerId" type="hidden" value={customer.offerId} />
            <Button
              aria-label={`${rejectLabel} ${customer.customerName}`}
              className="min-h-9 rounded-full px-3 text-xs"
              disabled={isPending}
              type="submit"
              variant="outline"
            >
              {rejectLabel}
            </Button>
          </form>
        ) : (
          <Button
            aria-label={`${rejectLabel} ${customer.customerName}`}
            className="min-h-9 rounded-full px-3 text-xs"
            disabled
            type="button"
            variant="outline"
          >
            {rejectLabel}
          </Button>
        )}
        <Link
          aria-label={`Voir l'annulation pour ${customer.customerName}`}
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[var(--line)] bg-white px-2 text-[var(--muted)] hover:bg-slate-50"
          href={`/dashboard/cancellations/${openingId}`}
          title="Voir l'annulation"
        >
          ⋯
        </Link>
      </div>
      {error ? (
        <p className="text-xs font-bold text-[#8a1f17]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
