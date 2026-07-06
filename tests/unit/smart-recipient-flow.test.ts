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
const operationsData = readFileSync(
  join(process.cwd(), "src/lib/dashboard/operations-data.ts"),
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
});
