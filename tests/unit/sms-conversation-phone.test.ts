import { describe, expect, it } from "vitest";

import { smsConversationPhoneCopy } from "@/components/marketing/sms-conversation-phone";

describe("SMS conversation phone marketing preview", () => {
  it("uses Open Spot appointment workflow copy for the hero phone", () => {
    const en = smsConversationPhoneCopy.en;

    expect(en.businessName).toBe("Open Spot");
    expect(en.statusTime).toBe("9:41");
    expect(en.floatingBadges.map((badge) => badge.label)).toEqual([
      "Secure & compliant",
      "Fill more. No-shows down."
    ]);
  });

  it("does not contain forbidden automatic confirmation positioning", () => {
    const forbiddenTerms = [
      "Confirmed automatically",
      "Automatically confirmed",
      "First reply wins",
      "Auto-confirmation",
      "Automatic booking"
    ];
    const serializedCopy = JSON.stringify(smsConversationPhoneCopy);

    for (const term of forbiddenTerms) {
      expect(serializedCopy).not.toContain(term);
    }
  });
});
