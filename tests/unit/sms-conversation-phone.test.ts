import { describe, expect, it } from "vitest";

import { smsConversationPhoneCopy } from "@/components/marketing/sms-conversation-phone";

describe("SMS conversation phone marketing preview", () => {
  it("uses appointment cancellation SMS copy with manual merchant confirmation", () => {
    const en = smsConversationPhoneCopy.en;

    expect(en.businessName).toBe("Open Spot Salon");
    expect(en.messages).toEqual([
      {
        from: "business",
        text: "Hi Sarah, a spot opened today at 4:30 PM for a haircut. Reply YES if you want it."
      },
      {
        from: "customer",
        text: "YES, I can come."
      },
      {
        from: "business",
        text: "Great - your reply was received. The salon will manually confirm shortly."
      }
    ]);
    expect(en.complianceLine).toBe("Reply STOP to unsubscribe.");
    expect(en.floatingBadges.map((badge) => badge.label)).toEqual([
      "Consent checked",
      "Manual confirmation",
      "Reply received",
      "Waitlist notified"
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
