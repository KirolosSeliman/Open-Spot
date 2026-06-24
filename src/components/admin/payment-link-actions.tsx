"use client";

import { useState } from "react";

type PaymentLinkActionsProps = {
  url: string | null;
};

export function PaymentLinkActions({ url }: PaymentLinkActionsProps) {
  const [copied, setCopied] = useState(false);

  if (!url) {
    return (
      <p className="text-sm font-bold text-[var(--muted)]">
        No payment link stored.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
        type="button"
      >
        {copied ? "Copied" : "Copy payment link"}
      </button>
      <a
        className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white"
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        Open payment link
      </a>
    </div>
  );
}
