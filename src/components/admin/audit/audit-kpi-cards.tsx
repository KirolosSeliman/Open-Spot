import type { AuditLogStats } from "@/lib/admin/audit-log";
import { cn } from "@/lib/utils/cn";

const numberFormatter = new Intl.NumberFormat("fr-CA");

function StatCard({
  label,
  value,
  sublabel,
  accentClassName
}: {
  label: string;
  value: string;
  sublabel: string;
  accentClassName?: string;
}) {
  return (
    <article className="flex min-h-[96px] flex-col rounded-[18px] border border-[#e3eaf5] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-5 text-[#64748b]">{label}</p>
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#2563ff]",
            accentClassName
          )}
        />
      </div>
      <p className="mt-auto pt-3 text-[1.5rem] font-bold leading-none tracking-tight text-[#0b1328]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#64748b]">{sublabel}</p>
    </article>
  );
}

export function AuditKpiCards({ stats }: { stats: AuditLogStats }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      <StatCard
        accentClassName="bg-[#2563ff]"
        label="Événements affichés"
        sublabel={`${numberFormatter.format(stats.totalFiltered)} résultat${stats.totalFiltered > 1 ? "s" : ""} filtré${stats.totalFiltered > 1 ? "s" : ""}`}
        value={numberFormatter.format(stats.displayedCount)}
      />
      <StatCard
        accentClassName="bg-[#f97316]"
        label="Actions critiques"
        sublabel="Actions sensibles dans les résultats"
        value={numberFormatter.format(stats.criticalCount)}
      />
      <StatCard
        accentClassName="bg-[#6366f1]"
        label="SMS & conformité"
        sublabel="Événements SMS ou conformité"
        value={numberFormatter.format(stats.smsComplianceCount)}
      />
      <StatCard
        accentClassName="bg-[#94a3b8]"
        label="Consultations masquées"
        sublabel={
          stats.viewHidden
            ? `${numberFormatter.format(stats.hiddenViewCount)} consultation${stats.hiddenViewCount > 1 ? "s" : ""} cachée${stats.hiddenViewCount > 1 ? "s" : ""}`
            : "Consultations visibles"
        }
        value={stats.viewHidden ? numberFormatter.format(stats.hiddenViewCount) : "0"}
      />
    </div>
  );
}
