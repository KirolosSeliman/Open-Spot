import Link from "next/link";

import {
  AdminOverviewPanel,
  AdminOverviewSectionTitle
} from "@/components/admin/overview/admin-overview-panel";
import {
  CalendarIcon,
  ChevronRightIcon,
  MessageIcon,
  ShieldIcon
} from "@/components/admin/overview/admin-overview-icons";
import type { OperationalSummaryItem } from "@/lib/admin/overview-data";

const iconMap = {
  deliverability: ShieldIcon,
  "response-rate": MessageIcon,
  compliance: ShieldIcon,
  "scheduled-reminders": CalendarIcon
} as const;

export function AdminSummaryCard({
  items,
  className
}: {
  items: OperationalSummaryItem[];
  className?: string;
}) {
  return (
    <AdminOverviewPanel className={className}>
      <AdminOverviewSectionTitle>Résumé opérationnel</AdminOverviewSectionTitle>

      <div className="mt-5 divide-y divide-[#edf2f9]">
        {items.map((item) => {
          const Icon = iconMap[item.id as keyof typeof iconMap] ?? ShieldIcon;
          const row = (
            <div className="flex items-center justify-between gap-4 py-[1.125rem]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0b1328]">{item.label}</p>
                  <p className="text-xs text-[#94a3b8]">{item.sublabel}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-bold text-[#0b1328]">{item.formattedValue}</span>
                {item.trendPositive ? (
                  <span aria-hidden="true" className="text-xs font-bold text-[#16a34a]">
                    ↑
                  </span>
                ) : null}
                {item.href ? <ChevronRightIcon className="h-4 w-4 text-[#94a3b8]" /> : null}
              </div>
            </div>
          );

          if (item.href) {
            return (
              <Link className="block transition hover:bg-[#f8fbff]" href={item.href} key={item.id}>
                {row}
              </Link>
            );
          }

          return <div key={item.id}>{row}</div>;
        })}
      </div>
    </AdminOverviewPanel>
  );
}
