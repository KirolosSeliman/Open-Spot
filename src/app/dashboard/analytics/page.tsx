import { InsightsPageContent } from "@/components/analytics/insights-page-content";
import {
  getInsightsEmptyData,
  loadInsightsData,
  parseInsightsFilters
} from "@/lib/analytics/insights-data";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{
    period?: string;
    service?: string;
    granularity?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = parseInsightsFilters(resolvedSearchParams);
  const workspace = await getActiveOrganizationWorkspace();
  const organizationName =
    workspace.status === "ready" ? workspace.organization.name : "Open Spot";
  const timezone =
    workspace.status === "ready"
      ? workspace.organization.timezone
      : "America/Toronto";

  const data =
    workspace.status === "ready"
      ? await loadInsightsData({
          organizationId: workspace.organization.id,
          organizationName: workspace.organization.name,
          timezone,
          filters
        })
      : getInsightsEmptyData({
          organizationName,
          timezone,
          filters
        });

  return <InsightsPageContent data={data} />;
}
