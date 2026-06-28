import Link from "next/link";

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
  items
}: {
  items: OperationalSummaryItem[];
}) {
  return (
    <section className="rounded-[20px] border border-[#e1e9f5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <h2 className="text-lg font-bold text-[#0b1328]">Résumé opérationnel</h2>

      <div className="mt-5 divide-y divide-[#edf2f9]">
        {items.map((item) => {
          const Icon = iconMap[item.id as keyof typeof iconMap] ?? ShieldIcon;
          const content = (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563ff]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0b1328]">{item.label}</p>
                  <p className="text-xs text-[#657492]">{item.sublabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#0b1328]">{item.formattedValue}</span>
                {item.trendPositive ? (
                  <span aria-hidden="true" className="text-xs font-bold text-[#16a34a]">
                    ↑
                  </span>
                ) : null}
                {item.href ? <ChevronRightIcon className="h-4 w-4 text-[#657492]" /> : null}
              </div>
            </>
          );

          if (item.href) {
            return (
              <Link
                className="flex items-center justify-between gap-3 py-4 transition hover:bg-[#f8fbff]"
                href={item.href}
                key={item.id}
              >
                {content}
              </Link>
            );
          }

          return (
            <div className="flex items-center justify-between gap-3 py-4" key={item.id}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
