import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const dashboardActions = readFileSync(
  join(process.cwd(), "src/lib/dashboard/actions.ts"),
  "utf8"
);
const cancellationDetailPage = readFileSync(
  join(process.cwd(), "src/app/dashboard/cancellations/[id]/page.tsx"),
  "utf8"
);
const newCancellationPage = readFileSync(
  join(process.cwd(), "src/app/dashboard/new-cancellation/page.tsx"),
  "utf8"
);
const eligibleCustomersPanel = readFileSync(
  join(
    process.cwd(),
    "src/components/dashboard/new-cancellation/eligible-customers-panel.tsx"
  ),
  "utf8"
);
const newCancellationWorkspace = readFileSync(
  join(
    process.cwd(),
    "src/components/dashboard/new-cancellation/new-cancellation-workspace.tsx"
  ),
  "utf8"
);
const newCancellationFormCard = readFileSync(
  join(
    process.cwd(),
    "src/components/dashboard/new-cancellation/new-cancellation-form-card.tsx"
  ),
  "utf8"
);
const operationsData = readFileSync(
  join(process.cwd(), "src/lib/dashboard/operations-data.ts"),
  "utf8"
);
const settingsPage = readFileSync(
  join(process.cwd(), "src/app/dashboard/settings/page.tsx"),
  "utf8"
);

