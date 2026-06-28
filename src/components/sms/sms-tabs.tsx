"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SmsChartIcon,
  SmsMessageIcon,
  SmsPhoneIcon,
  SmsSendIcon,
  SmsSettingsIcon,
  SmsShieldIcon
} from "@/components/admin/sms-configuration-icons";
import { cn } from "@/lib/utils/cn";
import type { SmsConfigurationTab } from "@/components/sms/sms-shared";

const tabs: {
  id: SmsConfigurationTab;
  label: string;
  icon: typeof SmsPhoneIcon;
}[] = [
  { id: "overview", label: "Vue d'ensemble", icon: OverviewIcon },
  { id: "number", label: "Numéro", icon: SmsPhoneIcon },
  { id: "sending", label: "Envoi", icon: SmsSendIcon },
  { id: "compliance", label: "Conformité", icon: SmsShieldIcon },
  { id: "tests", label: "Tests", icon: SmsMessageIcon },
  { id: "activity", label: "Activité", icon: SmsChartIcon },
  { id: "advanced", label: "Avancé", icon: SmsSettingsIcon }
];

function OverviewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={18}
      {...props}
    >
      <rect height="7" rx="1" width="7" x="3" y="3" />
      <rect height="7" rx="1" width="7" x="14" y="3" />
      <rect height="7" rx="1" width="7" x="14" y="14" />
      <rect height="7" rx="1" width="7" x="3" y="14" />
    </svg>
  );
}

function buildTabHref(
  pathname: string,
  tab: SmsConfigurationTab,
  preservedParams: Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(preservedParams)) {
    if (value && key !== "tab") {
      params.set(key, value);
    }
  }

  params.set("tab", tab);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function SmsTabs({
  activeTab,
  preservedParams = {}
}: {
  activeTab: SmsConfigurationTab;
  preservedParams?: Record<string, string | undefined>;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections Configuration SMS"
      className="overflow-x-auto rounded-2xl border border-[#e1e9f5] bg-white px-2 py-1 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
    >
      <ul className="flex min-w-max items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id}>
              <Link
                aria-selected={isActive}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition",
                  isActive
                    ? "border-b-2 border-[#2563ff] bg-[#eef5ff] text-[#2563ff]"
                    : "text-[#64748b] hover:bg-[#f8fbff] hover:text-[#0b1328]"
                )}
                href={buildTabHref(pathname, tab.id, preservedParams)}
                role="tab"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
