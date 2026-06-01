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

  it("makes simulation reuse the generator without a real SMS provider", () => {
    expect(dashboardActions).toContain("generateOpeningSmsMessage");
    expect(dashboardActions).toContain("createSimulatorSmsProvider");
    expect(dashboardActions).toContain("provider.sendSms");
    expect(dashboardActions).toContain("SIMULATOR_SOURCE_NUMBER");
    expect(dashboardActions).toContain(
      'consentByCustomer.get(offer.customer_id) === "opted_in"'
    );
    expect(dashboardActions).not.toContain("last-minute appointment opened");
  });

  it("creates the simulator outbound context during opening creation", () => {
    expect(dashboardActions).toContain("countEligibleOpeningRecipients");
    expect(dashboardActions).toContain("filterEligibleOpeningRecipients");
    expect(dashboardActions).toContain("sendSimulatorOpeningAlerts");
    expect(dashboardActions).toContain(
      "No opted-in active waitlist recipients are eligible"
    );
    expect(dashboardActions).toContain(".from(\"sms_messages\")");
    expect(dashboardActions).toContain('direction: "outbound"');
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
    const broadcastAuditMigration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260531190000_record_simulator_broadcast_audit_rpc.sql"
      ),
      "utf8"
    );

    expect(dashboardActions).toContain('"create_opening_with_offers"');
    expect(dashboardActions).toContain('"record_simulator_broadcast_audit"');
    expect(dashboardActions).not.toContain("createSupabaseServiceClient");
    expect(migration).toContain("insert into public.audit_logs");
    expect(migration).toContain("'opening.created'");
    expect(migration).toContain("'eligible_recipient_count'");
    expect(migration).toContain("'prepared_offer_count'");
    expect(broadcastAuditMigration).toContain(
      "private.record_simulator_broadcast_audit"
    );
    expect(broadcastAuditMigration).toContain(
      "'sms.simulator_broadcast.created'"
    );
    expect(broadcastAuditMigration).toContain("insert into public.audit_logs");
    expect(broadcastAuditMigration).toContain("private.has_org_role");
  });
});
