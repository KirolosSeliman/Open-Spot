"use client";

import { useState } from "react";

export function CopyValueButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      aria-label={`Copier ${label}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2eaf5] bg-white text-[#64748b] transition hover:bg-[#eef5ff] hover:text-[#2563ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <rect height="13" rx="2" width="13" x="8" y="8" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      )}
    </button>
  );
}
