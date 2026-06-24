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
import {
  formatOpeningOfferStatus,
  formatOpeningStatus
} from "@/lib/dashboard/status-labels";
import { getRequestLocale } from "@/lib/i18n/locale";
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
    sendError?: string;
    validationError?: string;
    confirmationSmsWarning?: string;
    notice?: string;
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

function getSmsDeliveryLabel(status: string | null) {
  switch (status) {
    case "accepted":
      return "Accepted by Twilio";
    case "queued":
      return "Queued by Twilio";
    case "sending":
      return "Sending";
    case "sent":
      return "Sent to carrier";
    case "delivered":
      return "Delivered to client";
    case "undelivered":
      return "Undelivered";
    case "failed":
      return "Failed";
    case "submitted_to_provider":
      return "Submitted to Twilio";
    case "simulated":
      return "Simulated";
    default:
      return status ?? "Pending";
  }
}

function hasMissingDeliveryCallback({
  status,
  createdAt,
  callbackReceivedAt
}: {
  status: string | null;
  createdAt: string | null;
  callbackReceivedAt: string | null;
}) {
  if (!status || callbackReceivedAt) {
    return false;
  }

  if (!["accepted", "queued", "sending", "sent", "submitted_to_provider"].includes(status)) {
    return false;
  }

  const createdTime = createdAt ? new Date(createdAt).getTime() : Number.NaN;

  return Number.isFinite(createdTime) && Date.now() - createdTime > 2 * 60 * 1000;
}

