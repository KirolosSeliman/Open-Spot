import { DashboardPageHeader } from "@/components/dashboard/dashboard-ui";
import { NewCancellationFlow } from "@/components/dashboard/new-cancellation-flow";
import {
  dashboardBusiness,
  dashboardClients,
  dashboardServices
} from "@/lib/dashboard/mock-data";

export default function NewCancellationPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Créez une place disponible, choisissez les clients admissibles, générez le SMS et gardez la confirmation sous contrôle manuel."
        title="Nouvelle ouverture"
      />
      <NewCancellationFlow
        business={dashboardBusiness}
        clients={dashboardClients}
        services={dashboardServices}
      />
    </div>
  );
}
