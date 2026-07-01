import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type SiteHeaderShellProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function SiteHeaderShell({
  children,
  className,
  innerClassName
}: SiteHeaderShellProps) {
  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[max(0.85rem,env(safe-area-inset-top))] md:pt-3",
        className
      )}
    >
      <div className="pointer-events-auto w-full max-w-6xl">
        <div
          className={cn(
            "rounded-[1.65rem] border border-[var(--line)] bg-white/95 px-3 py-2.5 shadow-[var(--card-shadow)] backdrop-blur-md sm:rounded-[2rem] sm:px-4 sm:py-3",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
