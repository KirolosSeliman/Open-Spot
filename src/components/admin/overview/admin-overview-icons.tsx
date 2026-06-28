import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function BuildingIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function DollarIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 10h4a2 2 0 1 1 0 4h-2" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M7 3v3M17 3v3M4 9h16" />
      <rect height="16" rx="2" width="18" x="3" y="5" />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M12 9v4M12 17h.01" />
      <path d="m10.3 4.5 8.1 14a1.5 1.5 0 0 1-1.3 2.25H7.2a1.5 1.5 0 0 1-1.3-2.25l8.1-14a1.5 1.5 0 0 1 2.6 0z" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M12 3 20 7v6c0 5-3.5 8-8 8s-8-3-8-8V7z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  );
}
