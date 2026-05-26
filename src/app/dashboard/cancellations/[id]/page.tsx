import { notFound } from "next/navigation";

import {
  DashboardPageHeader,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import {
  dashboardReplies,
  findCancellation,
  findClient,
  findService,
  formatCurrency
} from "@/lib/dashboard/mock-data";

type CancellationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CancellationDetailPage({
  params
}: CancellationDetailPageProps) {
  const { id } = await params;
  const cancellation = findCancellation(id);

  if (!cancellation) {
    notFound();
  }

  const service = findService(cancellation.serviceId);
  const confirmed = findClient(cancellation.confirmedClientId);
  const replies = dashboardReplies.filter(
    (reply) => reply.cancellationId === cancellation.id
  );

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Détails complets du créneau, du SMS envoyé, des clients contactés, des réponses et de la décision manuelle."
        title={`${service?.name ?? "Annulation"} · ${cancellation.time}`}
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Appointment details">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-black">Date</dt>
              <dd className="mt-1 text-[var(--muted)]">{cancellation.date}</dd>
            </div>
            <div>
              <dt className="font-black">Time</dt>
              <dd className="mt-1 text-[var(--muted)]">{cancellation.time}</dd>
            </div>
            <div>
              <dt className="font-black">Durée</dt>
              <dd className="mt-1 text-[var(--muted)]">
                {cancellation.durationMinutes} min
              </dd>
            </div>
            <div>
              <dt className="font-black">Employé</dt>
              <dd className="mt-1 text-[var(--muted)]">
                {cancellation.employeeName}
              </dd>
            </div>
            <div>
              <dt className="font-black">Statut</dt>
              <dd className="mt-1">
                <StatusBadge>{cancellation.status}</StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="font-black">Valeur estimée</dt>
              <dd className="mt-1 text-[var(--muted)]">
                {formatCurrency(cancellation.estimatedValueCents)}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Message sent">
          <p className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4 text-sm leading-6">
            {cancellation.messageSent}
          </p>
          <p className="mt-3 text-sm font-bold text-[var(--primary-strong)]">
            La confirmation finale reste manuelle.
          </p>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Clients contacted">
          <div className="grid gap-3">
            {cancellation.recipients.map((recipient) => {
              const client = findClient(recipient.clientId);
              return (
                <div
                  className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                  key={recipient.clientId}
                >
                  <p className="font-black">{client?.name}</p>
                  <p className="text-sm text-[var(--muted)]">{client?.phone}</p>
                  <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                    {recipient.smsStatus} · consentement {recipient.consentStatus}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Replies received">
          <div className="grid gap-3">
            {replies.map((reply) => {
              const client = findClient(reply.clientId);
              return (
                <div
                  className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                  key={reply.id}
                >
                  <p className="font-black">{client?.name}</p>
                  <p className="mt-1 text-sm">“{reply.rawBody}”</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {new Date(reply.receivedAt).toLocaleString("fr-CA")}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Confirmed client">
          <div className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4">
            <p className="font-black">{confirmed?.name ?? "Aucun client"}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {confirmed
                ? "Confirmé par décision manuelle de l'équipe."
                : "Aucune confirmation n'a encore été faite."}
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Complete activity timeline">
        <div className="grid gap-3">
          {cancellation.activity.map((activity) => (
            <div
              className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
              key={activity.id}
            >
              <p className="font-black">{activity.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {activity.detail}
              </p>
              <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                {new Date(activity.at).toLocaleString("fr-CA")}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Internal notes">
        <p className="text-sm leading-6 text-[var(--muted)]">
          {cancellation.internalNotes}
        </p>
      </Panel>
    </div>
  );
}
