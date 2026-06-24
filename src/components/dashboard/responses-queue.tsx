"use client";

import { useMemo, useState } from "react";

import {
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import type { DashboardClient, ReplyStatus, SmsReply } from "@/lib/dashboard/types";

const intentLabels = {
  positive: "Semble intéressé",
  negative: "Refus ou indisponible",
  question: "Question",
  unknown: "À vérifier"
};

export function ResponsesQueue({
  clients,
  replies
}: {
  clients: DashboardClient[];
  replies: SmsReply[];
}) {
  const orderedReplies = useMemo(
    () =>
      [...replies].sort(
        (a, b) =>
          new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
      ),
    [replies]
  );
  const [statuses, setStatuses] = useState<Record<string, ReplyStatus>>(() =>
    Object.fromEntries(orderedReplies.map((reply) => [reply.id, reply.status]))
  );
  const [confirming, setConfirming] = useState<SmsReply | null>(null);

  function getClient(clientId: string) {
    return clients.find((client) => client.id === clientId);
  }

  function confirmClient() {
    if (!confirming) {
      return;
    }

    setStatuses((current) => ({
      ...current,
      [confirming.id]: "Confirmé"
    }));
    setConfirming(null);
  }

  return (
    <>
      <TableShell>
        <thead>
          <tr>
            <th className={tableHeadClass}>Ordre</th>
            <th className={tableHeadClass}>Client</th>
            <th className={tableHeadClass}>Phone</th>
            <th className={tableHeadClass}>Réponse exacte</th>
            <th className={tableHeadClass}>Reçu à</th>
            <th className={tableHeadClass}>Interprétation</th>
            <th className={tableHeadClass}>Statut</th>
            <th className={tableHeadClass}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)] bg-white">
          {orderedReplies.map((reply, index) => {
            const client = getClient(reply.clientId);
            return (
              <tr key={reply.id}>
                <td className={tableCellClass}>{index + 1}</td>
                <td className={tableCellClass}>
                  <div className="font-bold">{client?.name ?? "Client"}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {client?.preferredLanguage.toUpperCase()}
                  </div>
                </td>
                <td className={tableCellClass}>{reply.phone}</td>
                <td className={`${tableCellClass} font-semibold`}>
                  {reply.rawBody}
                </td>
                <td className={tableCellClass}>
                  {new Date(reply.receivedAt).toLocaleString("fr-CA", {
                    dateStyle: "short",
                    timeStyle: "short"
                  })}
                </td>
                <td className={tableCellClass}>
                  {intentLabels[reply.normalizedIntent]}
                </td>
                <td className={tableCellClass}>
                  <StatusBadge>{statuses[reply.id]}</StatusBadge>
                </td>
                <td className={tableCellClass}>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-h-9 rounded-full px-3 text-xs"
                      onClick={() => setConfirming(reply)}
                      type="button"
                    >
                      Confirmer ce client
                    </Button>
                    <Button
                      className="min-h-9 rounded-full px-3 text-xs"
                      onClick={() =>
                        setStatuses((current) => ({
                          ...current,
                          [reply.id]: "Non retenu"
                        }))
                      }
                      type="button"
                      variant="secondary"
                    >
                      Non retenu
                    </Button>
                    <Button
                      className="min-h-9 rounded-full px-3 text-xs"
                      type="button"
                      variant="ghost"
                    >
                      Répondre
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(20,38,46,0.24)] p-4">
          <div className="max-w-lg rounded-3xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black">
              Confirmer ce client pour ce rendez-vous ?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Votre équipe garde la décision finale pour chaque client.
            </p>
            <p className="mt-4 rounded-2xl bg-[#f6f7f2] p-4 text-sm font-semibold">
              Réponse exacte : “{confirming.rawBody}”
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={confirmClient} type="button">
                Confirmer manuellement
              </Button>
              <Button
                onClick={() => setConfirming(null)}
                type="button"
                variant="secondary"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
