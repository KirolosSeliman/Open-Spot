"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

function StatusBarIcon({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-3 w-3", className)}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function SmsPreviewPhone({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "mx-auto w-full max-w-[340px] rounded-[2rem] border border-[#d7dee8] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <div className="overflow-hidden rounded-[1.6rem] border border-[#e2e8f0] bg-[#f8fafc]">
        <div className="flex items-center justify-between px-4 pb-2 pt-3 text-[11px] font-semibold text-[#07142f]">
          <span>9:41</span>
          <div className="flex items-center gap-1 text-[#64748b]">
            <StatusBarIcon>
              <path d="M2 18h2v4H2v-4zm4-4h2v8H6v-8zm4-3h2v11h-2V11zm4-5h2v16h-2V6z" />
            </StatusBarIcon>
            <StatusBarIcon>
              <path d="M4 8a8 8 0 0 1 16 0v1h-2V8a6 6 0 0 0-12 0v1H4V8zm0 3h16v9H4v-9z" />
            </StatusBarIcon>
            <StatusBarIcon>
              <rect height="10" rx="2" width="18" x="3" y="7" />
              <rect height="6" rx="1" width="12" x="5" y="9" />
            </StatusBarIcon>
          </div>
        </div>

        <div className="border-b border-[#e2e8f0] px-4 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#07142f]">
            <span className="text-[#64748b]">‹</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#cbd5e1] text-[#475569]">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
              </svg>
            </span>
            <span>Open Spot</span>
            <span className="text-[#94a3b8]">›</span>
          </div>
        </div>

        <div className="px-4 py-5">
          <p className="mb-4 text-center text-[11px] font-medium text-[#94a3b8]">
            Aujourd&apos;hui 9:41
          </p>
          <div className="max-w-[92%] rounded-[1.25rem] rounded-bl-md bg-[#e5e7eb] px-4 py-3 text-[13px] leading-6 text-[#07142f]">
            {message.split("\n").map((line, index, lines) => (
              <span key={`${index}-${line}`}>
                {line}
                {index < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SmsPreviewPanel({
  previewMessage
}: {
  previewMessage: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-[#dde5f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-6">
        <h2 className="text-xl font-black tracking-tight text-[#07142f]">
          Aperçu du message
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Voici à quoi ressemblera votre SMS pour le client.
        </p>
      </div>

      <SmsPreviewPhone message={previewMessage} />

      <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-[#64748b]">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-[#64748b]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6M12 7h.01" />
        </svg>
        <span>
          Le message de confirmation manuelle sera envoyé automatiquement au
          client une fois que vous confirmez un répondant.
        </span>
      </p>

      <p className="sr-only">{previewMessage}</p>
    </section>
  );
}
