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
      className={cn("h-3.5 w-3.5", className)}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function MessageBubble({ message }: { message: string }) {
  return (
    <div className="relative max-w-[88%]">
      <div
        className="relative rounded-[18px] rounded-bl-[4px] bg-[#e9e9eb] px-3.5 py-2.5 text-[15px] leading-[1.35] tracking-[-0.01em] text-black"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif' }}
      >
        {message.split("\n").map((line, index, lines) => (
          <span key={`${index}-${line}`}>
            {line}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute -bottom-[1px] left-[-5px] h-3 w-3 bg-[#e9e9eb]"
        style={{
          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
          borderBottomLeftRadius: "4px"
        }}
      />
    </div>
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
        "mx-auto w-full max-w-[320px] overflow-hidden rounded-[2.75rem] border-[5px] border-[#1f2937] bg-[#1f2937] shadow-[0_24px_50px_rgba(15,23,42,0.18)]",
        className
      )}
    >
      <div className="overflow-hidden rounded-[2.35rem] bg-white">
        <div className="bg-white px-5 pb-1.5 pt-2.5">
          <div className="mx-auto mb-2 h-6 w-28 rounded-full bg-black" />
          <div className="flex items-center justify-between text-[13px] font-semibold text-black">
            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
              9:41
            </span>
            <div className="flex items-center gap-1.5 text-black">
              <StatusBarIcon>
                <path d="M2 18h2v4H2v-4zm4-4h2v8H6v-8zm4-3h2v11h-2V11zm4-5h2v16h-2V6z" />
              </StatusBarIcon>
              <StatusBarIcon>
                <path d="M1 8.5C1 5.46 4.13 3 8 3s7 2.46 7 5.5V9H1V8.5zM0 10h16v2H0v-2z" />
              </StatusBarIcon>
              <StatusBarIcon className="h-3.5 w-5">
                <rect height="10" rx="2.5" width="22" x="1" y="5" />
                <rect height="6" rx="1.5" width="14" x="3" y="7" fill="white" />
              </StatusBarIcon>
            </div>
          </div>
        </div>

        <div className="border-b border-[#d1d1d6] bg-[#f9f9f9]/80 px-3 pb-2.5 pt-1 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-light leading-none text-[#007aff]">‹</span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c7c7cc] text-white">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-[13px] font-semibold text-black"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
                >
                  Open Spot
                </p>
                <p className="truncate text-[11px] text-[#8e8e93]">›</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="min-h-[360px] bg-white px-3 py-4"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
        >
          <p className="mb-4 text-center text-[11px] font-medium text-[#8e8e93]">
            Aujourd&apos;hui 9:41
          </p>
          <MessageBubble message={message} />
        </div>

        <div className="border-t border-[#d1d1d6] bg-[#f9f9f9]/95 px-2.5 pb-2 pt-2 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <button
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e5e5ea] text-[#007aff]"
              tabIndex={-1}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <div className="min-h-9 flex-1 rounded-full border border-[#c7c7cc] bg-white px-3 py-2 text-[15px] text-[#c7c7cc]">
              iMessage
            </div>
            <button
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[#007aff]"
              tabIndex={-1}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-2 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-black/80" />
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
