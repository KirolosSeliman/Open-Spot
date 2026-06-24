import { describe, expect, it } from "vitest";

import {
  generateConsentRequestSmsMessage,
  generateOpeningSmsMessage
} from "@/lib/sms/message-generator";

describe("generateOpeningSmsMessage", () => {
  it("generates a French message without an offer", () => {
    const message = generateOpeningSmsMessage({
      businessName: "Salon Demo",
      serviceName: "Coupe",
      startsAt: "2026-06-01T14:00:00",
      language: "fr"
    });

    expect(message.body).toContain("Salon Demo: place disponible pour Coupe");
    expect(message.body).toContain("Repondez OUI si interesse.");
    expect(message.body).toContain("Confirmation manuelle.");
    expect(message.body).toContain("STOP pour arret.");
  });

  it("generates a French message with an offer", () => {
    const message = generateOpeningSmsMessage({
      businessName: "Salon Demo",
      serviceName: "Coupe",
      startsAt: "2026-06-01T14:00:00",
      offerLabel: "15% aujourd'hui seulement",
      customerFirstName: "Kiro",
      language: "fr"
    });

    expect(message.body).toContain("Bonjour Kiro,");
    expect(message.body).toContain("15% aujourd'hui seulement.");
  });

  it("generates an English message without an offer", () => {
    const message = generateOpeningSmsMessage({
      businessName: "Demo Salon",
      serviceName: "Haircut",
      startsAt: "2026-06-01T14:00:00",
      language: "en"
    });

    expect(message.body).toContain("Demo Salon: spot available for Haircut");
    expect(message.body).toContain("Reply YES if interested.");
    expect(message.body).toContain("Manual confirmation.");
    expect(message.body).toContain("Reply STOP to opt out.");
  });

  it("generates an English message with an offer", () => {
    const message = generateOpeningSmsMessage({
      businessName: "Demo Salon",
      serviceName: "Haircut",
      startsAt: "2026-06-01T14:00:00",
      offerLabel: "15% today only",
      customerFirstName: "Kiro",
      language: "en"
    });

    expect(message.body).toContain("Hi Kiro,");
    expect(message.body).toContain("15% today only.");
  });

  it("uses safe fallbacks for missing business and service names", () => {
    const message = generateOpeningSmsMessage({
      businessName: "",
      serviceName: "",
      startsAt: "2026-06-01T14:00:00",
      language: "en"
    });

    expect(message.body).toContain("Your business");
    expect(message.body).toContain("this service");
    expect(message.warnings).toContain("missing_business_name");
    expect(message.warnings).toContain("missing_service_name");
  });

  it("warns on long offer labels", () => {
    const message = generateOpeningSmsMessage({
      businessName: "Demo Salon",
      serviceName: "Haircut",
      startsAt: "2026-06-01T14:00:00",
      offerLabel: "A".repeat(90),
      language: "en"
    });

    expect(message.warnings).toContain("long_offer_label");
  });

  it("does not include internal notes or guaranteed booking language", () => {
    const message = generateOpeningSmsMessage({
      businessName: "Demo Salon",
      serviceName: "Haircut",
      startsAt: "2026-06-01T14:00:00",
      offerLabel: "Client asked for quiet chair",
      language: "en"
    });

    expect(message.body).not.toMatch(
      new RegExp(`guaranteed|${["automatically", "confirmed"].join(" ")}`, "i")
    );
    expect(message.body).toContain("Manual confirmation.");
  });

  it("returns character count and estimated segment count", () => {
    const message = generateOpeningSmsMessage({
      businessName: "Demo Salon",
      serviceName: "Haircut",
      startsAt: "2026-06-01T14:00:00",
      offerLabel: "A".repeat(180),
      language: "en"
    });

    expect(message.characterCount).toBe([...message.body].length);
    expect(message.estimatedSegments).toBeGreaterThan(1);
    expect(message.warnings).toContain("message_exceeds_single_segment");
  });
});

describe("generateConsentRequestSmsMessage", () => {
  it("generates a French consent request with compliance copy", () => {
    const message = generateConsentRequestSmsMessage({
      businessName: "Salon Demo",
      customerFirstName: "Maya",
      language: "fr"
    });

    expect(message.body).toContain("Bonjour Maya");
    expect(message.body).toContain("Salon Demo");
    expect(message.body).toContain("OUI");
    expect(message.body).toContain("STOP");
    expect(message.body).toContain("frais de messagerie");
    expect(message.body).not.toMatch(/Vistaire/i);
  });

  it("generates an English consent request with compliance copy", () => {
    const message = generateConsentRequestSmsMessage({
      businessName: "Demo Salon",
      customerFirstName: null,
      language: "en"
    });

    expect(message.body).toContain("Hi,");
    expect(message.body).toContain("Demo Salon");
    expect(message.body).toContain("YES");
    expect(message.body).toContain("STOP");
    expect(message.body).toContain("Message and data rates");
    expect(message.body).not.toMatch(/Vistaire/i);
  });
});
