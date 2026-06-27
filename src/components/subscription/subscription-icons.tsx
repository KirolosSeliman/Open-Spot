import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function SvgIcon({
  children,
  className = "h-5 w-5"
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function SubscriptionCreditCardIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20" />
    </SvgIcon>
  );
}

export function SubscriptionCalendarIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M8 2v3m8-3v3" />
      <path d="M4 9h16M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    </SvgIcon>
  );
}

export function SubscriptionTagIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M20.59 13.41 12 22 2 12l8.59-8.59A2 2 0 0 1 12.83 3h6.34a2 2 0 0 1 1.41.59L22 11.17a2 2 0 0 1 0 2.83z" />
      <path d="M7 7h.01" />
    </SvgIcon>
  );
}

export function SubscriptionChartIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M3 3v18h18" />
      <path d="M7 16V9m5 7V5m5 11v-4" />
    </SvgIcon>
  );
}

export function SubscriptionWalletIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M17 13h4a2 2 0 0 0 0-4h-4v4z" />
    </SvgIcon>
  );
}

export function SubscriptionInfoIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </SvgIcon>
  );
}

export function SubscriptionChevronIcon({ className }: IconProps) {
  return (
    <SvgIcon className={className}>
      <path d="m9 18 6-6-6-6" />
    </SvgIcon>
  );
}

export function SubscriptionDiamondIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2 4 8.5 12 22l8-13.5L12 2z" />
    </svg>
  );
}
