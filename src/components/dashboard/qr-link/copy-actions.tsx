"use client";

import { useState } from "react";

import { cn } from "@/lib/utils/cn";

import { CopyIcon } from "./icons";

type CopyFeedbackProps = {
  value: string;
  className?: string;
  label?: string;
  variant?: "icon" | "outline";
};

export function CopyUrlButton({
  value,
  className,
  label = "Copier",
  variant = "outline"
}: CopyFeedbackProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(true);
      window.setTimeout(() => setError(false), 2200);
    }
  }

  if (variant === "icon") {
    return (
      <button
        aria-label="Copier le lien public"
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#2563ff] transition hover:bg-[#eef4ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
          className
        )}
        onClick={copyLink}
        title={error ? "Impossible de copier le lien." : copied ? "Lien copié." : "Copier le lien public"}
        type="button"
      >
        <CopyIcon className="h-[18px] w-[18px]" />
        <span className="sr-only">
          {error ? "Impossible de copier le lien." : copied ? "Lien copié." : "Copier le lien public"}
        </span>
      </button>
    );
  }

  return (
    <button
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-bold text-[#2563ff] transition hover:bg-[#f8fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]",
        className
      )}
      onClick={copyLink}
      type="button"
    >
      <CopyIcon className="h-4 w-4" />
      {error ? "Impossible de copier le lien." : copied ? "Copié" : label}
    </button>
  );
}

export function CopyUrlBar({ value }: { value: string }) {
  return (
    <div className="flex min-h-[52px] items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2">
      <LinkGlyph />
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#50617d]">{value}</p>
      <CopyUrlButton value={value} variant="icon" />
    </div>
  );
}

function LinkGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0 text-[#94a3b8]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
