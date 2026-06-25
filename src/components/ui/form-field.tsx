import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  helperText?: string;
  htmlFor?: string;
  label: string;
  required?: boolean;
};

export function FormField({
  children,
  error,
  helperText,
  htmlFor,
  label,
  required = false
}: FormFieldProps) {
  return (
    <div className="grid gap-2" data-open-spot-field>
      <label className="text-sm font-black text-[var(--foreground)]" htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-[var(--danger)]"> *</span> : null}
      </label>
      {children}
      {helperText ? (
        <p className="text-xs leading-5 text-[var(--muted)]">{helperText}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-bold leading-5 text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}

const fieldClasses =
  "min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} data-open-spot-control {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClasses, className)} data-open-spot-control {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClasses, "min-h-32 resize-y", className)}
      data-open-spot-control
      {...props}
    />
  );
}
