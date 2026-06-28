import {
  companyDetailInputClassName,
  companyDetailPrimaryButtonClassName,
  companyDetailSelectClassName,
  CompanyDetailCard
} from "@/components/admin/company-detail/company-detail-ui";
import type { AdminDateRange } from "@/lib/admin/date-range";
import { formatAdminDateInput, formatAdminRangeDisplayLabel } from "@/lib/admin/date-range";

export function CompanyDateRangeFilter({
  range,
  rangeKey
}: {
  range: AdminDateRange;
  rangeKey: string;
}) {
  return (
    <CompanyDetailCard>
      <form className="grid gap-4 lg:grid-cols-[minmax(0,160px)_minmax(0,160px)_minmax(0,160px)_auto_1fr] lg:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Période</span>
          <select
            className={companyDetailSelectClassName}
            defaultValue={rangeKey}
            name="range"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Du</span>
          <input
            className={companyDetailInputClassName}
            defaultValue={formatAdminDateInput(range.from)}
            name="from"
            type="date"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Au</span>
          <input
            className={companyDetailInputClassName}
            defaultValue={formatAdminDateInput(range.to)}
            name="to"
            type="date"
          />
        </label>
        <div>
          <button className={companyDetailPrimaryButtonClassName} type="submit">
            Appliquer
          </button>
        </div>
        <p className="text-sm font-semibold text-[#64748b] lg:text-right">
          {formatAdminRangeDisplayLabel(range)}
        </p>
      </form>
    </CompanyDetailCard>
  );
}
