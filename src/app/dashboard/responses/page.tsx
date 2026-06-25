import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import {
  buildOpeningResponsesResetHref,
  filterOpeningResponseGroups,
  loadAppointmentResponseCalendar,
  loadOpeningResponseGroups,
  loadServices,
  normalizeOpeningResponsesFilters,
  type AppointmentResponseCalendarItem,
  type OpeningResponseCustomer,
  type OpeningResponsesFilters
} from "@/lib/dashboard/operations-data";
import {
  formatOpeningOfferStatus,
  formatOpeningStatus
} from "@/lib/dashboard/status-labels";
import { getDashboardCopy, intlLocale } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/types";
import type { InboundSmsClassification } from "@/lib/sms/inbound";

type ResponsesPageProps = {
  searchParams: Promise<{
    tab?: string;
    range?: string;
    serviceId?: string;
    q?: string;
  }>;
};

function formatDateTime(value: string | null, locale: Locale) {
  if (!value) {
    return getDashboardCopy(locale).common.dateUnknown;
  }

  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatTime(value: string | null, locale: Locale) {
  if (!value) {
    return getDashboardCopy(locale).common.timeUnknown;
  }

  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeStyle: "short"
  }).format(new Date(value));
}

function formatClassification(
  classification: InboundSmsClassification,
  locale: Locale
) {
  const labels = getDashboardCopy(locale).responses.classifications;

  switch (classification) {
    case "appointment_confirm":
      return labels.appointment_confirm;
    case "appointment_cancel":
      return labels.appointment_cancel;
    case "opt_out":
      return labels.opt_out;
    case "waitlist_positive":
      return labels.waitlist_positive;
    default:
      return labels.unknown;
  }
}

function formatAppointmentStatus(status: string | null, locale: Locale) {
  const labels = getDashboardCopy(locale).responses.appointmentStatuses;

  switch (status) {
    case "scheduled":
      return labels.scheduled;
    case "cancelled":
      return labels.cancelled;
    default:
      return status ?? labels.unknown;
  }
}

function formatConfirmationStatus(status: string | null, locale: Locale) {
  const labels = getDashboardCopy(locale).responses.confirmationStatuses;

  switch (status) {
    case "confirmed_by_client":
      return labels.confirmed_by_client;
    case "cancelled_by_client":
      return labels.cancelled_by_client;
    case "pending":
      return labels.pending;
    case "not_requested":
      return labels.not_requested;
    default:
      return status ?? labels.unknown;
  }
}

function formatOpeningReplyStatus(
  customer: OpeningResponseCustomer,
  locale: Locale
) {
  const labels = getDashboardCopy(locale).responses.replyStatuses;

  if (customer.offerStatus === "selected") {
    return labels.selected;
  }

  if (customer.offerStatus === "rejected") {
    return labels.rejected;
  }

  if (customer.replyClassification === "opt_out") {
    return labels.opt_out;
  }

  if (customer.replyClassification === "waitlist_positive") {
    return labels.waitlist_positive;
  }

  if (customer.replyClassification === "unknown") {
    return labels.unknown;
  }

  return labels.no_reply;
}

