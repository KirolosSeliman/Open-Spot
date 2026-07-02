import Link from "next/link";
import { Suspense } from "react";

import { LineChart } from "@/components/dashboard/home/charts";
import {
  ArrowRightIcon,
  BellIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  CancelIcon,
  ChevronRightIcon,
  ClockIcon,
  DollarIcon,
  DoorIcon,
  ListIcon,
  MessageIcon,
  ReplyIcon,
  UsersIcon,
  AlertIcon
} from "@/components/dashboard/home/icons";
import {
  EmptyBlock,
  HomeKpiCard,
  HomeSectionCard,
  StatusPill
} from "@/components/dashboard/home/home-ui";
import { DashboardRangeControls } from "@/components/dashboard/home/range-controls";
import type { DashboardHomeData } from "@/lib/dashboard/dashboard-home-data";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import { intlLocale } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

function formatCurrency(cents: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
      href={href}
    >
      {label}
      <ChevronRightIcon />
    </Link>
  );
}

function ActivityIcon({ tone }: { tone: string }) {
  const tones: Record<string, string> = {
    blue: "bg-[#eff6ff] text-[#2563ff]",
    green: "bg-[#ecfdf3] text-[#16a34a]",
    orange: "bg-[#fff7ed] text-[#f97316]",
    purple: "bg-[#f5f3ff] text-[#7c3aed]",
    neutral: "bg-[#f1f5f9] text-[#64748b]"
  };

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        tones[tone] ?? tones.neutral
      )}
    >
      <MessageIcon />
    </span>
  );
}

