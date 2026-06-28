import type { ReactNode } from "react";

import {
  CheckCircleIcon,
  PhoneIcon,
  StarIcon,
  UsersIcon
} from "@/components/admin/call-requests/call-requests-icons";
import type { BookCallRequestStats } from "@/lib/book-call/admin";
import { cn } from "@/lib/utils/cn";

const numberFormatter = new Intl.NumberFormat("fr-CA");

function KpiCard({
  label,
  value,
  sublabel,
  icon,
  iconClassName
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: ReactNode;
  iconClassName?: string;
}) {
  return (
    <article className="flex min-h-[104px] flex-col rounded-[18px] border border-[#e3eaf5] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] xl:min-h-[112px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-5 text-[#64748b]">{label}</p>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            iconClassName
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-auto pt-3 text-[1.5rem] font-bold leading-none tracking-tight text-[#0b1328] xl:text-[1.65rem]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">{sublabel}</p>
    </article>
  );
}

export function CallRequestsKpiCards({ stats }: { stats: BookCallRequestStats }) {
  return (
    <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      <KpiCard
        icon={<PhoneIcon className="h-5 w-5 text-[#2563ff]" />}
        iconClassName="bg-[#eef5ff]"
        label="Total"
        sublabel="Toutes les demandes"
        value={numberFormatter.format(stats.total)}
      />
      <KpiCard
        icon={<StarIcon className="h-5 w-5 text-[#f59e0b]" />}
        iconClassName="bg-[#fff7ed]"
        label="Nouvelles"
        sublabel="Demandes à traiter"
        value={numberFormatter.format(stats.new)}
      />
      <KpiCard
        icon={<UsersIcon className="h-5 w-5 text-[#2563ff]" />}
        iconClassName="bg-[#eef5ff]"
        label="Contactées"
        sublabel="Suivi déjà commencé"
        value={numberFormatter.format(stats.contacted)}
      />
      <KpiCard
        icon={<CheckCircleIcon className="h-5 w-5 text-[#16a34a]" />}
        iconClassName="bg-[#ecfdf5]"
        label="Qualifiées"
        sublabel="Demandes prêtes pour vente"
        value={numberFormatter.format(stats.qualified)}
      />
    </div>
  );
}
