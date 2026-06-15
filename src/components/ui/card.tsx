import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type CardVariant = "default" | "soft" | "dark" | "metric";

const cardVariants: Record<CardVariant, string> = {
  default: "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]",
  soft: "border-transparent bg-[var(--primary-soft)] text-[var(--foreground)]",
  dark: "border-white/15 bg-white/[0.06] text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]",
  metric: "border-[var(--line)] bg-white text-[var(--foreground)] shadow-[var(--card-shadow)]"
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border p-5 shadow-sm",
        cardVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-black leading-tight text-inherit", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-6 text-[var(--muted)]", className)}
      {...props}
    />
  );
}
