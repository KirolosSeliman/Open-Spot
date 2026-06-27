import { SubscriptionPageContent } from "@/components/subscription/subscription-page-content";
import {
  getSubscriptionEmptyData,
  loadSubscriptionPageData
} from "@/lib/billing/subscription-data";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{
    month?: string;
  }>;
}) {
  const [{ month }, locale, workspace] = await Promise.all([
    searchParams,
    getRequestLocale(),
    getActiveOrganizationWorkspace()
  ]);
  const timezone =
    workspace.status === "ready"
      ? workspace.organization.timezone
      : "America/Toronto";

  if (workspace.status !== "ready") {
    const data = getSubscriptionEmptyData({ locale, timezone, monthKey: month });

    return <SubscriptionPageContent data={data} />;
  }

  const data = await loadSubscriptionPageData({
    organizationId: workspace.organization.id,
    timezone,
    locale,
    monthKey: month
  }).catch(() => ({
    ...getSubscriptionEmptyData({ locale, timezone, monthKey: month }),
    loadError: true
  }));

  return <SubscriptionPageContent data={data} />;
}