export default async function CancellationDetailPage({
  params,
  searchParams
}: CancellationDetailPageProps) {
  const { id } = await params;
  const { error, sendError, validationError, confirmationSmsWarning, notice } =
    await searchParams;
  const [{ opening, service, offers, deliveryHistoryWarning }, workspace, uiLocale] =
    await Promise.all([
      loadOpeningDetail(id),
      getActiveOrganizationWorkspace(),
      getRequestLocale()
    ]);

  if (!opening) {
    notFound();
  }

  const organization =
    workspace.status === "ready" ? workspace.organization : null;
  const businessName = organization?.name ?? "Open Spot";
  const previewLanguage = organization?.defaultLanguage ?? "fr";
  const actionFailedLabel =
    previewLanguage === "en" ? "Action failed" : "L'action a échoué";
  const sendFailedLabel =
    previewLanguage === "en" ? "SMS sending failed" : "L'envoi SMS a échoué";
  const validationFailedLabel =
    previewLanguage === "en"
      ? "Manual validation failed"
      : "La validation manuelle a échoué";
  const confirmationSmsWarningLabel =
    previewLanguage === "en"
      ? "Confirmation SMS warning"
      : "Avertissement SMS de confirmation";
  const serviceName = service?.name ?? opening.title;
  const recoveredValueCents =
    opening.normal_price_cents ?? service?.normal_price_cents ?? 0;
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
      ? uiLocale === "fr"
        ? "Un client a été sélectionné manuellement."
        : "A respondent has been manually selected."
      : rejectedOffers.length > 0 && pendingOffers.length === 0
        ? uiLocale === "fr"
          ? "La validation est terminée pour ce créneau."
          : "Validation is complete for this opening."
        : respondedOffers.length > 0
          ? uiLocale === "fr"
            ? "En attente des réponses clients et de la validation marchande."
            : "Waiting for customer replies and merchant validation."
          : allOffersSentOrBeyond
            ? uiLocale === "fr"
              ? "L’alerte SMS a déjà été envoyée aux clients admissibles."
              : "The SMS alert has already been sent to eligible customers."
            : pendingOffers.length > 0
              ? uiLocale === "fr"
                ? "Des clients admissibles sont prêts pour l’envoi SMS."
                : "Eligible customers are ready for SMS sending."
              : uiLocale === "fr"
                ? "Aucune offre SMS admissible en attente n’est disponible."
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
        description={
          uiLocale === "fr"
            ? `Détails réels du créneau. ${getOpeningAlertModeCopy(smsStatus, uiLocale)} Validation manuelle obligatoire.`
            : `Real opening details. ${getOpeningAlertModeCopy(smsStatus, uiLocale)} Manual validation is required.`
        }
        title={opening.title}
      />
      {sendError ? (
        <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          {sendFailedLabel}: {sendError}
        </p>
      ) : null}
      {validationError ? (
        <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          {validationFailedLabel}: {validationError}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          {actionFailedLabel}: {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-[#b8e0c0] bg-[#f1fff4] p-3 text-sm font-bold text-[#245d30]">
          {notice}
        </p>
      ) : null}
      {confirmationSmsWarning ? (
        <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
          {confirmationSmsWarningLabel}: {confirmationSmsWarning}
        </p>
      ) : null}
      {smsStatus.deliveryDiagnostics.length > 0 ? (
        <div className="grid gap-2 rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
          {smsStatus.deliveryDiagnostics.map((diagnostic) => (
            <p key={diagnostic}>{diagnostic}</p>
          ))}
        </div>
      ) : null}
      {deliveryHistoryWarning ? (
        <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
          {deliveryHistoryWarning}
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
                <StatusBadge>
                  {formatOpeningStatus(opening.status, previewLanguage)}
                </StatusBadge>
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
            <p className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4 text-sm font-bold leading-6 text-[var(--foreground)]">
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
                  className="mb-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
                  type="submit"
                >
                  {getOpeningAlertButtonLabel(smsStatus, uiLocale)}
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
              const deliveryLabel = getSmsDeliveryLabel(
                offer.lastOutboundMessageStatus
              );
              const missingDeliveryCallback = hasMissingDeliveryCallback({
                status: offer.lastOutboundMessageStatus,
                createdAt: offer.lastOutboundSentAt,
                callbackReceivedAt: offer.lastOutboundStatusCallbackReceivedAt
              });

              return (
                <div
                  className="grid gap-4 rounded-2xl border border-[var(--line)] bg-slate-50 p-4"
                  key={offer.id}
                >
                  <div>
                    <p className="font-black">{offer.customerName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {offer.customerPhone || offer.customer_id}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Offer state:{" "}
                    {formatOpeningOfferStatus(offer.status, previewLanguage)}.
                    This means the alert was submitted/sent for this offer, not
                    that the SMS was delivered.
                  </p>
                  <dl className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3 text-xs font-bold text-[var(--muted)] sm:grid-cols-2">
                    <div>
                      <dt>SMS provider</dt>
                      <dd>{formatSmsProvider(offer.lastOutboundProvider)}</dd>
                    </div>
                    <div>
                      <dt>SMS delivery status</dt>
                      <dd>{deliveryLabel}</dd>
                    </div>
                    <div>
                      <dt>Submitted time</dt>
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
                    <div>
                      <dt>Last status callback</dt>
                      <dd>
                        {offer.lastOutboundStatusCallbackReceivedAt
                          ? new Date(
                              offer.lastOutboundStatusCallbackReceivedAt
                            ).toLocaleString("fr-CA")
                          : "No callback received"}
                      </dd>
                    </div>
                    <div>
                      <dt>Delivered time</dt>
                      <dd>
                        {offer.lastOutboundDeliveredAt
                          ? new Date(
                              offer.lastOutboundDeliveredAt
                            ).toLocaleString("fr-CA")
                          : "Not delivered yet"}
                      </dd>
                    </div>
                    <div>
                      <dt>Failed/undelivered time</dt>
                      <dd>
                        {offer.lastOutboundFailedAt
                          ? new Date(offer.lastOutboundFailedAt).toLocaleString(
                              "fr-CA"
                            )
                          : "No failure reported"}
                      </dd>
                    </div>
                    {offer.lastOutboundProviderMessageId ? (
                      <div className="sm:col-span-2">
                        <dt>Twilio Message SID / Provider message ID</dt>
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
                      {offer.lastOutboundErrorCode
                        ? ` Error ${offer.lastOutboundErrorCode}.`
                        : ""}
                      {offer.lastOutboundErrorMessage
                        ? ` ${offer.lastOutboundErrorMessage}`
                        : ""}
                    </p>
                  ) : null}
                  {offer.lastOutboundMessageStatus === "sent" ? (
                    <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
                      Sent to carrier. Delivery not confirmed yet.
                    </p>
                  ) : null}
                  {missingDeliveryCallback ? (
                    <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
                      No delivery callback received yet. Verify Twilio status
                      callback configuration.
                    </p>
                  ) : null}
                  {offer.lastOutboundMessageStatus === "delivered" ? (
                    <p className="rounded-xl border border-[#b8e0c0] bg-[#f1fff4] p-3 text-sm font-bold text-[#245d30]">
                      Twilio confirmed this SMS was delivered to the client.
                    </p>
                  ) : null}
                  <p className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6 text-[var(--foreground)]">
                    {offer.lastOutboundMessageBody ?? offerMessage.body}
                  </p>
                  {offer.status === "responded" && opening.status !== "filled" ? (
                    <form action={validateOpeningOfferAction}>
                      <input name="openingId" type="hidden" value={opening.id} />
                      <input name="offerId" type="hidden" value={offer.id} />
                      <input
                        name="recoveredValueCents"
                        type="hidden"
                        value={recoveredValueCents}
                      />
                      <button
                        className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
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
