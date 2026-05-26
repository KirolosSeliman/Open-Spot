import { describe, expect, it } from "vitest";

import {
  countSmsCharacters,
  estimateSmsSegments,
  generateCancellationSms
} from "@/lib/dashboard/message-generation";

describe("dashboard SMS message generation", () => {
  it("generates the required French default cancellation SMS", () => {
    expect(
      generateCancellationSms({
        locale: "fr",
        businessName: "Salon Demo",
        appointmentDate: "26 mai 2026",
        appointmentTime: "14:30",
        serviceName: "Coupe régulière"
      })
    ).toBe(
      "Bonjour, une place vient de se libérer chez Salon Demo le 26 mai 2026 à 14:30 pour Coupe régulière. Répondez OUI si vous êtes intéressé. Votre rendez-vous sera confirmé seulement après validation par notre équipe."
    );
  });

  it("generates the required English default cancellation SMS", () => {
    expect(
      generateCancellationSms({
        locale: "en",
        businessName: "Demo Salon",
        appointmentDate: "May 26, 2026",
        appointmentTime: "2:30 PM",
        serviceName: "Regular haircut"
      })
    ).toBe(
      "Hi, a spot just opened at Demo Salon on May 26, 2026 at 2:30 PM for Regular haircut. Reply YES if you are interested. Your appointment will only be confirmed after our team validates it."
    );
  });

  it("estimates SMS length without implying automatic confirmation", () => {
    const message = generateCancellationSms({
      locale: "fr",
      businessName: "Salon Demo",
      appointmentDate: "26 mai 2026",
      appointmentTime: "14:30",
      serviceName: "Coupe régulière"
    });

    expect(countSmsCharacters(message)).toBeGreaterThan(160);
    expect(estimateSmsSegments(message)).toBe(2);
    expect(message).not.toMatch(/automatiquement|automatically/i);
  });
});
