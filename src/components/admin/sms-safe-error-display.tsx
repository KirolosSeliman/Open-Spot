"use client";

import type { SafeTwilioUiError } from "@/lib/sms/twilio-ui-errors";
import { getSafeTwilioUiError } from "@/lib/sms/twilio-ui-errors";

export function SafeTwilioErrorDisplay({
  error,
  title = "Erreur Twilio"
}: {
  error: string | SafeTwilioUiError;
  title?: string;
}) {
  const parsed = typeof error === "string" ? getSafeTwilioUiError(new Error(error)) : error;

  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-black break-words">{parsed.title ?? title}</p>
      <p className="mt-2 break-words">{parsed.message}</p>
      {parsed.recommendedAction ? (
        <p className="mt-2 text-xs font-bold break-words">{parsed.recommendedAction}</p>
      ) : null}
      {parsed.technicalDetail ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold">Détails techniques</summary>
          <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap break-words text-xs">
            {parsed.technicalDetail}
            {parsed.twilioCode ? `\nCode Twilio : ${parsed.twilioCode}` : ""}
            {parsed.maskedAccountSid
              ? `\nAccount SID : ${parsed.maskedAccountSid}`
              : ""}
            {parsed.maskedPhoneNumberSid
              ? `\nPhone Number SID : ${parsed.maskedPhoneNumberSid}`
              : ""}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
