import { DashboardPageHeader, EmptyState, Panel } from "@/components/dashboard/dashboard-ui";
import { ResponsesQueue } from "@/components/dashboard/responses-queue";
import { dashboardClients, dashboardReplies } from "@/lib/dashboard/mock-data";

export default function ResponsesPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Les réponses sont triées par timestamp entrant exact. Le texte brut reçu par SMS reste affiché tel quel."
        title="Réponses"
      />
      <Panel
        description="Le premier oui n'est jamais confirmé automatiquement. L'équipe choisit manuellement."
        title="File de réponses"
      >
        {dashboardReplies.length > 0 ? (
          <ResponsesQueue clients={dashboardClients} replies={dashboardReplies} />
        ) : (
          <EmptyState
            description="Dès qu'un client répondra par SMS, sa réponse exacte apparaîtra ici dans l'ordre de réception."
            title="Vous n'avez pas encore reçu de réponses."
          />
        )}
      </Panel>
    </div>
  );
}
