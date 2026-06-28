import type { ReactNode } from "react";

import {
  CalendarIcon,
  ChevronDownIcon,
  ColumnsIcon,
  FilterIcon,
  SearchIcon
} from "@/components/admin/companies/admin-companies-icons";
import type {
  AdminCompaniesPageData,
  CompaniesDateRange,
  CompaniesStatusFilter
} from "@/lib/admin/companies-data";

const DEFAULT_PLAN_OPTIONS = ["Basic", "Pro", "Business", "Custom", "Founder Pilot"];

const statusOptions: Array<{ value: CompaniesStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
  { value: "disabled", label: "Disabled" }
];

const rangeOptions: Array<{ value: CompaniesDateRange; label: string }> = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" }
];

function SelectField({
  id,
  label,
  name,
  defaultValue,
  options,
  icon
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  icon?: ReactNode;
}) {
  return (
    <label className="grid min-w-[130px] gap-1.5" htmlFor={id}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
        {label}
      </span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
            {icon}
          </span>
        ) : null}
        <select
          className={`h-11 w-full appearance-none rounded-xl border border-[#e3eaf5] bg-white pr-9 text-sm font-medium text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10 ${
            icon ? "pl-9" : "pl-3.5"
          }`}
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
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
      </div>
    </label>
  );
}

export function AdminCompaniesFilters({
  filters,
  availablePlans
}: {
  filters: AdminCompaniesPageData["filters"];
  availablePlans: string[];
}) {
  const planOptions = [
    { value: "all", label: "All" },
    ...[
      ...new Set([...DEFAULT_PLAN_OPTIONS, ...availablePlans])
    ].map((plan) => ({ value: plan, label: plan }))
  ];

  return (
    <form
      className="flex flex-col gap-4 border-b border-[#e3eaf5] px-5 py-5 lg:flex-row lg:flex-wrap lg:items-end"
      method="get"
    >
      <label className="grid min-w-0 flex-1 gap-1.5">
        <span className="sr-only">Search company, owner email or slug</span>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a3b8]" />
          <input
            className="h-11 w-full rounded-xl border border-[#e3eaf5] bg-white pl-10 pr-4 text-sm text-[#0b1328] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10"
            defaultValue={filters.query}
            name="q"
            placeholder="Search company, owner email or slug..."
            type="search"
          />
        </div>
      </label>

      <SelectField
        defaultValue={filters.status}
        id="companies-status-filter"
        label="Status"
        name="status"
        options={statusOptions}
      />

      <SelectField
        defaultValue={filters.plan}
        id="companies-plan-filter"
        label="Plan"
        name="plan"
        options={planOptions}
      />

      <SelectField
        defaultValue={filters.range}
        icon={<CalendarIcon className="h-4 w-4" />}
        id="companies-range-filter"
        label="Date range"
        name="range"
        options={rangeOptions}
      />

      <div className="flex items-end gap-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e3eaf5] bg-white px-4 text-sm font-semibold text-[#0b1328] transition hover:bg-[#f8fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
          type="submit"
        >
          <FilterIcon className="h-4 w-4 text-[#64748b]" />
          Filter
        </button>

        <button
          aria-label="Column settings"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#e3eaf5] bg-white text-[#64748b] transition hover:bg-[#f8fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
          title="Column settings"
          type="button"
        >
          <ColumnsIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
