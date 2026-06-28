import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { smsPageStyles, statusToneFromLabel } from "@/components/sms/sms-shared";

const toneClasses = {
  default: "border-[#e1e9f5] bg-[#f8fafc] text-[#64748b]",
  info: "border-blue-200 bg-[#eef5ff] text-[#2563ff]",
  success: "border-emerald-200 bg-[#ecfdf5] text-[#16a34a]",
  warning: "border-amber-200 bg-[#fff7ed] text-[#f59e0b]",
  danger: "border-red-200 bg-[#fef2f2] text-[#ef4444]"
} as const;

type Tone = keyof typeof toneClasses;

export function SmsCard({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={cn(smsPageStyles.card, className)}>{children}</section>;
}

export function SmsIconPill({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5ff] text-[#2563ff]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SmsBadge({
  label,
  tone
}: {
  label: string;
  tone?: Tone;
}) {
  const resolvedTone = tone ?? statusToneFromLabel(label);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold leading-none",
        toneClasses[resolvedTone]
      )}
    >
      {label}
    </span>
  );
}

export function SmsCardHeader({
  icon,
  title,
  badge,
  action
}: {
  icon?: ReactNode;
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon ? <SmsIconPill>{icon}</SmsIconPill> : null}
        <div>
          <h2 className={smsPageStyles.cardTitle}>{title}</h2>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        {action}
      </div>
    </div>
  );
}

export function SmsFieldRow({
  label,
  value,
  valueNode
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <dt className={smsPageStyles.label}>{label}</dt>
      <dd className={smsPageStyles.value}>{valueNode ?? value ?? "—"}</dd>
    </div>
  );
}

export function SmsFooterLink({
  href,
  onClick,
  children
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (href) {
    return (
      <a className={cn(smsPageStyles.linkButton, "mt-5")} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={cn(smsPageStyles.linkButton, "mt-5")} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function SmsEmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e1e9f5] bg-[#f8fbff] px-4 py-8 text-center">
      <p className="text-sm font-black text-[#0b1328]">{title}</p>
      <p className="mt-2 text-sm text-[#64748b]">{description}</p>
    </div>
  );
}

export function SmsTrialBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-[#fff7ed] px-4 py-3 text-sm text-amber-900">
      Compte Twilio en mode essai : l&apos;envoi réel peut être limité aux numéros
      vérifiés. Passez en compte payant avant production.
    </div>
  );
}

export function SmsNeutralTwilioBanner() {
  return (
    <div className="rounded-2xl border border-[#e1e9f5] bg-[#f8fbff] px-4 py-3 text-sm text-[#64748b]">
      Statut Twilio à vérifier.
    </div>
  );
}
