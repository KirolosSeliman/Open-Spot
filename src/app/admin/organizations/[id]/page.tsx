import Link from "next/link";
import { notFound } from "next/navigation";

import { ResendOwnerInvitationButton } from "@/components/admin/resend-owner-invitation-button";
import { Card } from "@/components/ui/card";
import {
  archiveOrganizationAction,
  disableOrganizationAction,
  endOrganizationManagerSessionsAction,
  pauseOrganizationSmsAction,
  reactivateOrganizationAction,
  resumeOrganizationSmsAction,
  runOrganizationHealthCheckAction,
  toggleOrganizationInternalTestAction,
  unarchiveOrganizationAction,
  updateOrganizationBillingTermsAction,
  updateOrganizationAdminNoteAction,
  updateOrganizationSupportStatusAction
} from "@/lib/admin/actions";
import { startManagerModeAction } from "@/lib/admin/manager-mode-actions";
import { parseAdminDateRange, formatAdminDateInput } from "@/lib/admin/date-range";
import { loadOrganizationAdminControlsPanel } from "@/lib/admin/organization-controls";
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

  const controlsPanel = await loadOrganizationAdminControlsPanel({
    admin: access.admin,
    organizationId: id
  });

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
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
            href={`/admin/organizations/${overview.organization.id}/sms`}
          >
            SMS
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
            href={`/admin/organizations/${overview.organization.id}/replies`}
          >
            Replies
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
            href={`/admin/organizations/${overview.organization.id}/compliance`}
          >
            Compliance
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
            href={`/admin/organizations/${overview.organization.id}/onboarding`}
          >
            Onboarding
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
            href={`/admin/organizations/${overview.organization.id}/billing`}
          >
            Billing
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
          <ResendOwnerInvitationButton
            organizationId={overview.organization.id}
            ownerEmail={overview.organization.ownerEmail}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-black">Admin visibility</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Archiving hides this company from the active admin list. It does
              not disable the merchant dashboard, block SMS, or delete data.
            </p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div>
                <dt className="font-bold text-[var(--muted)]">Status</dt>
                <dd>
                  {controlsPanel.controls.archived_at ? "Archived" : "Active"}
                </dd>
              </div>
              {controlsPanel.controls.archived_at ? (
                <>
                  <div>
                    <dt className="font-bold text-[var(--muted)]">Archived at</dt>
                    <dd>{formatDate(controlsPanel.controls.archived_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[var(--muted)]">Reason</dt>
                    <dd>{controlsPanel.controls.archived_reason ?? "No reason stored"}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </div>
          {controlsPanel.controls.archived_at ? (
            <form action={unarchiveOrganizationAction}>
              <input name="organizationId" type="hidden" value={overview.organization.id} />
              <input name="returnTo" type="hidden" value={`/admin/organizations/${overview.organization.id}`} />
              <button className="min-h-11 rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black disabled:opacity-50" disabled={!controlsPanel.permissions.canUnarchive} type="submit">
                Unarchive company
              </button>
            </form>
          ) : (
            <form action={archiveOrganizationAction} className="grid min-w-0 gap-2 sm:min-w-80">
              <input name="organizationId" type="hidden" value={overview.organization.id} />
              <input name="returnTo" type="hidden" value={`/admin/organizations/${overview.organization.id}`} />
              <input
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
                name="reason"
                placeholder="Archive reason"
                required
              />
              <button className="min-h-11 rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black disabled:opacity-50" disabled={!controlsPanel.permissions.canArchive} type="submit">
                Archive company
              </button>
            </form>
          )}
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

      <Card>
        <h2 className="text-lg font-black">Billing terms</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          These terms are used for internal estimates only. They do not charge
          the merchant automatically and are not invoices.
        </p>
        <form action={updateOrganizationBillingTermsAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <input name="organizationId" type="hidden" value={overview.organization.id} />
          <label className="grid gap-2 text-sm font-bold">
            Monthly subscription
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={(overview.billing.terms.monthlySubscriptionCents / 100).toFixed(2)}
              disabled={!controlsPanel.permissions.canUpdateBillingTerms}
              min="0"
              name="monthlySubscription"
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Currency
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm uppercase"
              defaultValue={overview.billing.terms.currency}
              disabled={!controlsPanel.permissions.canUpdateBillingTerms}
              maxLength={3}
              name="currency"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Filled spot fee model
            <select
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
              defaultValue={overview.billing.terms.filledSpotFeeMode}
              disabled={!controlsPanel.permissions.canUpdateBillingTerms}
              name="filledSpotFeeMode"
            >
              <option value="none">None</option>
              <option value="fixed">Fixed fee</option>
              <option value="percentage">Percentage</option>
              <option value="fixed_plus_percentage">Fixed + percentage</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Fixed fee per filled spot
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={(overview.billing.terms.filledSpotFixedFeeCents / 100).toFixed(2)}
              disabled={!controlsPanel.permissions.canUpdateBillingTerms}
              min="0"
              name="fixedFee"
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Percentage fee
            <input
              className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
              defaultValue={(overview.billing.terms.filledSpotPercentageBps / 100).toString()}
              disabled={!controlsPanel.permissions.canUpdateBillingTerms}
              max="100"
              min="0"
              name="percentage"
              step="0.01"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold lg:col-span-2">
            Notes
            <textarea
              className="min-h-24 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
              defaultValue={overview.billing.notes ?? ""}
              disabled={!controlsPanel.permissions.canUpdateBillingTerms}
              name="notes"
              placeholder="Internal billing note"
            />
          </label>
          <button className="min-h-11 w-fit rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:opacity-50" disabled={!controlsPanel.permissions.canUpdateBillingTerms} type="submit">
            Save billing terms
          </button>
        </form>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Filled spots in range",
              value: numberFormatter.format(overview.billing.filledSpotsInRange)
            },
            {
              label: "Filled spot fees",
              value: formatEstimatedSmsCost(
                overview.billing.filledSpotFeesInRangeCents,
                overview.billing.terms.currency
              )
            },
            {
              label: "Estimated SMS cost",
              value: formatEstimatedSmsCost(
                overview.billing.estimatedSmsCostInRangeCents,
                overview.billing.terms.currency
              )
            },
            {
              label: "Monthly subscription",
              value: formatEstimatedSmsCost(
                overview.billing.terms.monthlySubscriptionCents,
                overview.billing.terms.currency
              )
            },
            {
              label: "Estimated contribution",
              value: formatEstimatedSmsCost(
                overview.billing.estimatedContributionInRangeCents,
                overview.billing.terms.currency
              )
            }
          ].map((item) => (
            <div className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4" key={item.label}>
              <p className="text-xs font-bold text-[var(--muted)]">{item.label}</p>
              <p className="mt-2 text-lg font-black">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2">
          {overview.billing.warnings.map((warning) => (
            <p className="text-sm text-[var(--muted)]" key={warning}>
              {warning}
            </p>
          ))}
        </div>
      </Card>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black">Internal support</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Internal-only controls. These fields are not visible in the merchant
            dashboard.
          </p>
          <div className="mt-4 grid gap-4">
            <form action={updateOrganizationSupportStatusAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input name="organizationId" type="hidden" value={overview.organization.id} />
              <select
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
                defaultValue={controlsPanel.controls.support_status}
                disabled={!controlsPanel.permissions.canUpdateSupportStatus}
                name="supportStatus"
              >
                <option value="healthy">Healthy</option>
                <option value="needs_setup">Needs setup</option>
                <option value="watchlist">Watchlist</option>
                <option value="blocked">Blocked</option>
                <option value="disabled">Disabled</option>
              </select>
              <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:opacity-50" disabled={!controlsPanel.permissions.canUpdateSupportStatus} type="submit">
                Save status
              </button>
            </form>

            <form action={updateOrganizationAdminNoteAction} className="grid gap-3">
              <input name="organizationId" type="hidden" value={overview.organization.id} />
              <textarea
                className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                defaultValue={controlsPanel.controls.admin_note ?? ""}
                disabled={!controlsPanel.permissions.canUpdateAdminNote}
                name="adminNote"
                placeholder="Internal support note"
              />
              <button className="min-h-11 w-fit rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:opacity-50" disabled={!controlsPanel.permissions.canUpdateAdminNote} type="submit">
                Save note
              </button>
            </form>

            <form action={toggleOrganizationInternalTestAction} className="flex flex-wrap items-center gap-3">
              <input name="organizationId" type="hidden" value={overview.organization.id} />
              <input name="isInternalTest" type="hidden" value={controlsPanel.controls.is_internal_test ? "false" : "true"} />
              <span className="text-sm font-bold text-[var(--muted)]">
                Internal/test: {controlsPanel.controls.is_internal_test ? "Yes" : "No"}
              </span>
              <button className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black disabled:opacity-50" disabled={!controlsPanel.permissions.canMarkInternalTest} type="submit">
                {controlsPanel.controls.is_internal_test ? "Unmark" : "Mark internal/test"}
              </button>
            </form>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-black">SMS and organization controls</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
            <p>
              SMS paused:{" "}
              <strong className="text-[var(--foreground)]">
                {controlsPanel.controls.sms_sending_paused ? "Yes" : "No"}
              </strong>
            </p>
            <p>
              Disabled:{" "}
              <strong className="text-[var(--foreground)]">
                {controlsPanel.controls.disabled_at ? "Yes" : "No"}
              </strong>
            </p>
            {controlsPanel.controls.sms_pause_reason ? (
              <p>Pause reason: {controlsPanel.controls.sms_pause_reason}</p>
            ) : null}
            {controlsPanel.controls.disabled_reason ? (
              <p>Disabled reason: {controlsPanel.controls.disabled_reason}</p>
            ) : null}
            {controlsPanel.controls.last_health_check_at ? (
              <p>
                Last health check: {formatDate(controlsPanel.controls.last_health_check_at)} ·{" "}
                {controlsPanel.controls.last_health_check_status ?? "unknown"}
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            {controlsPanel.controls.sms_sending_paused ? (
              <form action={resumeOrganizationSmsAction}>
                <input name="organizationId" type="hidden" value={overview.organization.id} />
                <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:opacity-50" disabled={!controlsPanel.permissions.canResumeSms} type="submit">
                  Resume SMS
                </button>
              </form>
            ) : (
              <form action={pauseOrganizationSmsAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input name="organizationId" type="hidden" value={overview.organization.id} />
                <input className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm" name="reason" placeholder="Pause reason" required />
                <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:opacity-50" disabled={!controlsPanel.permissions.canPauseSms} type="submit">
                  Pause SMS
                </button>
              </form>
            )}

            {controlsPanel.controls.disabled_at ? (
              <form action={reactivateOrganizationAction}>
                <input name="organizationId" type="hidden" value={overview.organization.id} />
                <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:opacity-50" disabled={!controlsPanel.permissions.canReactivate} type="submit">
                  Reactivate organization
                </button>
              </form>
            ) : (
              <form action={disableOrganizationAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input name="organizationId" type="hidden" value={overview.organization.id} />
                <input className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm" name="reason" placeholder="Disable reason" required />
                <button className="min-h-11 rounded-full border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 disabled:opacity-50" disabled={!controlsPanel.permissions.canDisable} type="submit">
                  Disable organization
                </button>
              </form>
            )}

            <form action={runOrganizationHealthCheckAction}>
              <input name="organizationId" type="hidden" value={overview.organization.id} />
              <button className="min-h-11 rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black disabled:opacity-50" disabled={!controlsPanel.permissions.canRunHealthCheck} type="submit">
                Run health check
              </button>
            </form>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Active manager sessions</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ending sessions marks them ended; it does not delete audit history.
            </p>
          </div>
          <form action={endOrganizationManagerSessionsAction}>
            <input name="organizationId" type="hidden" value={overview.organization.id} />
            <button className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black disabled:opacity-50" disabled={!controlsPanel.permissions.canEndManagerSessions || controlsPanel.activeManagerSessions.length === 0} type="submit">
              End sessions
            </button>
          </form>
        </div>
        <div className="mt-4 grid gap-3">
          {controlsPanel.activeManagerSessions.map((session) => (
            <div className="rounded-2xl border border-[var(--line)] p-4" key={session.id}>
              <p className="font-black">{session.admin_email}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Started {formatDate(session.started_at)} · Expires {formatDate(session.expires_at)}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{session.reason}</p>
            </div>
          ))}
          {controlsPanel.activeManagerSessions.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No active manager sessions.</p>
          ) : null}
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
