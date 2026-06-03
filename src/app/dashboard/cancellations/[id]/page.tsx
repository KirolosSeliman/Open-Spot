import { notFound } from "next/navigation";

import {
  DashboardPageHeader,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import {
  sendOpeningAlertsAction,
  simulateReplyAction,
  validateSimulatedOfferAction
} from "@/lib/dashboard/actions";
import { loadOpeningDetail } from "@/lib/dashboard/operations-data";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { generateOpeningSmsMessage } from "@/lib/sms/message-generator";
import {
  getOpeningAlertButtonLabel,
  getOpeningAlertModeCopy,
  getSmsRuntimeStatus
} from "@/lib/sms/runtime-status";

type CancellationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export default async function CancellationDetailPage({
  params
}: CancellationDetailPageProps) {
  const { id } = await params;
  const [{ opening, service, offers }, workspace] = await Promise.all([
    loadOpeningDetail(id),
    getActiveOrganizationWorkspace()
  ]);

  if (!opening) {
    notFound();
  }

  const organization =
    workspace.status === "ready" ? workspace.organization : null;
  const businessName = organization?.name ?? "Open Spot";
  const previewLanguage = organization?.defaultLanguage ?? "fr";
  const serviceName = service?.name ?? opening.title;
  const smsStatus = getSmsRuntimeStatus();
  const smsPreview = generateOpeningSmsMessage({
    businessName,
    serviceName,
    startsAt: opening.start_time,
    endsAt: opening.end_time,
    offerLabel: opening.offer_label,
    language: previewLanguage,
    includeOptOut: true
  });

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description={`Details reels du creneau. ${getOpeningAlertModeCopy(smsStatus)}`}
        title={opening.title}
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Appointment details">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-black">Start</dt>
              <dd className="mt-1 text-[var(--muted)]">
                {new Date(opening.start_time).toLocaleString("fr-CA")}
              </dd>
            </div>
            <div>
              <dt className="font-black">End</dt>
              <dd className="mt-1 text-[var(--muted)]">
                {new Date(opening.end_time).toLocaleString("fr-CA")}
              </dd>
            </div>
            <div>
              <dt className="font-black">Statut</dt>
              <dd className="mt-1">
                <StatusBadge>{opening.status}</StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="font-black">Offers prepared</dt>
              <dd className="mt-1 text-[var(--muted)]">{offers.length}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="SMS preview">
          <div className="grid gap-3">
            <p className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4 text-sm font-bold leading-6 text-[var(--ink)]">
              {smsPreview.body}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-black text-[var(--muted)]">
              <span>{smsPreview.characterCount} characters</span>
              <span>{smsPreview.estimatedSegments} segment(s)</span>
            </div>
            {smsPreview.warnings.length > 0 ? (
              <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-xs font-bold text-[#74510f]">
                Review suggested: {smsPreview.warnings.join(", ")}
              </p>
            ) : null}
            <p className="text-xs font-bold text-[var(--muted)]">
              {getOpeningAlertModeCopy(smsStatus)}
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="Prepared offers">
        {offers.length > 0 ? (
          <div className="grid gap-3">
            <form action={sendOpeningAlertsAction}>
              <input name="openingId" type="hidden" value={opening.id} />
              <button
                className="mb-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!smsStatus.canSendOpeningAlerts}
                type="submit"
              >
                {getOpeningAlertButtonLabel(smsStatus)}
              </button>
            </form>
            {offers.map((offer) => {
              const offerMessage = generateOpeningSmsMessage({
                businessName,
                serviceName,
                startsAt: opening.start_time,
                endsAt: opening.end_time,
                offerLabel: opening.offer_label,
                customerFirstName: getFirstName(offer.customerName),
                language: offer.customerLanguage,
                includeOptOut: true
              });

              return (
                <div
                  className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                  key={offer.id}
                >
                  <div>
                    <p className="font-black">{offer.customerName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {offer.customerPhone || offer.customer_id}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Status: {offer.status}
                  </p>
                  <p className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6 text-[var(--ink)]">
                    {offer.lastOutboundMessageBody ?? offerMessage.body}
                  </p>
                  <form
                    action={simulateReplyAction}
                    className="flex flex-wrap gap-2"
                  >
                    <input name="openingId" type="hidden" value={opening.id} />
                    <input name="offerId" type="hidden" value={offer.id} />
                    <input
                      className="min-h-10 flex-1 rounded-xl border border-[var(--line)] bg-white px-3 text-sm"
                      name="replyBody"
                      placeholder="Oui, disponible"
                    />
                    <button
                      className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black"
                      type="submit"
                    >
                      Simulate reply
                    </button>
                  </form>
                  {offer.status === "responded" ? (
                    <form action={validateSimulatedOfferAction}>
                      <input name="openingId" type="hidden" value={opening.id} />
                      <input name="offerId" type="hidden" value={offer.id} />
                      <input
                        name="recoveredValueCents"
                        type="hidden"
                        value={opening.normal_price_cents ?? 0}
                      />
                      <button
                        className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white"
                        type="submit"
                      >
                        Manually validate this respondent
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aucun client admissible n&apos;a encore ete prepare pour ce creneau.
          </p>
        )}
      </Panel>
    </div>
  );
}
