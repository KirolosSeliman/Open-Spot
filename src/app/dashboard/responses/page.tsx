import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import { loadResponseQueue } from "@/lib/dashboard/operations-data";

export default async function ResponsesPage() {
  const responses = await loadResponseQueue();

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Les reponses reelles seront triees par timestamp entrant exact. Aucun premier oui ne sera confirme automatiquement."
        title="Reponses"
      />
      <Panel
        description="Le premier oui n'est jamais confirme automatiquement. L'equipe choisit manuellement."
        title="File de reponses"
      >
        {responses.length > 0 ? (
          <div className="grid gap-3">
            {responses.map((response) => (
              <article
                className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                key={response.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black">{response.customerName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {response.customerPhone}
                    </p>
                  </div>
                  <StatusBadge>{response.status}</StatusBadge>
                </div>
                <p className="mt-3 text-sm font-bold text-[var(--foreground)]">
                  {response.openingTitle}
                </p>
                {response.serviceName ? (
                  <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                    Service: {response.serviceName}
                  </p>
                ) : null}
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                  {response.openingStartTime
                    ? new Date(response.openingStartTime).toLocaleString("fr-CA")
                    : "Date inconnue"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[var(--muted)]">
                  <span className="rounded-full bg-white px-2 py-1">
                    Classification: {response.replyClassification}
                  </span>
                  {response.response_rank ? (
                    <span className="rounded-full bg-white px-2 py-1">
                      Rang #{response.response_rank}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-white px-2 py-1">
                    En attente de validation manuelle
                  </span>
                </div>
                {response.lastInboundBody ? (
                  <p className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6">
                    {response.lastInboundBody}
                  </p>
                ) : null}
                {response.lastInboundReceivedAt ? (
                  <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                    Recu:{" "}
                    {new Date(response.lastInboundReceivedAt).toLocaleString(
                      "fr-CA"
                    )}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Aucune reponse SMS reelle n'a encore ete recue pour cette organisation."
            title="Vous n'avez pas encore recu de reponses."
          />
        )}
      </Panel>
    </div>
  );
}