function TabLink({
  active,
  href,
  label
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={`rounded-full border px-4 py-2 text-sm font-black ${
        active
          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_12px_24px_rgba(79,125,243,0.22)]"
          : "border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-slate-50"
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}

function buildOpeningsHref(filters: OpeningResponsesFilters) {
  const params = new URLSearchParams({
    tab: "openings",
    range: filters.range,
    serviceId: filters.serviceId
  });

  if (filters.q) {
    params.set("q", filters.q);
  }

  return `/dashboard/responses?${params.toString()}`;
}

function OpeningResponsesFiltersForm({
  filteredCount,
  filters,
  locale,
  services,
  totalCount
}: {
  filteredCount: number;
  filters: OpeningResponsesFilters;
  locale: Locale;
  services: Array<{
    id: string;
    name: string;
  }>;
  totalCount: number;
}) {
  const copy = getDashboardCopy(locale);
  const openingRangeOptions: Array<{
    label: string;
    value: OpeningResponsesFilters["range"];
  }> = [
    { label: copy.responses.ranges.this_week, value: "this_week" },
    { label: copy.responses.ranges.two_weeks, value: "two_weeks" },
    { label: copy.responses.ranges.one_month, value: "one_month" },
    { label: copy.responses.ranges.three_months, value: "three_months" },
    { label: copy.responses.ranges.all, value: "all" }
  ];

  return (
    <form
      className="mb-5 grid gap-3 rounded-[1.5rem] border border-[var(--line)] bg-slate-50 p-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]"
      method="get"
    >
      <input name="tab" type="hidden" value="openings" />
      <label className="grid gap-2 text-sm font-bold">
        {copy.responses.filters.period}
        <select
          className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-3"
          defaultValue={filters.range}
          name="range"
        >
          {openingRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        {copy.common.service}
        <select
          className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-3"
          defaultValue={filters.serviceId}
          name="serviceId"
        >
          <option value="all">{copy.responses.filters.allServices}</option>
          <option value="none">{copy.common.serviceNotSpecified}</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        {copy.common.search}
        <input
          aria-label={copy.responses.filters.searchAria}
          autoComplete="off"
          className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-3"
          defaultValue={filters.q}
          inputMode="search"
          maxLength={80}
          name="q"
          placeholder={copy.responses.filters.searchPlaceholder}
          type="search"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:content-end">
        <button
          className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
          type="submit"
        >
          {copy.common.filter}
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black text-[var(--foreground)]"
          href={buildOpeningResponsesResetHref()}
        >
          {copy.common.reset}
        </Link>
      </div>
      <div className="grid gap-1 text-xs font-bold text-[var(--muted)] lg:col-span-4">
        <p>{copy.responses.filters.displayed(filteredCount, totalCount)}</p>
        {filters.q ? <p>{copy.responses.filters.search(filters.q)}</p> : null}
      </div>
    </form>
  );
}

function AppointmentResponseCard({
  item,
  locale
}: {
  item: AppointmentResponseCalendarItem;
  locale: Locale;
}) {
  const copy = getDashboardCopy(locale);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black">{item.customerName}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {item.customerPhone || copy.common.phoneUnknown}
          </p>
        </div>
        <StatusBadge>{formatClassification(item.classification, locale)}</StatusBadge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-black uppercase text-[var(--muted)]">
            {copy.appointments.title}
          </dt>
          <dd className="mt-1 font-bold">
            {item.appointmentStartsAt
              ? formatTime(item.appointmentStartsAt, locale)
              : copy.common.dateUnknown}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase text-[var(--muted)]">
            {copy.common.service}
          </dt>
          <dd className="mt-1 font-bold">
            {item.serviceName ?? copy.common.serviceNotSpecified}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase text-[var(--muted)]">
            {copy.responses.labels.received}
          </dt>
          <dd className="mt-1 font-bold">
            {formatDateTime(item.inboundReceivedAt, locale)}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge>
          {formatAppointmentStatus(item.appointmentStatus, locale)}
        </StatusBadge>
        <StatusBadge>
          {formatConfirmationStatus(item.confirmationStatus, locale)}
        </StatusBadge>
      </div>
      <p className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6">
        {item.inboundBody}
      </p>
    </article>
  );
}

export default async function ResponsesPage({
  searchParams
}: ResponsesPageProps) {
  const [params, locale] = await Promise.all([searchParams, getRequestLocale()]);
  const copy = getDashboardCopy(locale);
  const activeTab = params.tab === "appointments" ? "appointments" : "openings";
  const openingFilters = normalizeOpeningResponsesFilters(params);
  const [appointmentGroups, openingGroups, services] = await Promise.all([
    loadAppointmentResponseCalendar(),
    loadOpeningResponseGroups(),
    loadServices()
  ]);
  const filteredOpeningGroups = filterOpeningResponseGroups(
    openingGroups,
    openingFilters
  );
  const tabs = [
    {
      label: copy.responses.tabs.openings,
      value: "openings"
    },
    {
      label: copy.responses.tabs.appointments,
      value: "appointments"
    }
  ];

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description={copy.responses.description}
        title={copy.responses.title}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <TabLink
            active={activeTab === tab.value}
            href={
              tab.value === "openings"
                ? buildOpeningsHref(openingFilters)
                : "/dashboard/responses?tab=appointments"
            }
            key={tab.value}
            label={tab.label}
          />
        ))}
      </div>

      {activeTab === "appointments" ? (
        <Panel
          description={copy.responses.appointmentPanel.description}
          title={copy.responses.appointmentPanel.title}
        >
          {appointmentGroups.length > 0 ? (
            <div className="grid gap-5">
              {appointmentGroups.map((group) => (
                <section className="grid gap-3" key={group.dateKey}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-black">{group.dateLabel}</h2>
                    <p className="text-sm font-bold text-[var(--muted)]">
                      {group.items.length} {copy.responses.counts.responses}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {group.items.map((item) => (
                      <AppointmentResponseCard
                        item={item}
                        key={item.id}
                        locale={locale}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              description={copy.responses.appointmentPanel.emptyDescription}
              title={copy.responses.appointmentPanel.emptyTitle}
            />
          )}
          <Link
            className="mt-4 inline-flex text-sm font-black text-[var(--primary)]"
            href="/dashboard/appointments"
          >
            {copy.responses.appointmentPanel.link}
          </Link>
        </Panel>
      ) : (
        <Panel
          description={copy.responses.openingsPanel.description}
          title={copy.responses.openingsPanel.title}
        >
          <OpeningResponsesFiltersForm
            filteredCount={filteredOpeningGroups.length}
            filters={openingFilters}
            locale={locale}
            services={services.map((service) => ({
              id: service.id,
              name: service.name
            }))}
            totalCount={openingGroups.length}
          />
          {filteredOpeningGroups.length > 0 ? (
            <div className="grid gap-5">
              {filteredOpeningGroups.map((group) => (
                <section
                  className="rounded-[1.5rem] border border-[var(--line)] bg-slate-50 p-4"
                  key={group.openingId}
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">
                          {group.openingTitle}
                        </h2>
                        <StatusBadge>
                          {formatOpeningStatus(group.openingStatus, locale)}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                        {formatDateTime(group.startTime, locale)}
                        {group.endTime
                          ? ` - ${formatTime(group.endTime, locale)}`
                          : ""}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[var(--muted)]">
                        {group.serviceName ?? copy.common.serviceNotSpecified}
                        {group.offerLabel ? ` - ${group.offerLabel}` : ""}
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 text-sm font-black text-[var(--foreground)]"
                      href={`/dashboard/cancellations/${group.openingId}`}
                    >
                      {copy.responses.openingsPanel.view}
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-black text-[var(--muted)] sm:grid-cols-4">
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.responseCount} {copy.responses.counts.responses}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.positiveCount} {copy.responses.counts.positives}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.noReplyCount} {copy.responses.counts.noReply}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.sentCount} {copy.responses.counts.smsSent}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {group.customers.map((customer) => (
                      <article
                        className="rounded-2xl border border-[var(--line)] bg-white p-4"
                        key={customer.offerId}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-black">
                              {customer.customerName}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {customer.customerPhone || copy.common.phoneUnknown}
                            </p>
                          </div>
                          <StatusBadge>
                            {formatOpeningReplyStatus(customer, locale)}
                          </StatusBadge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[var(--muted)]">
                          {customer.responseRank ? (
                            <span className="rounded-full bg-[#f4faf7] px-2 py-1">
                              {copy.responses.labels.rank} #{customer.responseRank}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-[#f4faf7] px-2 py-1">
                            {copy.responses.labels.offer}:{" "}
                            {formatOpeningOfferStatus(
                              customer.offerStatus,
                              locale
                            )}
                          </span>
                          {customer.replyClassification ===
                            "waitlist_positive" &&
                          customer.offerStatus !== "selected" ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
                              {copy.responses.labels.awaitingManualValidation}
                            </span>
                          ) : null}
                        </div>
                        {customer.lastInboundBody ?? customer.responseText ? (
                          <p className="mt-3 rounded-xl border border-[var(--line)] bg-slate-50 p-3 text-sm leading-6">
                            {customer.lastInboundBody ?? customer.responseText}
                          </p>
                        ) : null}
                        {customer.lastInboundReceivedAt ??
                        customer.respondedAt ? (
                          <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                            {copy.responses.labels.received}:{" "}
                            {formatDateTime(
                              customer.lastInboundReceivedAt ??
                                customer.respondedAt,
                              locale
                            )}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              <EmptyState
                description={
                  openingGroups.length > 0
                    ? copy.responses.openingsPanel.emptyFilteredDescription
                    : copy.responses.openingsPanel.emptyDescription
                }
                title={
                  openingGroups.length > 0
                    ? copy.responses.openingsPanel.emptyFilteredTitle
                    : copy.responses.openingsPanel.emptyTitle
                }
              />
              {openingGroups.length > 0 ? (
                <Link
                  className="justify-self-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-black text-[var(--foreground)]"
                  href={buildOpeningResponsesResetHref()}
                >
                  {copy.common.reset}
                </Link>
              ) : null}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
