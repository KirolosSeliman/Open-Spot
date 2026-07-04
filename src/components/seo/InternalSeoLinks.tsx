import Link from "next/link";

import { resourceLinks, solutionLinks } from "@/lib/seo/pages";
import { cn } from "@/lib/utils/cn";

type InternalSeoLinksProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function InternalSeoLinks({ variant = "light", className }: InternalSeoLinksProps) {
  const isDark = variant === "dark";

  return (
    <section
      aria-label="Liens internes Open Spot"
      className={cn(
        "grid gap-8 sm:grid-cols-2",
        isDark ? "text-white" : "text-[var(--foreground)]",
        className
      )}
    >
      <div>
        <h2
          className={cn(
            "text-sm font-black uppercase tracking-[0.12em]",
            isDark ? "text-white" : "text-[var(--foreground)]"
          )}
        >
          Solutions Open Spot
        </h2>
        <ul className="mt-4 grid gap-3">
          {solutionLinks.map((link) => (
            <li key={link.href}>
              <Link
                className={cn(
                  "text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                  isDark
                    ? "text-white/55 hover:text-white"
                    : "text-[var(--muted)] hover:text-[var(--primary-strong)]"
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2
          className={cn(
            "text-sm font-black uppercase tracking-[0.12em]",
            isDark ? "text-white" : "text-[var(--foreground)]"
          )}
        >
          Ressources
        </h2>
        <ul className="mt-4 grid gap-3">
          {resourceLinks.map((link) => (
            <li key={link.href}>
              <Link
                className={cn(
                  "text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                  isDark
                    ? "text-white/55 hover:text-white"
                    : "text-[var(--muted)] hover:text-[var(--primary-strong)]"
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
