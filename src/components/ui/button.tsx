import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary)] text-white shadow-[0_16px_36px_rgba(79,125,243,0.22)] hover:bg-[var(--primary-strong)]",
  secondary:
    "border border-transparent bg-[var(--primary-soft)] text-[var(--primary-strong)] hover:bg-[#dfe9ff]",
  outline:
    "border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-slate-50",
  ghost: "text-[var(--foreground)] hover:bg-slate-100",
  destructive: "bg-[var(--danger)] text-white hover:bg-[#b91c1c]",
  link: "min-h-0 rounded-none px-0 py-0 text-[var(--primary)] underline-offset-4 hover:underline"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingText?: string;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className,
  disabled,
  isLoading = false,
  loadingText = "Loading...",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-center text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-55",
        variantClasses[variant],
        className
      )}
      data-open-spot-button={variant}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-center text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
        variantClasses[variant],
        className
      )}
      data-open-spot-button={variant}
      {...props}
    />
  );
}
