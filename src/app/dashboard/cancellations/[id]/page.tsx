import { notFound } from "next/navigation";

import {
  DashboardPageHeader,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import {
  addManualRecipientToOpeningAction,
  sendOpeningAlertsAction,
  updateOpeningRecipientDecisionAction,
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
    return "Non configuré";
  }

  return provider ?? "Non envoyé";
}

function getSmsDeliveryLabel(status: string | null) {
  switch (status) {
    case "accepted":
      return "Accepté par Twilio";
    case "queued":
      return "En file d'attente chez Twilio";
    case "sending":
      return "Envoi en cours";
    case "sent":
      return "Envoyé à l'opérateur";
    case "delivered":
      return "Livré au client";
    case "undelivered":
      return "Non livré";
    case "failed":
      return "Échec";
    case "submitted_to_provider":
      return "Soumis à Twilio";
    case "simulated":
      return "Simulé";
    default:
      return status ?? "En attente";
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

function getRecipientDecisionLabel(
  decision: string,
  locale: "fr" | "en"
) {
  if (decision === "eligible") {
    return locale === "fr" ? "Eligible" : "Eligible";
  }

  if (decision === "protected") {
    return locale === "fr"
      ? "Protege par le Mode intelligent"
      : "Protected by Smart SMS mode";
  }

  return locale === "fr" ? "Bloque" : "Blocked";
}

function getFinalDecisionLabel(decision: string, locale: "fr" | "en") {
  if (decision === "send") {
    return locale === "fr" ? "Selectionne" : "Selected";
  }

  if (decision === "locked_blocked") {
    return locale === "fr" ? "Envoi impossible" : "Cannot send";
  }

  return locale === "fr" ? "Non selectionne" : "Not selected";
}

export default async function CancellationDetailPage({
  params,
  searchParams
}: CancellationDetailPageProps) {
  const { id } = await params;
  const { error, sendError, validationError, confirmationSmsWarning, notice } =
    await searchParams;
  const [
    {
      opening,
      service,
      offers,
      recipientDecisions,
      manualRecipientCandidates,
      deliveryHistoryWarning,
      smartSmsWarning,
      smartSmsPersistence
    },
    workspace,
    uiLocale
  ] = await Promise.all([
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
  const selectedRecipientCount = recipientDecisions.filter(
    (decision) => decision.final_decision === "send"
  ).length;
  const eligibleRecipientCount = recipientDecisions.filter(
    (decision) => decision.base_decision === "eligible"
  ).length;
  const protectedRecipientCount = recipientDecisions.filter(
    (decision) => decision.base_decision === "protected"
  ).length;
  const blockedRecipientCount = recipientDecisions.filter(
    (decision) => decision.base_decision === "locked_blocked"
  ).length;
  const includedProtectedCount = recipientDecisions.filter(
    (decision) =>
      decision.base_decision === "protected" &&
      decision.final_decision === "send" &&
      decision.warning_required
  ).length;
  const unsentSelectedRecipientCount = recipientDecisions.filter(
    (decision) => decision.final_decision === "send" && !decision.sent_at
  ).length;
  const allOffersSentOrBeyond =
    offers.length > 0 &&
    offers.every((offer) =>
      ["sent", "responded", "selected", "rejected"].includes(offer.status)
    );
  const smartSmsReady = smartSmsPersistence?.ready ?? false;
  const sendStatusMessage =
    smartSmsWarning
      ? smartSmsWarning
      :
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
            : selectedRecipientCount > 0
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
      {smartSmsWarning ? (
        <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
          {smartSmsWarning}
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title={uiLocale === "fr" ? "Détails du rendez-vous" : "Appointment details"}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-black">{uiLocale === "fr" ? "Début" : "Start"}</dt>
              <dd className="mt-1 text-[var(--muted)]">
                {new Date(opening.start_time).toLocaleString("fr-CA")}
              </dd>
            </div>
            <div>
              <dt className="font-black">{uiLocale === "fr" ? "Fin" : "End"}</dt>
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
              <dt className="font-black">{uiLocale === "fr" ? "Offres préparées" : "Offers prepared"}</dt>
              <dd className="mt-1 text-[var(--muted)]">{offers.length}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title={uiLocale === "fr" ? "Aperçu SMS" : "SMS preview"}>
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
                {uiLocale === "fr" ? "Relecture suggérée" : "Review suggested"}: {smsPreview.warnings.join(", ")}
              </p>
            ) : null}
            <p className="text-xs font-bold text-[var(--muted)]">
              {sendStatusMessage}
            </p>
          </div>
        </Panel>
      </div>
      <Panel
        description={
          uiLocale === "fr"
            ? "Protege vos clients contre les messages trop rapproches."
            : "Protects your clients from messages that are too frequent."
        }
        title="Mode intelligent SMS"
      >
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-[var(--muted)]">
                {uiLocale === "fr" ? "Clients selectionnes" : "Selected clients"}
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
                {selectedRecipientCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-[var(--muted)]">
                {uiLocale === "fr" ? "Clients eligibles" : "Eligible clients"}
              </p>
              <p className="mt-2 text-3xl font-black text-[var(--foreground)]">
                {eligibleRecipientCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[#f6d99d] bg-[#fff9eb] p-4">
              <p className="text-xs font-black uppercase text-[#74510f]">
                {uiLocale === "fr" ? "Clients proteges" : "Protected clients"}
              </p>
              <p className="mt-2 text-3xl font-black text-[#74510f]">
                {protectedRecipientCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[#f2b8b5] bg-[#fff7f6] p-4">
              <p className="text-xs font-black uppercase text-[#8a1f17]">
                {uiLocale === "fr" ? "Clients bloques" : "Blocked clients"}
              </p>
              <p className="mt-2 text-3xl font-black text-[#8a1f17]">
                {blockedRecipientCount}
              </p>
            </div>
          </div>
          {includedProtectedCount > 0 ? (
            <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
              {uiLocale === "fr"
                ? "Vous avez inclus des clients proteges par le Mode intelligent SMS. Confirmez que vous souhaitez leur envoyer cette alerte malgre le risque de desinscription."
                : "You included clients protected by Smart SMS mode. This can increase unsubscribe risk."}
            </p>
          ) : null}
          {unsentSelectedRecipientCount > 0 &&
          smartSmsReady &&
          smsStatus.canSendOpeningAlerts &&
          !allOffersSentOrBeyond ? (
            <form action={sendOpeningAlertsAction}>
              <input name="openingId" type="hidden" value={opening.id} />
              {includedProtectedCount > 0 ? (
                <label className="mb-3 flex max-w-2xl items-start gap-2 rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
                  <input
                    className="mt-1"
                    name="confirmProtectedRecipients"
                    required={includedProtectedCount > 0}
                    type="checkbox"
                    value="true"
                  />
                  <span>
                    {uiLocale === "fr"
                      ? "Je confirme l'envoi aux clients proteges inclus."
                      : "I confirm sending to the included protected clients."}
                  </span>
                </label>
              ) : null}
              <button
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
                type="submit"
              >
                {uiLocale === "fr"
                  ? `Envoyer aux clients selectionnes (${unsentSelectedRecipientCount})`
                  : `Send to selected clients (${unsentSelectedRecipientCount})`}
              </button>
            </form>
          ) : (
            <p className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm font-bold text-[var(--muted)]">
              {sendStatusMessage}
            </p>
          )}
          {recipientDecisions.length > 0 ? (
            <div className="grid gap-3">
              {recipientDecisions.map((decision) => {
                const isLocked = decision.base_decision === "locked_blocked";
                const hasProtectedOverrideWarning = decision.warning_required;
                const alreadySent = Boolean(decision.sent_at);
                const includeDisabled =
                  isLocked || alreadySent || decision.final_decision === "send";
                const excludeDisabled =
                  isLocked || alreadySent || decision.final_decision !== "send";

                return (
                  <div
                    className="grid gap-4 rounded-2xl border border-[var(--line)] bg-slate-50 p-4 lg:grid-cols-[1fr_auto]"
                    key={decision.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-[var(--foreground)]">
                          {decision.customerName}
                        </p>
                        <StatusBadge>
                          {getRecipientDecisionLabel(
                            decision.base_decision,
                            uiLocale
                          )}
                        </StatusBadge>
                        <span className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-black text-[var(--muted)]">
                          {getFinalDecisionLabel(
                            decision.final_decision,
                            uiLocale
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {decision.customerPhone || decision.customer_id}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                        {decision.reason_label}
                      </p>
                      {hasProtectedOverrideWarning ? (
                        <p className="mt-3 rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
                          {uiLocale === "fr"
                            ? "Ce client est protege par le Mode intelligent. L'envoyer quand meme peut augmenter le risque de desinscription."
                            : "This client is protected by Smart SMS mode. Sending anyway can increase unsubscribe risk."}
                        </p>
                      ) : null}
                      {isLocked ? (
                        <p className="mt-3 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
                          {uiLocale === "fr"
                            ? "Impossible d'envoyer : ce client est desinscrit, sans consentement valide ou bloque pour conformite."
                            : "Cannot send: this client has unsubscribed, lacks valid consent, or is blocked for compliance."}
                        </p>
                      ) : null}
                      {alreadySent ? (
                        <p className="mt-3 text-xs font-bold text-[var(--muted)]">
                          {uiLocale === "fr"
                            ? "SMS deja soumis pour ce client."
                            : "SMS already submitted for this client."}
                        </p>
                      ) : null}
                      {decision.delivery_status === "failed" ? (
                        <p className="mt-3 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
                          {uiLocale === "fr"
                            ? "Envoi SMS echoue. Reessayage bloque jusqu'a l'ajout d'une action de retry explicite."
                            : "SMS failed. Retry is blocked until an explicit retry action is added."}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                      <form action={updateOpeningRecipientDecisionAction}>
                        <input name="openingId" type="hidden" value={opening.id} />
                        <input name="decisionId" type="hidden" value={decision.id} />
                        <input name="manualOverride" type="hidden" value="auto" />
                        <button
                          className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--foreground)] transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={alreadySent || decision.manual_override === "auto"}
                          type="submit"
                        >
                          Auto
                        </button>
                      </form>
                      <form action={updateOpeningRecipientDecisionAction}>
                        <input name="openingId" type="hidden" value={opening.id} />
                        <input name="decisionId" type="hidden" value={decision.id} />
                        <input name="manualOverride" type="hidden" value="include" />
                        <input
                          name="overrideReason"
                          type="hidden"
                          value="Manual include from Smart SMS review"
                        />
                        {decision.base_decision === "protected" ? (
                          <label className="mb-2 flex max-w-[18rem] items-start gap-2 rounded-lg border border-[#f3c76b] bg-[#fff8df] p-3 text-[11px] font-bold leading-relaxed text-[#8a5a00]">
                            <input
                              className="mt-0.5"
                              name="protectedOverrideConfirmed"
                              required={decision.base_decision === "protected"}
                              type="checkbox"
                              value="true"
                            />
                            <span>
                              {uiLocale === "fr"
                                ? "Je confirme l'inclusion de ce client protege pour cet envoi."
                                : "I confirm including this protected client for this send."}
                            </span>
                          </label>
                        ) : null}
                        <button
                          className="rounded-full border border-[var(--primary)] bg-white px-3 py-2 text-xs font-black text-[var(--primary)] transition hover:bg-[var(--primary-soft)] disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:text-[var(--muted)] disabled:opacity-50"
                          disabled={includeDisabled}
                          type="submit"
                        >
                          {decision.base_decision === "protected"
                            ? uiLocale === "fr"
                              ? "Inclure quand meme"
                              : "Include anyway"
                            : uiLocale === "fr"
                              ? "Inclure"
                              : "Include"}
                        </button>
                      </form>
                      <form action={updateOpeningRecipientDecisionAction}>
                        <input name="openingId" type="hidden" value={opening.id} />
                        <input name="decisionId" type="hidden" value={decision.id} />
                        <input name="manualOverride" type="hidden" value="exclude" />
                        <input
                          name="overrideReason"
                          type="hidden"
                          value="Manual exclude from Smart SMS review"
                        />
                        <button
                          className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--foreground)] transition hover:border-[#8a1f17] hover:text-[#8a1f17] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={excludeDisabled}
                          type="submit"
                        >
                          {uiLocale === "fr"
                            ? "Exclure de cet envoi"
                            : "Exclude from this send"}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm font-bold text-[var(--muted)]">
              {uiLocale === "fr"
                ? "Aucun destinataire SMS n'a encore ete analyse pour ce creneau."
                : "No SMS recipients have been analyzed for this opening yet."}
            </p>
          )}
          {smartSmsReady ? (
            <form
              action={addManualRecipientToOpeningAction}
              className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-4"
            >
              <input name="openingId" type="hidden" value={opening.id} />
              <label className="grid gap-2 text-sm font-bold text-[var(--foreground)]">
                <span>
                  {uiLocale === "fr"
                    ? "Ajouter un client specifique"
                    : "Add a specific client"}
                </span>
                <select
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                  name="customerId"
                  required
                >
                  <option value="">
                    {uiLocale === "fr" ? "Choisir un client" : "Choose a client"}
                  </option>
                  {manualRecipientCandidates.map((customer) => (
                    <option
                      disabled={customer.alreadyInAlert}
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.fullName} - {customer.phoneE164}
                      {customer.alreadyInAlert
                        ? uiLocale === "fr"
                          ? " - deja ajoute"
                          : " - already added"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-start gap-2 rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-xs font-bold text-[#74510f]">
                <input
                  className="mt-0.5"
                  name="confirmProtectedRecipient"
                  type="checkbox"
                  value="true"
                />
                <span>
                  {uiLocale === "fr"
                    ? "Je confirme si ce client est protege par le Mode intelligent SMS."
                    : "I confirm if this client is protected by Smart SMS mode."}
                </span>
              </label>
              <button
                className="w-fit rounded-full border border-[var(--primary)] bg-white px-3 py-2 text-xs font-black text-[var(--primary)] transition hover:bg-[var(--primary-soft)]"
                type="submit"
              >
                {uiLocale === "fr" ? "Ajouter a cette alerte" : "Add to this alert"}
              </button>
            </form>
          ) : null}
        </div>
      </Panel>
      <Panel title={uiLocale === "fr" ? "Offres préparées" : "Prepared offers"}>
        {offers.length > 0 ? (
          <div className="grid gap-3">
            <p className="mb-2 rounded-xl border border-[var(--line)] bg-white p-3 text-sm font-bold text-[var(--muted)]">
              {sendStatusMessage}
            </p>
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
                    {uiLocale === "fr" ? "État de l'offre" : "Offer state"}:{" "}
                    {formatOpeningOfferStatus(offer.status, previewLanguage)}.
                    {uiLocale === "fr"
                      ? "Cela signifie que l'alerte a été soumise ou envoyée pour cette offre, pas que le SMS a été livré."
                      : "This means the alert was submitted/sent for this offer, not that the SMS was delivered."}
                  </p>
                  <dl className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3 text-xs font-bold text-[var(--muted)] sm:grid-cols-2">
                    <div>
                      <dt>{uiLocale === "fr" ? "Fournisseur SMS" : "SMS provider"}</dt>
                      <dd>{formatSmsProvider(offer.lastOutboundProvider)}</dd>
                    </div>
                    <div>
                      <dt>{uiLocale === "fr" ? "Statut de livraison SMS" : "SMS delivery status"}</dt>
                      <dd>{deliveryLabel}</dd>
                    </div>
                    <div>
                      <dt>{uiLocale === "fr" ? "Heure de soumission" : "Submitted time"}</dt>
                      <dd>
                        {offer.lastOutboundSentAt
                          ? new Date(offer.lastOutboundSentAt).toLocaleString("fr-CA")
                          : uiLocale === "fr" ? "Non envoyé" : "Not sent"}
                      </dd>
                    </div>
                    <div>
                      <dt>To</dt>
                      <dd>{offer.lastOutboundToNumber ?? offer.customerPhone}</dd>
                    </div>
                    <div>
                      <dt>{uiLocale === "fr" ? "De" : "From"}</dt>
                      <dd>{offer.lastOutboundFromNumber ?? (uiLocale === "fr" ? "Non envoyé" : "Not sent")}</dd>
                    </div>
                    <div>
                      <dt>{uiLocale === "fr" ? "Dernier rappel de statut" : "Last status callback"}</dt>
                      <dd>
                        {offer.lastOutboundStatusCallbackReceivedAt
                          ? new Date(
                              offer.lastOutboundStatusCallbackReceivedAt
                            ).toLocaleString("fr-CA")
                          : uiLocale === "fr" ? "Aucun rappel reçu" : "No callback received"}
                      </dd>
                    </div>
                    <div>
                      <dt>{uiLocale === "fr" ? "Heure de livraison" : "Delivered time"}</dt>
                      <dd>
                        {offer.lastOutboundDeliveredAt
                          ? new Date(
                              offer.lastOutboundDeliveredAt
                            ).toLocaleString("fr-CA")
                          : uiLocale === "fr" ? "Pas encore livré" : "Not delivered yet"}
                      </dd>
                    </div>
                    <div>
                      <dt>{uiLocale === "fr" ? "Heure d'échec ou de non-livraison" : "Failed/undelivered time"}</dt>
                      <dd>
                        {offer.lastOutboundFailedAt
                          ? new Date(offer.lastOutboundFailedAt).toLocaleString(
                              "fr-CA"
                            )
                          : uiLocale === "fr" ? "Aucun échec signalé" : "No failure reported"}
                      </dd>
                    </div>
                    {offer.lastOutboundProviderMessageId ? (
                      <div className="sm:col-span-2">
                      <dt>{uiLocale === "fr" ? "SID Twilio / ID du message fournisseur" : "Twilio Message SID / Provider message ID"}</dt>
                        <dd className="break-all">
                          {offer.lastOutboundProviderMessageId}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {offer.lastOutboundMessageStatus === "failed" ||
                  offer.lastOutboundMessageStatus === "undelivered" ? (
                    <p className="rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
                      {uiLocale === "fr" ? "Twilio indique que ce SMS n'a pas été livré." : "Twilio reports this SMS was not delivered."}
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
                      {uiLocale === "fr" ? "Envoyé à l'opérateur. Livraison pas encore confirmée." : "Sent to carrier. Delivery not confirmed yet."}
                    </p>
                  ) : null}
                  {missingDeliveryCallback ? (
                    <p className="rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
                      {uiLocale === "fr"
                        ? "Aucun rappel de livraison reçu pour le moment. Vérifiez la configuration du rappel de statut Twilio."
                        : "No delivery callback received yet. Verify Twilio status callback configuration."}
                    </p>
                  ) : null}
                  {offer.lastOutboundMessageStatus === "delivered" ? (
                    <p className="rounded-xl border border-[#b8e0c0] bg-[#f1fff4] p-3 text-sm font-bold text-[#245d30]">
                      {uiLocale === "fr" ? "Twilio confirme que ce SMS a été livré au client." : "Twilio confirmed this SMS was delivered to the client."}
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
                        {uiLocale === "fr" ? "Valider manuellement ce répondant" : "Manually validate this respondent"}
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Aucun client admissible n&apos;a encore été préparé pour ce créneau.
          </p>
        )}
      </Panel>
    </div>
  );
}
