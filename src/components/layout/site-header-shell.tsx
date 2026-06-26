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
        "pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3",
        className
      )}
    >
      <div className="pointer-events-auto w-full max-w-6xl">
        <div
          className={cn(
            "rounded-[2rem] border border-[var(--line)] bg-white px-3 py-3 shadow-[var(--card-shadow)] sm:px-4",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
