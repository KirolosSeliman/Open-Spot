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
        "pointer-events-none sticky top-0 z-40 px-3 py-3",
        className
      )}
    >
      <div className="pointer-events-auto mx-auto max-w-6xl">
        <div
          className={cn(
            "rounded-[2rem] border border-[var(--line)] bg-white/90 px-3 py-3 shadow-[var(--card-shadow)] backdrop-blur sm:px-4",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