describe("smart SMS recipient dashboard flow", () => {
  it("prepares, persists, overrides, and revalidates recipient decisions before send", () => {
    expect(dashboardActions).toContain("prepareSmartRecipientDecisionsForOpening");
    expect(dashboardActions).toContain("updateOpeningRecipientDecisionAction");
    expect(dashboardActions).toContain("applyManualRecipientOverride");
    expect(dashboardActions).toContain("evaluateSmsRecipientEligibility");
    expect(dashboardActions).toContain(".from(\"alert_recipient_decisions\")");
    expect(dashboardActions).toContain('final_decision", "send"');
    expect(dashboardActions).toContain("manual_recipient_included");
    expect(dashboardActions).toContain("manual_recipient_excluded");
    expect(dashboardActions).toContain(
      "blocked for consent or compliance and cannot be included"
    );
    expect(dashboardActions).toContain("spot_filled");
    expect(dashboardActions).not.toContain("sendableOffers = offers.filter");
  });

  it("loads recipient decisions and renders manual review controls", () => {
    expect(operationsData).toContain("recipientDecisions");
    expect(operationsData).toContain("alert_recipient_decisions");
    expect(cancellationDetailPage).toContain("Mode intelligent SMS");
    expect(cancellationDetailPage).toContain("Clients selectionnes");
    expect(cancellationDetailPage).toContain("Clients proteges");
    expect(cancellationDetailPage).toContain("Clients bloques");
    expect(cancellationDetailPage).toContain("Inclure quand meme");
    expect(cancellationDetailPage).toContain("Exclure de cet envoi");
    expect(cancellationDetailPage).toContain("warning_required");
  });

  it("lets merchants inspect and exclude eligible clients before creating an opening", () => {
    expect(newCancellationPage).toContain("NewCancellationWorkspace");
    expect(newCancellationWorkspace).toContain("excludedCustomerIds");
    expect(newCancellationWorkspace).toContain("onToggleExcludedCustomer");
    expect(newCancellationFormCard).toContain('name="manualExcludedCustomerIds"');
    expect(eligibleCustomersPanel).toContain("<button");
    expect(eligibleCustomersPanel).toContain("selectedCount");
    expect(eligibleCustomersPanel).toContain("advanced protections");
    expect(eligibleCustomersPanel).toContain("Pourquoi admissible");
    expect(eligibleCustomersPanel).toContain("Retirer de cet envoi");
    expect(eligibleCustomersPanel).toContain("Remettre dans l'envoi");
    expect(dashboardActions).toContain("buildManualExcludedCustomerIds");
    expect(dashboardActions).toContain('manualOverride: "exclude"');
    expect(dashboardActions).toContain(
      "Manual exclude from opening creation review"
    );
  });

  it("hardens manual exclusion payloads and preserves created openings on later SMS failures", () => {
    expect(dashboardActions).toContain("MAX_MANUAL_RECIPIENT_EXCLUSIONS");
    expect(dashboardActions).toContain("uuidPattern");
    expect(dashboardActions).toContain("Invalid manual recipient exclusion.");
    expect(dashboardActions).toContain("Too many manual recipient exclusions.");
    expect(dashboardActions).toContain("createdOpeningId = openingId");
    expect(dashboardActions).toContain("redirectWithSendError");
    expect(dashboardActions).toContain("/dashboard/cancellations/${createdOpeningId}");
    expect(dashboardActions).toContain("console.warn");
  });

  it("guards Smart SMS surfaces when the persistence migration is missing", () => {
    expect(dashboardActions).toContain("checkSmartSmsPersistenceReadiness");
    expect(dashboardActions).toContain("smartSmsPersistence.blockingReasons.join");
    expect(operationsData).toContain("smartSmsPersistence");
    expect(operationsData).toContain("recipientDecisions: []");
    expect(operationsData).toContain("smartSmsWarning");
    expect(settingsPage).toContain("checkSmartSmsPersistenceReadiness");
    expect(settingsPage).toContain("smartSmsReadiness");
    expect(settingsPage).toContain(
      "Mode intelligent SMS indisponible : migration non appliquée."
    );
  });

  it("keeps sent or claimed recipient decisions immutable from manual overrides", () => {
    expect(dashboardActions).toContain(
      "sent_at, delivery_status, twilio_message_sid"
    );
    expect(dashboardActions).toContain("recipientDecisionClaimedStatuses");
    expect(dashboardActions).toContain("\"failed\"");
    expect(dashboardActions).toContain("Recipient decision was already sent or claimed.");
    expect(dashboardActions).not.toContain("delivery_status: null");
    expect(cancellationDetailPage).toContain("SMS failed. Retry is blocked");
  });

  it("does not recalculate claimed recipient decisions during preparation", () => {
    expect(dashboardActions).toContain(
      "customer_id, base_decision, final_decision, manual_override, override_reason, overridden_by, sent_at, delivery_status, twilio_message_sid"
    );
    expect(dashboardActions).toContain("isRecipientDecisionClaimed");
    expect(dashboardActions).toContain("preservedDecisionRows");
    expect(dashboardActions).toContain("unclaimedRows");
    expect(dashboardActions).toContain("existingClaimedDecisionByCustomer");
  });

  it("revalidates consent, STOP, phone, and archived state immediately before sending", () => {
    expect(dashboardActions).toContain(
      "customer_id, status, unsubscribed_at"
    );
    expect(dashboardActions).toContain("finalSendHardBlockReasonsByCustomerId");
    expect(dashboardActions).toContain("blocked_opted_out");
    expect(dashboardActions).toContain("blocked_no_consent");
    expect(dashboardActions).toContain("blocked_invalid_phone");
    expect(dashboardActions).toContain("blocked_archived_customer");
    expect(dashboardActions).toContain("markRecipientDecisionsLockedBeforeSend");
    expect(dashboardActions).toContain("status: \"invalid\"");
  });

  it("keeps opening offers synchronized with recipient decisions", () => {
    expect(dashboardActions).toContain("syncOpeningOffersWithRecipientDecisions");
    expect(dashboardActions).toContain("ensureOpeningOffersForSendDecisions");
    expect(dashboardActions).toContain("decision.final_decision === \"send\"");
    expect(dashboardActions).toContain("creatableSendCustomerIds");
    expect(dashboardActions).toContain("!isRecipientDecisionClaimed(decision)");
    expect(dashboardActions).toContain(".is(\"responded_at\", null)");
    expect(dashboardActions).toContain(".is(\"response_text\", null)");
    expect(dashboardActions).toContain("phantomOfferIds");
    expect(dashboardActions).toContain("status: \"invalid\"");
    expect(dashboardActions).toContain("offer.status !== \"responded\"");
    expect(dashboardActions).toContain("Only responded offers can be validated.");
  });

  it("lets owners and managers update validated Smart SMS settings", () => {
    expect(dashboardActions).toContain("updateSmartSmsSettingsAction");
    expect(dashboardActions).toContain("canManageOrganizationSettings");
    expect(dashboardActions).toContain("buildSmartSmsSettingsUpdateInput");
    expect(dashboardActions).toContain("max: 90");
    expect(dashboardActions).toContain("max: 120");
    expect(dashboardActions).toContain("min: 1");
    expect(dashboardActions).toContain(
      "Smart SMS limits must follow day <= 7-day <= 30-day."
    );
    expect(dashboardActions).toContain("allowed_send_start_time");
    expect(dashboardActions).toContain("allowed_send_end_time");
    expect(settingsPage).toContain("updateSmartSmsSettingsAction");
    expect(settingsPage).toContain("disabled={!smartSmsReadiness.ready");
    expect(settingsPage).toContain("max={20}");
    expect(settingsPage).toContain("max={50}");
    expect(settingsPage).toContain("max={200}");
    expect(dashboardActions).toContain(".upsert(");
    expect(dashboardActions).toContain("onConflict: \"organization_id\"");
    expect(dashboardActions).toContain(".select(\"organization_id\")");
    expect(dashboardActions).toContain("Smart SMS settings were not persisted.");
    expect(settingsPage).toContain("copy.common.save");
  });

  it("surfaces low-service-match and specific-client add controls in review", () => {
    expect(dashboardActions).toContain("serviceMatchScore");
    expect(dashboardActions).toContain("addManualRecipientToOpeningAction");
    expect(dashboardActions).toContain("confirmProtectedRecipient");
    expect(operationsData).toContain("manualRecipientCandidates");
    expect(cancellationDetailPage).toContain("addManualRecipientToOpeningAction");
    expect(cancellationDetailPage).toContain("Ajouter un client specifique");
    expect(cancellationDetailPage).toContain("confirmProtectedRecipient");
  });

  it("requires explicit UI and server confirmation before including protected recipients", () => {
    expect(cancellationDetailPage).toContain("protectedOverrideConfirmed");
    expect(cancellationDetailPage).toContain("required={decision.base_decision === \"protected\"");
    expect(dashboardActions).toContain("protectedOverrideConfirmed");
    expect(dashboardActions).toContain(
      "Protected recipient inclusion requires confirmation."
    );
    expect(cancellationDetailPage).toContain("confirmProtectedRecipients");
    expect(cancellationDetailPage).toContain("required={includedProtectedCount > 0}");
    expect(dashboardActions).toContain("confirmProtectedRecipients");
    expect(dashboardActions).toContain(
      "You included clients protected by Smart SMS mode. Confirm that you want to send this alert despite the unsubscribe risk."
    );
  });
});
