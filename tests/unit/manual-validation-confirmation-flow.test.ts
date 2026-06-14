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

describe("manual validation confirmation flow", () => {
  it("sends confirmation SMS after successful manual validation only", () => {
    expect(dashboardActions).toContain("validate_opening_offer");
    expect(dashboardActions).toContain("bookingRequestId");
    expect(dashboardActions).toContain(
      "sendOpeningConfirmationSmsAfterValidation"
    );
    expect(dashboardActions).toContain("generateOpeningConfirmationSmsMessage");
    expect(dashboardActions).toContain('message_type: "opening_confirmation"');
    expect(dashboardActions).toContain(
      '"record_opening_confirmation_audit"'
    );
  });

  it("keeps validation errors and confirmation SMS warnings separate", () => {
    expect(dashboardActions).toContain("redirectWithValidationError");
    expect(dashboardActions).toContain(
      "redirectWithNoticeAndConfirmationSmsWarning"
    );
    expect(dashboardActions).toContain(
      "Opening was validated, but confirmation SMS"
    );
    expect(cancellationDetailPage).toContain("confirmationSmsWarning");
    expect(cancellationDetailPage).toContain("Confirmation SMS warning");
  });

  it("revalidates merchant and admin surfaces after manual validation", () => {
    for (const path of [
      '"/dashboard"',
      '"/dashboard/cancellations"',
      '`/dashboard/cancellations/${openingId}`',
      '"/dashboard/responses"',
      '"/dashboard/clients"',
      '"/dashboard/waitlist"',
      '"/dashboard/analytics"',
      '"/dashboard/messages"',
      '"/admin"',
      '"/platform-admin"'
    ]) {
      expect(dashboardActions).toContain(`revalidatePath(${path}`);
    }
  });
});
