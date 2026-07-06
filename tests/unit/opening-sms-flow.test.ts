import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const newCancellationPage = readFileSync(
  join(process.cwd(), "src/app/dashboard/new-cancellation/page.tsx"),
  "utf8"
);
const cancellationDetailPage = readFileSync(
  join(process.cwd(), "src/app/dashboard/cancellations/[id]/page.tsx"),
  "utf8"
);
const dashboardActions = readFileSync(
  join(process.cwd(), "src/lib/dashboard/actions.ts"),
  "utf8"
);
const operationsData = readFileSync(
  join(process.cwd(), "src/lib/dashboard/operations-data.ts"),
  "utf8"
);

describe("opening SMS flow", () => {
  it("removes expiration from the opening creation UI", () => {
    expect(newCancellationPage).not.toContain("Expiration");
    expect(newCancellationPage).not.toContain("expiresAt");
  });

  it("renders generated SMS previews on the opening detail page", () => {
    expect(cancellationDetailPage).toContain("generateOpeningSmsMessage");
    expect(cancellationDetailPage).toContain("smsPreview.body");
    expect(cancellationDetailPage).toContain("characterCount");
    expect(cancellationDetailPage).toContain("estimatedSegments");
    expect(cancellationDetailPage).not.toContain(
      "La generation et la simulation SMS arrivent"
    );
  });

  it("makes opening alerts use the organization SMS sender and generator", () => {
    expect(dashboardActions).toContain("resolveOpeningAlertSmsBody");
    expect(dashboardActions).toContain("sendOrganizationSms");
    expect(dashboardActions).toContain("sendResult.fromNumber");
    expect(dashboardActions).toContain("consent?.status === \"opted_in\"");
    expect(dashboardActions).toContain("!consent.unsubscribed_at");
    expect(dashboardActions).not.toContain("createSimulatorSmsProvider");
    expect(dashboardActions).not.toContain("SIMULATOR_SOURCE_NUMBER");
    expect(dashboardActions).not.toContain("last-minute appointment opened");
  });

  it("creates provider-aware outbound context during opening creation", () => {
    expect(dashboardActions).toContain("prepareSmartRecipientDecisionsForOpening");
    expect(dashboardActions).toContain("evaluateSmsRecipientEligibility");
    expect(dashboardActions).toContain(".from(\"alert_recipient_decisions\")");
    expect(dashboardActions).toContain("sendOpeningSmsAlerts");
    expect(dashboardActions).toContain(
      "Opening was created, but no SMS could be sent to selected recipients."
    );
    expect(dashboardActions).toContain(".from(\"sms_messages\")");
    expect(dashboardActions).toContain('direction: "outbound"');
  });

  it("keeps cancellation detail send controls production-safe", () => {
    expect(cancellationDetailPage).toContain("unsentSelectedRecipientCount > 0");
    expect(cancellationDetailPage).toContain("smsStatus.canSendOpeningAlerts");
    expect(cancellationDetailPage).toContain("Mode intelligent SMS");
    expect(cancellationDetailPage).toContain("Envoyer aux clients selectionnes");
    expect(cancellationDetailPage).toContain("deliveryHistoryWarning");
    expect(cancellationDetailPage).toContain(
      "The SMS alert has already been sent to eligible customers."
    );
    expect(cancellationDetailPage).toContain("SMS sending failed");
    expect(cancellationDetailPage).not.toContain("Simulate reply");
    expect(cancellationDetailPage).not.toContain("simulateReplyAction");
  });

  it("surfaces outbound SMS delivery diagnostics", () => {
    expect(operationsData).toContain("lastOutboundMessageStatus");
    expect(operationsData).toContain("provider_message_id");
    expect(operationsData).toContain("from_number");
    expect(operationsData).toContain("to_number");
    expect(cancellationDetailPage).toContain("SMS delivery status");
    expect(cancellationDetailPage).toContain("Sent to carrier. Delivery not confirmed yet.");
    expect(cancellationDetailPage).toContain("No delivery callback received yet.");
    expect(cancellationDetailPage).toContain("Twilio confirmed this SMS was delivered");
    expect(cancellationDetailPage).toContain("Twilio Message SID / Provider message ID");
    expect(cancellationDetailPage).toContain("Twilio reports this SMS was not delivered.");
    expect(operationsData).toContain("status_callback_received_at");
    expect(operationsData).toContain("delivered_at");
    expect(operationsData).toContain("failed_at");
    expect(operationsData).toContain("error_code");
    expect(operationsData).toContain("error_message");
    expect(operationsData).toContain("isSmsPersistenceSchemaError");
    expect(operationsData).toContain(
      "SMS delivery history is temporarily unavailable"
    );
  });

  it("blocks opening SMS sends when delivery persistence is not ready", () => {
    expect(newCancellationPage).toContain("data.smsPersistence.ready");
    expect(newCancellationPage).toContain("smsBlockingReasons");
    expect(dashboardActions).toContain("checkSmsDeliveryPersistenceReadiness");
    expect(dashboardActions).toContain("smsPersistence.blockingReasons.join");
    expect(dashboardActions).toContain("loadOrganizationSmsReadiness");
    expect(dashboardActions).toContain("organizationSmsReadiness.canSendSms");
  });

  it("records an audit log when an opening prepares an eligible audience", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260529230025_create_opening_with_offers_rpc.sql"
      ),
      "utf8"
    );
    const providerBroadcastAuditMigration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260603024500_extend_provider_opening_broadcast_audit_rpc.sql"
      ),
      "utf8"
    );

    expect(dashboardActions).toContain('"create_opening_with_offers"');
    expect(dashboardActions).toContain('"record_opening_broadcast_audit"');
    expect(dashboardActions).not.toContain('"record_simulator_broadcast_audit"');
    expect(dashboardActions).not.toContain("createSupabaseServiceClient");
    expect(migration).toContain("insert into public.audit_logs");
    expect(migration).toContain("'opening.created'");
    expect(migration).toContain("'eligible_recipient_count'");
    expect(migration).toContain("'prepared_offer_count'");
    expect(providerBroadcastAuditMigration).toContain(
      "private.record_opening_broadcast_audit"
    );
    expect(providerBroadcastAuditMigration).toContain(
      "'sms.opening_broadcast.created'"
    );
    expect(providerBroadcastAuditMigration).toContain("provider_name text");
    expect(providerBroadcastAuditMigration).toContain("failed_count integer");
    expect(providerBroadcastAuditMigration).toContain("failure_reasons text[]");
    expect(providerBroadcastAuditMigration).toContain("insert into public.audit_logs");
    expect(providerBroadcastAuditMigration).toContain("private.has_org_role");
  });
});
