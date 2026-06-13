import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { startManagerModeAction } from "@/lib/admin/manager-mode-actions";
import { parseAdminDateRange, formatAdminDateInput } from "@/lib/admin/date-range";
import { loadAdminOrganizationOverview } from "@/lib/admin/organizations";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

const numberFormatter = new Intl.NumberFormat("en-CA");
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No activity";
  }

  return dateFormatter.format(new Date(value));
}

function formatMoneyOrDash(value: number | null) {
  return value === null ? "—" : formatEstimatedSmsCost(value);
}

function Metric({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card>
      <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-black">{value}</p>
      {note ? <p className="mt-2 text-xs text-[var(--muted)]">{note}</p> : null}
    </Card>
  );
}

function SimpleBarChart({
  title,
  description,
  data,
  valueFormatter = (value) => numberFormatter.format(value)
}: {
  title: string;
  description?: string;
  data: Array<{ label: string; value: number }>;
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-5 flex h-40 items-end gap-1 overflow-x-auto">
        {data.map((item) => {
          const height = maxValue > 0 ? Math.max(8, (item.value / maxValue) * 128) : 4;

          return (
            <div className="flex min-w-5 flex-1 flex-col items-center gap-2" key={item.label}>
              <div
                aria-label={`${item.label}: ${valueFormatter(item.value)}`}
                className="w-full rounded-t-md bg-[var(--primary)]"
                style={{ height }}
                title={`${item.label}: ${valueFormatter(item.value)}`}
              />
              <span className="text-[0.62rem] font-bold text-[var(--muted)]">
                {item.label.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
      {maxValue === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">No activity in this period.</p>
      ) : null}
    </Card>
  );
}

export default async function AdminOrganizationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const range = parseAdminDateRange({
    range: getSingleSearchParam(resolvedSearchParams.range),
    from: getSingleSearchParam(resolvedSearchParams.from),
    to: getSingleSearchParam(resolvedSearchParams.to)
  });
  const managerModeError = getSingleSearchParam(
    resolvedSearchParams.managerModeError
  );
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Company overview</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {access.message}
          </p>
        </div>
      </section>
    );
  }

  const overview = await loadAdminOrganizationOverview({
    admin: access.admin,
    organizationId: id,
    range
  });

  if (!overview) {
    notFound();
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Company overview
          </p>
          <h1 className="mt-2 text-3xl font-black">{overview.organization.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Platform admin view for performance, SMS health, and recovery
            activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
            href="/admin/organizations"
          >
            Back to companies
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
            href={`/admin/organizations/${overview.organization.id}?range=${overview.range.rangeKey}`}
          >
            Refresh
          </Link>
        </div>
      </div>

      <Card>
        <form className="grid gap-3 lg:grid-cols-[auto_auto_auto_auto_1fr]" method="get">
          <label className="grid gap-2 text-sm font-bold">
            Range
            <select
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
              defaultValue={overview.range.rangeKey}
              name="range"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            From
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={formatAdminDateInput(range.from)}
              name="from"
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            To
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={formatAdminDateInput(range.to)}
              name="to"
              type="date"
            />
          </label>
          <div className="flex items-end">
            <button
              className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
              type="submit"
            >
              Apply
            </button>
          </div>
          <p className="flex items-end text-sm font-bold text-[var(--muted)]">
            Showing {overview.range.label}
          </p>
        </form>
      </Card>

      <Card className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Identity
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="font-bold text-[var(--muted)]">Organization ID</dt>
              <dd className="break-all font-mono text-xs">{overview.organization.id}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Slug</dt>
              <dd>{overview.organization.slug ?? "No slug"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Created</dt>
              <dd>{formatDate(overview.organization.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Owner / access
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="font-bold text-[var(--muted)]">Owner email</dt>
              <dd>{overview.organization.ownerEmail ?? "Unknown"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Access level</dt>
              <dd>{overview.access.accessLevel}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Timezone</dt>
              <dd>{overview.organization.timezone ?? "Unknown"}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Spots filled"
          note="Validated recoveries only"
          value={numberFormatter.format(overview.kpis.filledSpots)}
        />
        <Metric
          label="Estimated SMS cost"
          note="Estimated, not an invoice"
          value={formatEstimatedSmsCost(overview.kpis.estimatedSmsCostCents)}
        />
        <Metric
          label="Cost per filled spot"
          value={formatMoneyOrDash(overview.kpis.estimatedCostPerFilledSpotCents)}
        />
        <Metric
          label="Customers"
          value={numberFormatter.format(overview.kpis.customersTotal)}
        />
        <Metric
          label="Opted-in customers"
          value={numberFormatter.format(overview.kpis.optedInCustomers)}
        />
        <Metric
          label="SMS sent"
          value={numberFormatter.format(overview.kpis.outboundSms)}
        />
        <Metric
          label="SMS failed"
          value={numberFormatter.format(overview.kpis.failedSms)}
        />
        <Metric
          label="Pending validations"
          value={numberFormatter.format(overview.kpis.pendingValidations)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleBarChart
          data={overview.charts.filledSpotsByDay.map((row) => ({
            label: row.date,
            value: row.count
          }))}
          description="Validated recovered spots by day."
          title="Filled spots over time"
        />
        <SimpleBarChart
          data={overview.charts.smsCostByDay.map((row) => ({
            label: row.date,
            value: row.estimatedCostCents
          }))}
          description="Estimated cost based on outbound SMS count."
          title="Estimated SMS cost over time"
          valueFormatter={formatEstimatedSmsCost}
        />
        <SimpleBarChart
          data={overview.charts.customerGrowthByDay.map((row) => ({
            label: row.date,
            value: row.customersTotal
          }))}
          description="New customers added in this period."
          title="Customer database growth"
        />
        <SimpleBarChart
          data={overview.charts.smsVolumeByDay.map((row) => ({
            label: row.date,
            value: row.outbound + row.inbound
          }))}
          description="Outbound and inbound SMS volume."
          title="SMS volume over time"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h2 className="text-lg font-black">Recent openings</h2>
          <div className="mt-4 grid gap-3">
            {overview.recent.openings.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No openings in this period.</p>
            ) : (
              overview.recent.openings.map((opening) => (
                <div className="rounded-2xl border border-[var(--line)] p-4" key={opening.id}>
                  <p className="font-black">{opening.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {opening.serviceName ?? "No service"} · {opening.status}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {opening.positiveReplies} positive · {opening.pendingValidations} pending · {opening.filledSpots} filled
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-black">Failed SMS</h2>
          <div className="mt-4 grid gap-3">
            {overview.recent.failedSms.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No failed SMS in this period.</p>
            ) : (
              overview.recent.failedSms.map((message) => (
                <div className="rounded-2xl border border-[var(--line)] p-4" key={message.id}>
                  <p className="font-black">{message.toNumberMasked}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {message.provider} · {message.status} · {message.errorCode ?? "No code"}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {message.errorMessage ?? message.providerMessageId ?? "No message"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-black">Pending validations</h2>
          <div className="mt-4 grid gap-3">
            {overview.recent.pendingValidations.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No pending validations in this period.
              </p>
            ) : (
              overview.recent.pendingValidations.map((item) => (
                <div
                  className="rounded-2xl border border-[var(--line)] p-4"
                  key={`${item.openingId}-${item.customerPhoneMasked}`}
                >
                  <p className="font-black">{item.openingTitle}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {item.customerName} · {item.customerPhoneMasked}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Rank {item.responseRank ?? "—"} · {formatDate(item.respondedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-black">Compliance snapshot</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric
            label="Opt-outs"
            value={numberFormatter.format(overview.kpis.optedOutCustomers)}
          />
          <Metric
            label="Unknown replies"
            value={numberFormatter.format(overview.kpis.unknownOrUnlinkedReplies)}
          />
          <Metric
            label="Recovered value"
            value={
              overview.kpis.recoveredValueCents === null
                ? "Not tracked yet"
                : formatEstimatedSmsCost(overview.kpis.recoveredValueCents)
            }
          />
        </div>
        <div className="mt-4 grid gap-2">
          {overview.warnings.map((warning) => (
            <p className="text-sm leading-6 text-[var(--muted)]" key={warning}>
              {warning}
            </p>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Manager mode</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Open this company dashboard as a manager to help with support. Actions
          are audited and the session expires automatically.
        </p>
        {managerModeError ? (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {managerModeError}
          </p>
        ) : null}
        {overview.access.canOpenManagerMode ? (
          <form action={startManagerModeAction} className="mt-5 grid gap-3">
            <input name="organizationId" type="hidden" value={overview.organization.id} />
            <label className="grid gap-2 text-sm font-bold">
              Reason
              <textarea
                className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                name="reason"
                placeholder="Short support reason"
                required
              />
            </label>
            <button
              className="min-h-11 w-fit rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
              type="submit"
            >
              Open as manager
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm font-bold text-[var(--muted)]">
            Manager mode access is not granted for this company.
          </p>
        )}
      </Card>
    </section>
  );
}
