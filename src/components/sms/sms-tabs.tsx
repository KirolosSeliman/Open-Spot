"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import type { SmsConfigurationTab } from "@/components/sms/sms-shared";

const tabs: { id: SmsConfigurationTab; label: string }[] = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "number", label: "Numéro" },
  { id: "sending", label: "Envoi" },
  { id: "compliance", label: "Conformité" },
  { id: "tests", label: "Tests" },
  { id: "activity", label: "Activité" },
  { id: "advanced", label: "Avancé" }
];

function buildTabHref(pathname: string, tab: SmsConfigurationTab) {
  return `${pathname}?tab=${tab}`;
}

export function SmsTabs({ activeTab }: { activeTab: SmsConfigurationTab }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections SMS"
      className="overflow-x-auto border-b border-[#e1e9f5]"
    >
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center border-b-2 px-3 text-sm font-semibold transition",
                  isActive
                    ? "border-[#2563ff] text-[#2563ff]"
                    : "border-transparent text-[#64748b] hover:text-[#0b1328]"
                )}
                href={buildTabHref(pathname, tab.id)}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
