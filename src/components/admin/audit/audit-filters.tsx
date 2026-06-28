import Link from "next/link";

import type { AuditLogFilters } from "@/lib/admin/audit-log";
import { formatAdminDateInput } from "@/lib/admin/date-range";

const categoryOptions = [
  { value: "all", label: "Toutes les catégories" },
  { value: "sms", label: "SMS" },
  { value: "company", label: "Compagnie" },
  { value: "billing", label: "Billing" },
  { value: "compliance", label: "Conformité" },
  { value: "client", label: "Client" },
  { value: "system", label: "Système" },
  { value: "security", label: "Sécurité" },
  { value: "view", label: "Consultation" }
] as const;

const importanceOptions = [
  { value: "all", label: "Toutes les actions" },
  { value: "critical", label: "Actions critiques" },
  { value: "normal", label: "Actions normales" },
  { value: "view", label: "Consultations seulement" }
] as const;

const displayOptions = [
  { value: "hide", label: "Masquer les consultations" },
  { value: "show", label: "Afficher les consultations" }
] as const;

const rangeOptions = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "custom", label: "Personnalisé" }
] as const;

function SelectField({
  id,
  label,
  name,
  defaultValue,
  options
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="grid min-w-0 gap-1.5" htmlFor={id}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
        {label}
      </span>
      <select
        className="h-11 w-full appearance-none rounded-xl border border-[#e3eaf5] bg-white px-3.5 text-sm font-medium text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10"
        defaultValue={defaultValue}
        id={id}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AuditFilters({
  filters,
  rangeLabel
}: {
  filters: AuditLogFilters;
  rangeLabel: string;
}) {
  const defaultFrom =
    filters.from ?? formatAdminDateInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
  const defaultTo = filters.to ?? formatAdminDateInput(new Date());

  return (
    <form
      className="grid gap-4 rounded-[22px] border border-[#e1e9f5] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
      method="get"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[1.05rem] font-bold tracking-tight text-[#0b1328]">
            Filtres
          </h2>
          <p className="mt-1 text-sm text-[#657492]">Période active : {rangeLabel}</p>
        </div>
      </div>

      <label className="grid min-w-0 gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
          Recherche
        </span>
        <input
          className="h-11 w-full rounded-xl border border-[#e3eaf5] bg-white px-3.5 text-sm text-[#0b1328] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10"
          defaultValue={filters.q}
          name="q"
          placeholder="Rechercher une action, un admin, une compagnie, un ID..."
          type="search"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          defaultValue={filters.category}
          id="audit-category-filter"
          label="Catégorie"
          name="category"
          options={categoryOptions}
        />
        <SelectField
          defaultValue={filters.importance}
          id="audit-importance-filter"
          label="Importance"
          name="importance"
          options={importanceOptions}
        />
        <SelectField
          defaultValue={filters.showViewed ? "show" : "hide"}
          id="audit-display-filter"
          label="Affichage"
          name="showViewed"
          options={displayOptions}
        />
        <SelectField
          defaultValue={filters.range}
          id="audit-range-filter"
          label="Période"
          name="range"
          options={rangeOptions}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5" htmlFor="audit-from-filter">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
            Du (personnalisé)
          </span>
          <input
            className="h-11 w-full rounded-xl border border-[#e3eaf5] bg-white px-3.5 text-sm text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10"
            defaultValue={defaultFrom}
            id="audit-from-filter"
            name="from"
            type="date"
          />
        </label>
        <label className="grid min-w-0 gap-1.5" htmlFor="audit-to-filter">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
            Au (personnalisé)
          </span>
          <input
            className="h-11 w-full rounded-xl border border-[#e3eaf5] bg-white px-3.5 text-sm text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10"
            defaultValue={defaultTo}
            id="audit-to-filter"
            name="to"
            type="date"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563ff] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
          type="submit"
        >
          Filtrer
        </button>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e3eaf5] bg-white px-5 text-sm font-semibold text-[#0b1328] transition hover:bg-[#f8fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
          href="/admin/audit"
        >
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
