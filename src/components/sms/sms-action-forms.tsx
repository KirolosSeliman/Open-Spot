"use client";

import { useState, useTransition, type ReactNode } from "react";

import { SafeTwilioErrorDisplay } from "@/components/admin/sms-safe-error-display";
import type { SmsSenderActionResult } from "@/lib/admin/sms-sender-actions";
import { smsPageStyles } from "@/components/sms/sms-shared";

export function ActionFeedback({ result }: { result: SmsSenderActionResult | null }) {
  if (!result) {
    return null;
  }

  if (result.ok) {
    return <p className="text-sm font-semibold text-emerald-700 break-words">{result.message}</p>;
  }

  return <SafeTwilioErrorDisplay error={result.message} />;
}

export function AdminActionForm({
  action,
  organizationId,
  organizationName,
  children,
  disabled = false,
  className = "grid gap-3",
  submitLabel = "Continuer",
  hideSubmit = false,
  buttonClassName
}: {
  action: (formData: FormData) => Promise<SmsSenderActionResult>;
  organizationId: string;
  organizationName: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  submitLabel?: string;
  hideSubmit?: boolean;
  buttonClassName?: string;
}) {
  const [result, setResult] = useState<SmsSenderActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className={className}
      action={(formData) => {
        startTransition(async () => {
          setResult(await action(formData));
        });
      }}
    >
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="organizationName" type="hidden" value={organizationName} />
      {children}
      <ActionFeedback result={result} />
      {hideSubmit ? null : (
        <button
          className={buttonClassName ?? smsPageStyles.primaryButton}
          disabled={disabled || isPending}
          type="submit"
        >
          {isPending ? "En cours..." : submitLabel}
        </button>
      )}
    </form>
  );
}

export function SmsInlineForm({
  action,
  organizationId,
  organizationName,
  children,
  disabled = false,
  className = "contents",
  buttonClassName,
  submitLabel,
  buttonVariant = "primary"
}: {
  action: (formData: FormData) => Promise<SmsSenderActionResult>;
  organizationId: string;
  organizationName?: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  submitLabel: string;
  buttonVariant?: "primary" | "secondary" | "destructive";
}) {
  const [result, setResult] = useState<SmsSenderActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const variantClass =
    buttonVariant === "destructive"
      ? smsPageStyles.destructiveButton
      : buttonVariant === "secondary"
        ? smsPageStyles.secondaryButton
        : smsPageStyles.primaryButton;

  return (
    <form
      className={className}
      action={(formData) => {
        startTransition(async () => {
          setResult(await action(formData));
        });
      }}
    >
      <input name="organizationId" type="hidden" value={organizationId} />
      {organizationName ? (
        <input name="organizationName" type="hidden" value={organizationName} />
      ) : null}
      {children}
      <ActionFeedback result={result} />
      <button
        className={buttonClassName ?? variantClass}
        disabled={disabled || isPending}
        type="submit"
      >
        {isPending ? "En cours..." : submitLabel}
      </button>
    </form>
  );
}
