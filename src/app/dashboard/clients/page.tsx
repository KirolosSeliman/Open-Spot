import {
  loadCustomersWithConsent,
  loadServices,
  loadWaitlistView
} from "@/lib/dashboard/operations-data";
import { loadClientsInsightsData } from "@/lib/clients/insights-data";
import { normalizeCustomerListTab } from "@/lib/customers/soft-delete";
import {
  ClientsPageContent,
  type ClientRow
} from "@/components/clients/clients-page-content";
import { ClientsInsightsSection } from "@/components/clients/clients-insights-section";

// Actions menu and edit route `/dashboard/clients/${customer.id}/edit` live in ClientsPageContent.

type ClientsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    notice?: string;
    tab?: string;
    warning?: string;
  }>;
};

function buildServiceInterestsByCustomer(
  entries: Awaited<ReturnType<typeof loadWaitlistView>>["entries"]
) {
  const interestsByCustomer = new Map<string, Set<string>>();

  for (const entry of entries) {
    const existing = interestsByCustomer.get(entry.customer_id) ?? new Set<string>();

    for (const name of entry.serviceInterestNames) {
      existing.add(name);
    }

    if (entry.serviceName) {
      existing.add(entry.serviceName);
    }

    interestsByCustomer.set(entry.customer_id, existing);
  }

  return interestsByCustomer;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const tab = normalizeCustomerListTab(params.tab);
  const [customers, services, waitlistView, insights] = await Promise.all([
    loadCustomersWithConsent({ onlyDeleted: tab === "deleted" }),
    loadServices(),
    loadWaitlistView(),
    tab === "active" ? loadClientsInsightsData() : Promise.resolve(null)
  ]);
  const serviceInterestsByCustomer = buildServiceInterestsByCustomer(
    waitlistView.entries
  );
  const clientRows: ClientRow[] = customers.map((customer) => ({
    ...customer,
    serviceInterestNames: Array.from(
      serviceInterestsByCustomer.get(customer.id) ?? []
    ).sort((a, b) => a.localeCompare(b, "fr"))
  }));

  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <ClientsPageContent
        customers={clientRows}
        notices={{
          error: params.error,
          message: params.message,
          notice: params.notice,
          warning: params.warning
        }}
        services={services}
        tab={tab}
      />
      {tab === "active" && insights ? (
        <ClientsInsightsSection insights={insights} />
      ) : null}
    </div>
  );
}
