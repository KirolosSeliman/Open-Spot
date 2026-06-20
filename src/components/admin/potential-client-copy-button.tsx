"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PotentialClientCopyButton({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    if (!value || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button
      className="min-h-9 px-3 text-xs"
      onClick={copyValue}
      type="button"
      variant="outline"
    >
      {copied ? "Copied" : label}
    </Button>
  );
}
