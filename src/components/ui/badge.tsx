import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeTone = "default" | "info" | "success" | "warning" | "danger" | "dark";

const toneClasses: Record<BadgeTone, string> = {
  default: "border-slate-200 bg-white text-slate-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  dark: "border-white/15 bg-white/10 text-white"
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black leading-none",
        toneClasses[tone],
        className
      )}
      data-open-spot-badge={tone}
      {...props}
    />
  );
}
