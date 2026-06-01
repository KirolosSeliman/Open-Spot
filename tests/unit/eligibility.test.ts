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
          serviceInterestIds: ["hair"],
          alreadyOffered: false
        },
        {
          customerId: "b",
          phoneE164: "+15145550198",
          consentStatus: "needs_consent",
          waitlistStatus: "active",
          serviceId: "hair",
          serviceInterestIds: ["hair"],
          alreadyOffered: false
        },
        {
          customerId: "c",
          phoneE164: "+15145550197",
          consentStatus: "opted_out",
          waitlistStatus: "active",
          serviceId: "hair",
          serviceInterestIds: ["hair"],
          alreadyOffered: false
        },
        {
          customerId: "d",
          phoneE164: "+15145550196",
          consentStatus: "opted_in",
          waitlistStatus: "paused",
          serviceId: "hair",
          serviceInterestIds: ["hair"],
          alreadyOffered: false
        },
        {
          customerId: "e",
          phoneE164: "+15145550195",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: "hair",
          serviceInterestIds: ["hair"],
          alreadyOffered: true
        }
      ],
      "hair"
    );

    expect(recipients.map((recipient) => recipient.customerId)).toEqual(["a"]);
  });

  it("matches against selected service interests and supports general waitlist fallback", () => {
    const recipients = filterEligibleOpeningRecipients(
      [
        {
          customerId: "multi",
          phoneE164: "+15145550199",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: null,
          serviceInterestIds: ["color", "hair"],
          alreadyOffered: false
        },
        {
          customerId: "general",
          phoneE164: "+15145550198",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: null,
          serviceInterestIds: [],
          alreadyOffered: false
        },
        {
          customerId: "miss",
          phoneE164: "+15145550197",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: null,
          serviceInterestIds: ["nails"],
          alreadyOffered: false
        }
      ],
      "hair"
    );

    expect(recipients.map((recipient) => recipient.customerId)).toEqual([
      "multi",
      "general"
    ]);
  });

  it("does not return duplicate customers when service interests repeat", () => {
    const recipients = filterEligibleOpeningRecipients(
      [
        {
          customerId: "a",
          phoneE164: "+15145550199",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: null,
          serviceInterestIds: ["hair", "hair"],
          alreadyOffered: false
        },
        {
          customerId: "a",
          phoneE164: "+15145550199",
          consentStatus: "opted_in",
          waitlistStatus: "active",
          serviceId: "hair",
          serviceInterestIds: ["hair"],
          alreadyOffered: false
        }
      ],
      "hair"
    );

    expect(recipients.map((recipient) => recipient.customerId)).toEqual(["a"]);
  });
});