export function DashboardHomeView({
  data,
  copy,
  locale,
  actionItems
}: {
  data: DashboardHomeData;
  copy: DashboardCopy;
  locale: Locale;
  actionItems: Array<{
    href: string;
    label: string;
    description: string;
    value: number;
    tone: "blue" | "orange" | "purple" | "green";
  }>;
}) {
  const d = copy.dashboard;

  return (
    <div className="grid min-w-0 gap-6 bg-[#f8fbff] pb-8">
      <header className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="min-w-0 break-words text-[clamp(1.45rem,7.5vw,1.75rem)] font-bold tracking-tight text-[#0b1328] sm:text-[2rem]">
            {d.greeting(data.organizationName)}
          </h1>
          <p className="mt-2 min-w-0 text-sm leading-6 text-[#64748b] sm:text-base">
            {d.subtitle}
          </p>
        </div>
        <Suspense fallback={null}>
          <DashboardRangeControls
            currentRange={data.range}
            filtersLabel={d.filters}
            rangeLabel={data.rangeLabel}
            rangeOptions={[
              { value: "7d", label: d.range7Days },
              { value: "30d", label: d.range30Days },
              { value: "90d", label: d.range90Days }
            ]}
          />
        </Suspense>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <HomeKpiCard
          description={d.metrics.customers[1]}
          icon={<UsersIcon />}
          label={d.metrics.customers[0]}
          metric={data.metrics.customers}
          tone="blue"
          value={formatNumber(data.metrics.customers.value, locale)}
        />
        <HomeKpiCard
          description={d.metrics.services[1]}
          icon={<BriefcaseIcon />}
          label={d.metrics.services[0]}
          metric={data.metrics.services}
          tone="blue"
          value={formatNumber(data.metrics.services.value, locale)}
        />
        <HomeKpiCard
          description={d.metrics.waitlist[1]}
          icon={<ListIcon />}
          label={d.metrics.waitlist[0]}
          metric={data.metrics.waitlist}
          tone="violet"
          value={formatNumber(data.metrics.waitlist.value, locale)}
        />
        <HomeKpiCard
          description={d.metrics.openCancellations[1]}
          icon={<CancelIcon />}
          label={d.metrics.openCancellations[0]}
          metric={data.metrics.openCancellations}
          tone="orange"
          value={formatNumber(data.metrics.openCancellations.value, locale)}
        />
        <HomeKpiCard
          description={d.metrics.smsSent[1]}
          icon={<MessageIcon />}
          label={d.metrics.smsSent[0]}
          metric={data.metrics.smsSent}
          tone="violet"
          value={formatNumber(data.metrics.smsSent.value, locale)}
        />
        <HomeKpiCard
          description={d.metrics.recoveredAppointments[1]}
          icon={<CalendarCheckIcon />}
          label={d.metrics.recoveredAppointments[0]}
          metric={data.metrics.recoveredAppointments}
          tone="green"
          value={formatNumber(data.metrics.recoveredAppointments.value, locale)}
        />
        <HomeKpiCard
          description={d.metrics.pendingResponses[1]}
          icon={<ClockIcon />}
          label={d.metrics.pendingResponses[0]}
          metric={data.metrics.pendingResponses}
          tone="amber"
          value={formatNumber(data.metrics.pendingResponses.value, locale)}
        />
        <HomeKpiCard
          description={d.metrics.recoveredRevenue[1]}
          formatValue
          icon={<DollarIcon />}
          label={d.metrics.recoveredRevenue[0]}
          metric={data.metrics.recoveredRevenue}
          tone="green"
          value={formatCurrency(data.metrics.recoveredRevenue.value, locale)}
        />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <HomeSectionCard title={d.activityOverview}>
          <LineChart
            labels={data.dateAxisLabels}
            series={[
              {
                name: d.metrics.recoveredAppointments[0],
                data: data.activityChart.recoveredAppointments,
                tone: "blue"
              },
              {
                name: d.metrics.openCancellations[0],
                data: data.activityChart.openCancellations,
                tone: "blue",
                dashed: true
              }
            ]}
          />
        </HomeSectionCard>

        <HomeSectionCard title={d.keyPoints}>
          <ul className="grid gap-4">
            <li className="flex min-w-0 gap-3 rounded-[18px] border border-[#e2eaf5] bg-[#f8fbff] p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#16a34a]">
                <DollarIcon />
              </span>
              <p className="min-w-0 text-sm leading-6 text-[#334155]">
                {data.keyPoints.revenueText}
              </p>
            </li>
            <li className="flex min-w-0 gap-3 rounded-[18px] border border-[#e2eaf5] bg-[#f8fbff] p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#7c3aed]">
                <MessageIcon />
              </span>
              <p className="min-w-0 text-sm leading-6 text-[#334155]">{data.keyPoints.smsText}</p>
            </li>
            <li className="flex min-w-0 gap-3 rounded-[18px] border border-[#e2eaf5] bg-[#f8fbff] p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fffbeb] text-[#f59e0b]">
                <ClockIcon />
              </span>
              <p className="min-w-0 text-sm leading-6 text-[#334155]">
                {data.keyPoints.responsesText}
              </p>
            </li>
          </ul>
        </HomeSectionCard>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <HomeSectionCard
          action={
            <ViewAllLink href="/dashboard/responses" label={d.viewAll} />
          }
          title={d.recentResponses[0]}
        >
          {data.recentResponses.length === 0 ? (
            <EmptyBlock
              description={d.recentResponses[2]}
              title={d.recentResponses[1]}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2eaf5] text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                    <th className="px-2 py-3">{copy.common.customer}</th>
                    <th className="px-2 py-3">{copy.common.service}</th>
                    <th className="px-2 py-3">{d.responseColumn}</th>
                    <th className="px-2 py-3">{d.dateTimeColumn}</th>
                    <th className="px-2 py-3">{copy.common.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentResponses.map((row) => (
                    <tr className="border-b border-[#eef2f7]" key={row.id}>
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-[#0b1328]"
                            style={{ backgroundColor: row.avatarColor }}
                          >
                            {row.customerInitials}
                          </span>
                          <span className="font-medium text-[#0b1328]">
                            {row.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-4 text-[#64748b]">{row.serviceName}</td>
                      <td className="px-2 py-4">
                        <StatusPill tone={row.responseTone}>{row.responseLabel}</StatusPill>
                      </td>
                      <td className="px-2 py-4 text-[#64748b]">{row.relativeTime}</td>
                      <td className="px-2 py-4">
                        <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </HomeSectionCard>

        <HomeSectionCard
          action={
            <ViewAllLink href="/dashboard/cancellations" label={d.viewAll} />
          }
          title={d.recentCancellations[0]}
        >
          {data.recentCancellations.length === 0 ? (
            <EmptyBlock
              description={d.recentCancellations[2]}
              title={d.recentCancellations[1]}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2eaf5] text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                    <th className="px-2 py-3">{d.titleColumn}</th>
                    <th className="px-2 py-3">{copy.common.service}</th>
                    <th className="px-2 py-3">{d.dateTimeColumn}</th>
                    <th className="px-2 py-3">{d.estimatedValueColumn}</th>
                    <th className="px-2 py-3">{copy.common.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentCancellations.map((row) => (
                    <tr className="border-b border-[#eef2f7]" key={row.id}>
                      <td className="px-2 py-4 font-medium text-[#0b1328]">
                        {row.title}
                      </td>
                      <td className="px-2 py-4 text-[#64748b]">{row.serviceName}</td>
                      <td className="px-2 py-4 text-[#64748b]">{row.dateTimeLabel}</td>
                      <td className="px-2 py-4 text-[#0b1328]">{row.estimatedValueLabel}</td>
                      <td className="px-2 py-4">
                        <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </HomeSectionCard>
      </div>

      <HomeSectionCard title={d.activityLog}>
        {data.activityLog.length === 0 ? (
          <EmptyBlock description={d.activityLogEmpty[1]} title={d.activityLogEmpty[0]} />
        ) : (
          <ul className="relative grid gap-0">
            {data.activityLog.map((entry, index) => (
              <li
                className="relative flex min-w-0 items-start gap-4 border-b border-[#eef2f7] py-4 last:border-b-0"
                key={entry.id}
              >
                {index < data.activityLog.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-[18px] top-12 w-px bg-[#e2eaf5]"
                  />
                ) : null}
                <ActivityIcon tone={entry.iconTone} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#94a3b8]">
                    {entry.relativeTime}
                  </p>
                  <p className="mt-1 min-w-0 text-sm leading-6 text-[#0b1328]">
                    {entry.message}
                  </p>
                </div>
                <ChevronRightIcon />
              </li>
            ))}
          </ul>
        )}
      </HomeSectionCard>

      <HomeSectionCard description={d.actions.description} title={d.actions.title}>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {actionItems.map((item) => (
            <Link
              className="group flex min-w-0 items-center justify-between gap-4 rounded-[18px] border border-[#e2eaf5] bg-[#f8fbff] p-[clamp(1rem,4.5vw,1.25rem)] transition hover:border-[#cbd5e1] hover:bg-white sm:p-5"
              href={item.href}
              key={item.label}
            >
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    item.tone === "blue" && "bg-[#eff6ff] text-[#2563ff]",
                    item.tone === "orange" && "bg-[#fff7ed] text-[#f97316]",
                    item.tone === "purple" && "bg-[#f5f3ff] text-[#7c3aed]",
                    item.tone === "green" && "bg-[#ecfdf3] text-[#16a34a]"
                  )}
                >
                  {item.tone === "blue" ? (
                    <CalendarCheckIcon />
                  ) : item.tone === "orange" ? (
                    <BellIcon />
                  ) : item.tone === "purple" ? (
                    <CancelIcon />
                  ) : (
                    <UsersIcon />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="min-w-0 font-semibold text-[#0b1328]">{item.label}</p>
                  <p className="mt-1 min-w-0 text-sm leading-6 text-[#64748b]">
                    {item.description}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                "flex h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl px-3 text-xl font-bold text-[#0b1328]",
                  item.tone === "blue" && "bg-[#eff6ff]",
                  item.tone === "orange" && "bg-[#fff7ed]",
                  item.tone === "purple" && "bg-[#f5f3ff]",
                  item.tone === "green" && "bg-[#ecfdf3]"
                )}
              >
                {formatNumber(item.value, locale)}
              </span>
            </Link>
          ))}
        </div>
      </HomeSectionCard>

      <HomeSectionCard
        description={d.remindersPanel.description}
        title={d.remindersPanel.title}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <HomeKpiCard
            description={d.remindersPanel.next7Days[1]}
            icon={<CalendarCheckIcon />}
            label={d.remindersPanel.next7Days[0]}
            metric={data.remindersMetrics.next7Days}
            tone="blue"
            value={formatNumber(data.remindersMetrics.next7Days.value, locale)}
          />
          <HomeKpiCard
            description={d.remindersPanel.confirmed[1]}
            icon={<CalendarCheckIcon />}
            label={d.remindersPanel.confirmed[0]}
            metric={data.remindersMetrics.confirmed}
            tone="green"
            value={formatNumber(data.remindersMetrics.confirmed.value, locale)}
          />
          <HomeKpiCard
            description={d.remindersPanel.awaiting[1]}
            icon={<ClockIcon />}
            label={d.remindersPanel.awaiting[0]}
            metric={data.remindersMetrics.awaiting}
            tone="orange"
            value={formatNumber(data.remindersMetrics.awaiting.value, locale)}
          />
          <HomeKpiCard
            description={d.remindersPanel.failed[1]}
            icon={<AlertIcon />}
            label={d.remindersPanel.failed[0]}
            metric={data.remindersMetrics.failed}
            tone="red"
            value={formatNumber(data.remindersMetrics.failed.value, locale)}
          />
        </div>
      </HomeSectionCard>

      <HomeSectionCard
        description={d.recoveryPanel.description}
        title={d.recoveryPanel.title}
      >
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <HomeKpiCard
            description={d.recoveryPanel.smsCancellations[1]}
            icon={<MessageIcon />}
            label={d.recoveryPanel.smsCancellations[0]}
            metric={data.recoveryMetrics.smsCancellations}
            tone="violet"
            value={formatNumber(data.recoveryMetrics.smsCancellations.value, locale)}
          />
          <HomeKpiCard
            description={d.recoveryPanel.openingsCreated[1]}
            icon={<DoorIcon />}
            label={d.recoveryPanel.openingsCreated[0]}
            metric={data.recoveryMetrics.openingsCreated}
            tone="blue"
            value={formatNumber(data.recoveryMetrics.openingsCreated.value, locale)}
          />
          <HomeKpiCard
            description={d.recoveryPanel.recoveryReplies[1]}
            icon={<ReplyIcon />}
            label={d.recoveryPanel.recoveryReplies[0]}
            metric={data.recoveryMetrics.recoveryReplies}
            tone="green"
            value={formatNumber(data.recoveryMetrics.recoveryReplies.value, locale)}
          />
          <HomeKpiCard
            description={d.recoveryPanel.recoveredAfterSms[1]}
            formatValue
            icon={<DollarIcon />}
            label={d.recoveryPanel.recoveredAfterSms[0]}
            metric={data.recoveryMetrics.recoveredAfterSms}
            tone="green"
            value={formatCurrency(data.recoveryMetrics.recoveredAfterSms.value, locale)}
          />
        </div>
      </HomeSectionCard>

      <HomeSectionCard
        action={
          <div className="text-right">
            <p className="text-sm font-semibold text-[#0b1328]">
              {d.setupProgress(data.setupCompletedCount, data.setupSteps.length)}
            </p>
            <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-[#e2eaf5]">
              <div
                className="h-full rounded-full bg-[#2563ff] transition-all"
                style={{
                  width: `${(data.setupCompletedCount / data.setupSteps.length) * 100}%`
                }}
              />
            </div>
          </div>
        }
        description={d.setup.description}
        title={d.setup.title}
      >
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.setupSteps.map((step) => (
            <Link
              className={cn(
                "group relative flex min-h-[180px] min-w-0 flex-col rounded-[18px] border border-[#e2eaf5] bg-[#f8fbff] p-[clamp(1rem,4.5vw,1.25rem)] transition hover:border-[#cbd5e1] hover:bg-white sm:p-5",
                step.completed && "border-[#dbeafe] bg-white"
              )}
              href={step.href}
              key={step.href}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  step.iconTone === "blue" && "bg-[#eff6ff] text-[#2563ff]",
                  step.iconTone === "purple" && "bg-[#f5f3ff] text-[#7c3aed]",
                  step.iconTone === "orange" && "bg-[#fff7ed] text-[#f97316]",
                  step.iconTone === "green" && "bg-[#ecfdf3] text-[#16a34a]"
                )}
              >
                <BriefcaseIcon />
              </span>
              <p className="mt-4 min-w-0 font-semibold text-[#0b1328]">{step.title}</p>
              <p className="mt-2 min-w-0 flex-1 text-sm leading-6 text-[#64748b]">
                {step.description}
              </p>
              <span className="mt-4 inline-flex h-9 w-9 items-center justify-center self-end rounded-full border border-[#e2eaf5] bg-white text-[#64748b] transition group-hover:border-[#2563ff] group-hover:text-[#2563ff]">
                <ArrowRightIcon />
              </span>
              {step.completed ? (
                <span className="absolute right-4 top-4 rounded-full bg-[#ecfdf3] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#16a34a]">
                  OK
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </HomeSectionCard>
    </div>
  );
}
