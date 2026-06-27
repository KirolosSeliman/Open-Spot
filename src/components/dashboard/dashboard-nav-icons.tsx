import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="18"
      {...props}
    />
  );
}

export function DashboardNavIcon({ href }: { href: string }) {
  const icons: Record<string, ReactNode> = {
    "/dashboard": (
      <BaseIcon>
        <rect height="7" rx="1.5" width="7" x="3" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="3" />
        <rect height="7" rx="1.5" width="7" x="3" y="14" />
        <rect height="7" rx="1.5" width="7" x="14" y="14" />
      </BaseIcon>
    ),
    "/dashboard/new-cancellation": (
      <BaseIcon>
        <path d="M12 5v14M5 12h14" />
      </BaseIcon>
    ),
    "/dashboard/responses": (
      <BaseIcon>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </BaseIcon>
    ),
    "/dashboard/appointments": (
      <BaseIcon>
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </BaseIcon>
    ),
    "/dashboard/cancellations": (
      <BaseIcon>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </BaseIcon>
    ),
    "/dashboard/clients": (
      <BaseIcon>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </BaseIcon>
    ),
    "/dashboard/qr-code": (
      <BaseIcon>
        <rect height="7" width="7" x="3" y="3" />
        <rect height="7" width="7" x="14" y="3" />
        <rect height="7" width="7" x="3" y="14" />
        <path d="M14 14h3v3h-3zM17 17h3v3h-3z" />
      </BaseIcon>
    ),
    "/dashboard/messages": (
      <BaseIcon>
        <path d="M4 4h16v12H7l-3 3z" />
      </BaseIcon>
    ),
    "/dashboard/services": (
      <BaseIcon>
        <circle cx="6" cy="6" r="3" />
        <path d="M9 6h12M6 9v12" />
      </BaseIcon>
    ),
    "/dashboard/analytics": (
      <BaseIcon>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 3 5-6" />
      </BaseIcon>
    ),
    "/dashboard/team": (
      <BaseIcon>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </BaseIcon>
    ),
    "/dashboard/billing": (
      <BaseIcon>
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <path d="M2 10h20" />
      </BaseIcon>
    ),
    "/dashboard/settings": (
      <BaseIcon>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </BaseIcon>
    ),
    "/admin": (
      <BaseIcon>
        <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z" />
      </BaseIcon>
    )
  };

  return icons[href] ?? icons["/dashboard"];
}
