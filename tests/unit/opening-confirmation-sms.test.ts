import { describe, expect, it } from "vitest";

import {
  generateOpeningConfirmationSmsMessage,
  generateOpeningSmsMessage
} from "@/lib/sms/message-generator";

describe("opening confirmation SMS message generation", () => {
  it("generates a French manual-validation confirmation SMS with address and opt-out copy", () => {
    const message = generateOpeningConfirmationSmsMessage({
      businessName: "Clinique Open Spot",
      businessAddress: "123 rue Saint-Denis, Montreal",
      serviceName: "Nettoyage",
      startsAt: "2026-06-14T15:30:00.000Z",
      customerFirstName: "Mila",
      language: "fr",
      timezone: "America/Toronto",
      includeOptOut: true
    });

    expect(message.body).toContain("Bonjour Mila");
    expect(message.body).toContain("votre rendez-vous chez Clinique Open Spot est confirme");
    expect(message.body).toContain("Nettoyage");
    expect(message.body).toContain("Adresse : 123 rue Saint-Denis, Montreal");
    expect(message.body).toContain("AIDE");
    expect(message.body).toContain("STOP");
    expect(message.language).toBe("fr");
    expect(message.characterCount).toBe([...message.body].length);
    expect(message.estimatedSegments).toBeGreaterThanOrEqual(1);
  });

  it("generates an English manual-validation confirmation SMS without auto-confirm language", () => {
    const message = generateOpeningConfirmationSmsMessage({
      businessName: "Open Spot Studio",
      businessAddress: "456 Main Street, Toronto",
      serviceName: "Haircut",
      startsAt: "2026-06-14T15:30:00.000Z",
      customerFirstName: "Alex",
      language: "en",
      timezone: "America/Toronto",
      includeOptOut: true
    });

    expect(message.body).toContain("Hi Alex");
    expect(message.body).toContain("your appointment at Open Spot Studio is confirmed");
    expect(message.body).toContain("Haircut");
    expect(message.body).toContain("Address: 456 Main Street, Toronto");
    expect(message.body).toContain("Reply HELP for help or STOP to unsubscribe");
    expect(message.body).not.toMatch(/\breply yes\b/i);
    expect(message.body).not.toMatch(/\bauto[- ]?confirm/i);
  });

  it("flags missing business address without inserting undefined text", () => {
    const message = generateOpeningConfirmationSmsMessage({
      businessName: "Open Spot Studio",
      serviceName: "Haircut",
      startsAt: "2026-06-14T15:30:00.000Z",
      language: "en"
    });

    expect(message.warnings).toContain("missing_business_address");
    expect(message.body).not.toContain("undefined");
    expect(message.body).not.toContain("Address:");
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
      businessAddress: "456 Main Street, Toronto",
      serviceName: "Haircut",
      startsAt: "2026-06-14T15:30:00.000Z",
      language: "en"
    });

    expect(alert.body).toContain("Reply YES if interested");
    expect(alert.body).toContain("Manual confirmation");
    expect(confirmation.body).not.toContain("Reply YES if interested");
    expect(confirmation.body).toContain("is confirmed");
  });
});
