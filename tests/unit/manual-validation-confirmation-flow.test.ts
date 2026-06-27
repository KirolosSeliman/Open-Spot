import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const dashboardActions = readFileSync(
  join(process.cwd(), "src/lib/dashboard/actions.ts"),
  "utf8"
);
const openingConfirmationSms = readFileSync(
  join(process.cwd(), "src/lib/sms/opening-confirmation.ts"),
  "utf8"
);
const validateRoute = readFileSync(
  join(process.cwd(), "src/app/api/openings/[id]/validate/route.ts"),
  "utf8"
);
const cancellationDetailPage = readFileSync(
  join(process.cwd(), "src/app/dashboard/cancellations/[id]/page.tsx"),
  "utf8"
);
const responsesRowActions = readFileSync(
  join(process.cwd(), "src/components/responses/OpeningResponseRowActions.tsx"),
  "utf8"
);

describe("manual validation confirmation flow", () => {
  it("sends confirmation SMS after successful manual validation only", () => {
    expect(dashboardActions).toContain("validate_opening_offer");
    expect(dashboardActions).toContain("bookingRequestId");
    expect(dashboardActions).toContain("sendOpeningConfirmationSmsAfterValidation");
    expect(openingConfirmationSms).toContain("resolveOpeningConfirmationSmsBody");
    expect(openingConfirmationSms).toContain('message_type: "opening_confirmation"');
    expect(openingConfirmationSms).toContain('"record_opening_confirmation_audit"');
    expect(openingConfirmationSms).toContain("hasExistingConfirmationSms");
    expect(openingConfirmationSms).toContain("business_address");
  });

  it("sends confirmation SMS from the responses validate API route", () => {
    expect(validateRoute).toContain("sendOpeningConfirmationSmsAfterValidation");
    expect(validateRoute).toContain("canValidateBookings");
    expect(validateRoute).toContain("confirmationSmsWarning");
    expect(validateRoute).toContain("SMS de confirmation envoyé");
  });

  it("shows confirmation SMS feedback on the responses page", () => {
    expect(responsesRowActions).toContain("confirmationSmsWarning");
    expect(responsesRowActions).toContain("payload.notice");
  });

  it("keeps validation errors and confirmation SMS warnings separate", () => {
    expect(dashboardActions).toContain("redirectWithValidationError");
    expect(dashboardActions).toContain("redirectWithNoticeAndConfirmationSmsWarning");
    expect(openingConfirmationSms).toContain(
      "Client confirmé, mais le SMS de confirmation"
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
