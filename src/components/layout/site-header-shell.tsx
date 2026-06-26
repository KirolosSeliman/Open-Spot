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
        "sticky top-0 z-40 bg-[rgba(247,249,253,0.78)] px-3 py-3 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={cn(
            "rounded-[2rem] border border-[var(--line)] bg-white/90 px-3 py-3 shadow-[var(--card-shadow)] sm:px-4",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
