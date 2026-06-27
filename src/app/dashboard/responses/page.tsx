import { DashboardPageHeader } from "@/components/dashboard/dashboard-ui";
import { AppointmentsCalendarTab } from "@/components/responses/AppointmentsCalendarTab";
import { SlotAlertsTab } from "@/components/responses/SlotAlertsTab";
import { ResponsesTabs } from "@/components/responses/ResponsesTabs";
import {
  loadOpeningResponseGroups,
  loadServices
} from "@/lib/dashboard/operations-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import {
  filterOpeningGroupsExtended,
  normalizeExtendedOpeningFilters,
  normalizeResponsesTab,
  paginateOpeningGroups
} from "@/lib/responses/filters";
import { loadAppointmentCalendarItems } from "@/lib/responses/queries";
import type { ResponsesSearchParams } from "@/lib/responses/types";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { canValidateBookings } from "@/lib/organization/permissions";

type ResponsesPageProps = {
  searchParams: Promise<ResponsesSearchParams>;
};

export default async function ResponsesPage({ searchParams }: ResponsesPageProps) {
  const [params, locale, workspace] = await Promise.all([
    searchParams,
    getRequestLocale(),
    getActiveOrganizationWorkspace()
  ]);
  const copy = getDashboardCopy(locale);
  const activeTab = normalizeResponsesTab(params.tab);
  const openingFilters = normalizeExtendedOpeningFilters(params);
  const [openingGroups, services, calendarData] = await Promise.all([
    loadOpeningResponseGroups(),
    loadServices(),
    activeTab === "appointments"
      ? loadAppointmentCalendarItems({
          calDate: params.calDate,
          calInterval: params.calInterval
        })
      : Promise.resolve(null)
  ]);

  const filteredOpeningGroups = filterOpeningGroupsExtended(
    openingGroups,
    openingFilters
  );
  const paginatedGroups = paginateOpeningGroups(
    filteredOpeningGroups,
    openingFilters.page,
    openingFilters.pageSize
  );
  const servicePriceById = new Map(
    services.map((service) => [service.id, service.normal_price_cents])
  );
  const canValidate =
    workspace.status === "ready" &&
    canValidateBookings(workspace.organization.role);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description={copy.responses.description}
        title={copy.responses.title}
      />

      <ResponsesTabs
        activeTab={activeTab}
        appointmentsLabel={copy.responses.tabs.appointments}
        calendarAnchor={calendarData?.anchor ?? new Date()}
        calendarInterval={calendarData?.interval ?? "1d"}
        openingFilters={openingFilters}
        openingsLabel={copy.responses.tabs.openings}
      />

      {activeTab === "appointments" && calendarData ? (
        <AppointmentsCalendarTab
          anchor={calendarData.anchor}
          interval={calendarData.interval}
          items={calendarData.items}
          locale={locale}
          rangeEnd={calendarData.rangeEnd}
          rangeStart={calendarData.rangeStart}
        />
      ) : (
        <SlotAlertsTab
          canValidate={canValidate}
          filteredCount={filteredOpeningGroups.length}
          filters={openingFilters}
          groups={paginatedGroups.items}
          locale={locale}
          notice={params.notice}
          servicePriceById={servicePriceById}
          services={services}
          totalCount={openingGroups.length}
          validationError={params.validationError}
        />
      )}
    </div>
  );
}
