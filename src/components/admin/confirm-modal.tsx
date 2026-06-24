"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type ConfirmModalProps = {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  loadingLabel: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  triggerLabel: string;
  triggerDisabled?: boolean;
  triggerClassName?: string;
};

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  loadingLabel,
  cancelLabel = "Annuler",
  onConfirm,
  disabled = false,
  triggerLabel,
  triggerDisabled = false,
  triggerClassName
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    function handleCancel(event: Event) {
      event.preventDefault();
      dialog?.close();
    }

    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, []);

  function openModal() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    if (!isPending) {
      dialogRef.current?.close();
    }
  }

  function handleConfirm() {
    startTransition(async () => {
      setError(null);

      try {
        await onConfirm();
        dialogRef.current?.close();
      } catch (confirmError) {
        setError(
          confirmError instanceof Error
            ? confirmError.message
            : "Une erreur est survenue."
        );
      }
    });
  }

  return (
    <>
      <Button
        className={triggerClassName}
        disabled={triggerDisabled || disabled}
        onClick={openModal}
        type="button"
      >
        {triggerLabel}
      </Button>

      <dialog
        className="w-[min(100%,32rem)] rounded-[1.5rem] border border-[var(--line)] bg-white p-0 shadow-2xl backdrop:bg-black/40"
        ref={dialogRef}
      >
        <form className="grid gap-5 p-6" method="dialog">
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)]">{title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted)]">
              {description}
            </div>
          </div>

          {error ? (
            <p
              aria-live="polite"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={isPending}
              onClick={closeModal}
              type="button"
              variant="secondary"
            >
              {cancelLabel}
            </Button>
            <Button disabled={isPending} onClick={handleConfirm} type="button">
              {isPending ? loadingLabel : confirmLabel}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
