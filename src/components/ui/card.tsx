import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-[#e2e8f0] bg-[var(--surface)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
        className
      )}
      {...props}
    />
  );
}
