import { describe, expect, it } from "vitest";

import {
  buildPotentialClientInsert,
  consentText,
  validatePotentialClientInput
} from "@/lib/potential-clients/validation";

describe("potential client validation", () => {
  const validInput = {
    fullName: "Sarah Martin",
    businessName: "Studio Elise",
    email: "sarah@studioelise.com",
    phone: "(514) 555-0198",
    businessType: "Hair salon",
    preferredContactMethod: "sms",
    message: "Weekday mornings are best.",
    consentToContact: true,
    sourcePath: "/book-call",
    honeypot: ""
  };

  it("accepts a valid call request and normalizes contact fields", () => {
    const result = validatePotentialClientInput(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fullName).toBe("Sarah Martin");
    expect(result.value.email).toBe("sarah@studioelise.com");
    expect(result.value.phoneNormalized).toBe("+15145550198");
    expect(result.value.preferredContactMethod).toBe("sms");
    expect(result.value.consentText).toBe(consentText);
  });

  it("rejects missing consent, invalid email, invalid phone, and long notes", () => {
    const result = validatePotentialClientInput({
      ...validInput,
      email: "bad",
      phone: "123",
      consentToContact: false,
      message: "x".repeat(501)
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toBe("Enter a valid email address.");
    expect(result.errors.phone).toBe("Enter a valid phone number.");
    expect(result.errors.consentToContact).toBe(
      "Please agree to be contacted so we can follow up about your call request."
    );
    expect(result.errors.message).toBe("Message must be 500 characters or fewer.");
  });

  it("builds an auditable insert payload with consent proof and email status defaults", () => {
    const result = validatePotentialClientInput(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const insert = buildPotentialClientInsert({
      input: result.value,
      ip: "203.0.113.10",
      userAgent: "Vitest",
      now: new Date("2026-06-20T12:00:00.000Z")
    });

    expect(insert.consent_to_contact).toBe(true);
    expect(insert.consent_text).toBe(consentText);
    expect(insert.consented_at).toBe("2026-06-20T12:00:00.000Z");
    expect(insert.consent_ip).toBe("203.0.113.10");
    expect(insert.consent_user_agent).toBe("Vitest");
    expect(insert.confirmation_email_status).toBe("pending");
    expect(insert.owner_notification_status).toBe("pending");
  });
});
