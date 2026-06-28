import type { ReactNode } from "react";

import {
  companyDetailInputClassName,
  companyDetailSelectClassName
} from "@/components/admin/company-detail/company-detail-ui";
import { cn } from "@/lib/utils/cn";

function FieldShell({
  label,
  icon,
  children
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[#64748b]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94a3b8]">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}

const fieldClassName = "pl-10";

export function CompanyIconInput({
  label,
  icon,
  className,
  ...props
}: {
  label: string;
  icon: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell icon={icon} label={label}>
      <input className={cn(companyDetailInputClassName, fieldClassName, className)} {...props} />
    </FieldShell>
  );
}

export function CompanyIconSelect({
  label,
  icon,
  className,
  children,
  ...props
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell icon={icon} label={label}>
      <select
        className={cn(companyDetailSelectClassName, fieldClassName, className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function CompanyIconTextarea({
  label,
  icon,
  className,
  ...props
}: {
  label: string;
  icon: ReactNode;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[#64748b]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-3 text-[#94a3b8]">
          {icon}
        </span>
        <textarea
          className={cn(companyDetailInputClassName, "min-h-28 py-3 pl-10", className)}
          {...props}
        />
      </div>
    </label>
  );
}
