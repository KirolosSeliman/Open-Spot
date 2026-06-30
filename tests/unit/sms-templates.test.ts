import { describe, expect, it } from "vitest";

import { renderOpeningOfferSms } from "@/lib/sms/templates";

describe("renderOpeningOfferSms", () => {
  it("does not imply automatic booking confirmation", () => {
    const message = renderOpeningOfferSms({
      locale: "en",
      businessName: "Salon Demo",
      timeLabel: "today at 3 PM",
      serviceName: "haircut",
      offerText: "10% off"
    });

    expect(message).toContain("Reply YES to request it.");
    expect(message).not.toContain("book automatically");
  });

  it("renders French opt-out copy", () => {
    expect(
      renderOpeningOfferSms({
        locale: "fr",
        businessName: "Salon Demo",
        timeLabel: "aujourd'hui a 15 h",
        serviceName: "coupe",
        offerText: ""
      })
    ).toContain("STOP pour arrêter");
  });
});
