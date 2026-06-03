import { notFound } from "next/navigation";

import {
  DashboardPageHeader,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import {
  sendOpeningAlertsAction,
  validateOpeningOfferAction
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
  searchParams: Promise<{
    error?: string;
  }>;
};

function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

function formatSmsProvider(provider: string | null) {
  const deployedEnvironment =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "production";

  if (provider === "simulator" && deployedEnvironment) {
    return "Not configured";
  }

  return provider ?? "Not sent";
}

export default async function CancellationDetailPage({
  params,
  searchParams
}: CancellationDetailPageProps) {
  const { id } = await params;
  const { error } = await searchParams;
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
  const pendingOffers = offers.filter((offer) => offer.status === "pending");
  const respondedOffers = offers.filter((offer) => offer.status === "responded");
  const selectedOffers = offers.filter((offer) => offer.status === "selected");
  const rejectedOffers = offers.filter((offer) => offer.status === "rejected");
  const allOffersSentOrBeyond =
    offers.length > 0 &&
    offers.every((offer) =>
      ["sent", "responded", "selected", "rejected"].includes(offer.status)
    );
  const sendStatusMessage =
    selectedOffers.length > 0
      ? "A respondent has been manually selected."
      : rejectedOffers.length > 0 && pendingOffers.length === 0
        ? "Validation is complete for this opening."
        : respondedOffers.length > 0
          ? "Waiting for customer replies and merchant validation."
          : allOffersSentOrBeyond
            ? "SMS alert already sent to eligible clients."
            : pendingOffers.length > 0
              ? "Pending eligible clients are ready for SMS sending."
              : "No eligible pending SMS offers are available.";
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
      {error ? (
        <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          SMS sending failed: {error}
        </p>
      ) : null}
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
              {sendStatusMessage}
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="Prepared offers">
        {offers.length > 0 ? (
          <div className="grid gap-3">
            {pendingOffers.length > 0 && smsStatus.canSendOpeningAlerts ? (
              <form action={sendOpeningAlertsAction}>
                <input name="openingId" type="hidden" value={opening.id} />
                <button
                  className="mb-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white"
                  type="submit"
                >
                  {getOpeningAlertButtonLabel(smsStatus)}
                </button>
              </form>
            ) : (
              <p className="mb-2 rounded-xl border border-[var(--line)] bg-white p-3 text-sm font-bold text-[var(--muted)]">
                {sendStatusMessage}
              </p>
            )}
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
                    Offer state: {offer.status}
                  </p>
                  <dl className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3 text-xs font-bold text-[var(--muted)] sm:grid-cols-2">
                    <div>
                      <dt>SMS provider</dt>
                      <dd>{formatSmsProvider(offer.lastOutboundProvider)}</dd>
                    </div>
                    <div>
                      <dt>SMS delivery status</dt>
                      <dd>{offer.lastOutboundMessageStatus ?? "Pending"}</dd>
                    </div>
                    <div>
                      <dt>Sent time</dt>
                      <dd>
                        {offer.lastOutboundSentAt
                          ? new Date(offer.lastOutboundSentAt).toLocaleString("fr-CA")
                          : "Not sent"}
                      </dd>
                    </div>
                    <div>
                      <dt>To</dt>
                      <dd>{offer.lastOutboundToNumber ?? offer.customerPhone}</dd>
                    </div>
                    <div>
                      <dt>From</dt>
                      <dd>{offer.lastOutboundFromNumber ?? "Not sent"}</dd>
                    </div>
                    {offer.lastOutboundProviderMessageId ? (
                      <div className="sm:col-span-2">
                        <dt>Provider message ID</dt>
                        <dd className="break-all">
                          {offer.lastOutboundProviderMessageId}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {offer.lastOutboundMessageStatus === "failed" ||
                  offer.lastOutboundMessageStatus === "undelivered" ? (
                    <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
                      Twilio reports this SMS was not delivered.
                    </p>
                  ) : null}
                  <p className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6 text-[var(--ink)]">
                    {offer.lastOutboundMessageBody ?? offerMessage.body}
                  </p>
                  {offer.status === "responded" ? (
                    <form action={validateOpeningOfferAction}>
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
