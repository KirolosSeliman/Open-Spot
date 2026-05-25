import { describe, expect, it } from "vitest";

import { filterEligibleOpeningRecipients } from "@/lib/openings/eligibility";

describe("filterEligibleOpeningRecipients", () => {
  it("only includes opted-in active waitlist customers who have not received the opening", () => {
    const recipients = filterEligibleOpeningRecipients(
      [
        {
          customerId: "a",
          phoneE164: "+15145550199",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: "hair",
          alreadyOffered: false
        },
        {
          customerId: "b",
          phoneE164: "+15145550198",
          consentStatus: "needs_consent",
          waitlistStatus: "active",
          serviceId: "hair",
          alreadyOffered: false
        },
        {
          customerId: "c",
          phoneE164: "+15145550197",
          consentStatus: "opted_out",
          waitlistStatus: "active",
          serviceId: "hair",
          alreadyOffered: false
        },
        {
          customerId: "d",
          phoneE164: "+15145550196",
          consentStatus: "opted_in",
          waitlistStatus: "paused",
          serviceId: "hair",
          alreadyOffered: false
        },
        {
          customerId: "e",
          phoneE164: "+15145550195",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: "hair",
          alreadyOffered: true
        }
      ],
      "hair"
    );

    expect(recipients.map((recipient) => recipient.customerId)).toEqual(["a"]);
  });
});
