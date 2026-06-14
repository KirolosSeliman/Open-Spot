import { describe, expect, it } from "vitest";

import {
  generateOpeningConfirmationSmsMessage,
  generateOpeningSmsMessage
} from "@/lib/sms/message-generator";

describe("opening confirmation SMS message generation", () => {
  it("generates a French manual-validation confirmation SMS with opt-out copy", () => {
    const message = generateOpeningConfirmationSmsMessage({
      businessName: "Clinique Open Spot",
      serviceName: "Nettoyage",
      startsAt: "2026-06-14T15:30:00.000Z",
      customerFirstName: "Mila",
      language: "fr",
      includeOptOut: true
    });

    expect(message.body).toContain("Bonjour Mila");
    expect(message.body).toContain("Clinique Open Spot confirme votre place");
    expect(message.body).toContain("Nettoyage");
    expect(message.body).toContain("STOP pour arret");
    expect(message.language).toBe("fr");
    expect(message.characterCount).toBe([...message.body].length);
    expect(message.estimatedSegments).toBeGreaterThanOrEqual(1);
  });

  it("generates an English manual-validation confirmation SMS without auto-confirm language", () => {
    const message = generateOpeningConfirmationSmsMessage({
      businessName: "Open Spot Studio",
      serviceName: "Haircut",
      startsAt: "2026-06-14T15:30:00.000Z",
      customerFirstName: "Alex",
      language: "en",
      includeOptOut: true
    });

    expect(message.body).toContain("Hi Alex");
    expect(message.body).toContain("Open Spot Studio confirms your spot");
    expect(message.body).toContain("Haircut");
    expect(message.body).toContain("Reply STOP to opt out");
    expect(message.body).not.toMatch(/\breply yes\b/i);
    expect(message.body).not.toMatch(/\bauto[- ]?confirm/i);
  });

  it("keeps opening alert and confirmation SMS as separate message types", () => {
    const alert = generateOpeningSmsMessage({
      businessName: "Open Spot Studio",
      serviceName: "Haircut",
      startsAt: "2026-06-14T15:30:00.000Z",
      language: "en"
    });
    const confirmation = generateOpeningConfirmationSmsMessage({
      businessName: "Open Spot Studio",
      serviceName: "Haircut",
      startsAt: "2026-06-14T15:30:00.000Z",
      language: "en"
    });

    expect(alert.body).toContain("Reply YES if interested");
    expect(alert.body).toContain("Manual confirmation");
    expect(confirmation.body).not.toContain("Reply YES if interested");
    expect(confirmation.body).toContain("confirms your spot");
  });
});
