import { describe, expect, it } from "vitest";

import {
  buildBookCallRequestInsert,
  validateBookCallRequestInput
} from "@/lib/book-call/validation";

describe("book call request validation", () => {
  const validInput = {
    locale: "fr",
    fullName: " Sarah Martin ",
    businessName: " Studio Elise ",
    email: " SARAH@STUDIOELISE.COM ",
    phone: " (514) 555-0198 ",
    businessType: "Salon de coiffure",
    currentBookingSystem: "Fresha",
    cancellationVolume: "3 à 5 par semaine",
    preferredTimeMessage: "Mardi matin.",
    consentSmsEmail: true,
    website: ""
  };

  it("accepts a valid payload and trims contact fields", () => {
    const result = validateBookCallRequestInput(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok || result.isSpam) return;

    expect(result.value.locale).toBe("fr");
    expect(result.value.fullName).toBe("Sarah Martin");
    expect(result.value.businessName).toBe("Studio Elise");
    expect(result.value.email).toBe("sarah@studioelise.com");
    expect(result.value.phone).toBe("(514) 555-0198");
    expect(result.value.consentSmsEmail).toBe(true);
  });

  it("refuses empty required identity fields", () => {
    const result = validateBookCallRequestInput({
      ...validInput,
      fullName: "",
      businessName: ""
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.fields.fullName).toBeDefined();
    expect(result.fields.businessName).toBeDefined();
  });

  it("refuses invalid email and empty phone values", () => {
    const result = validateBookCallRequestInput({
      ...validInput,
      email: "not-an-email",
      phone: ""
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.fields.email).toBe("Enter a valid email address.");
    expect(result.fields.phone).toBe("Enter a valid phone number.");
  });

  it("requires explicit SMS and email consent", () => {
    const result = validateBookCallRequestInput({
      ...validInput,
      consentSmsEmail: false
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.fields.consentSmsEmail).toBeDefined();
  });

  it("refuses an oversized preferred-time message", () => {
    const result = validateBookCallRequestInput({
      ...validInput,
      preferredTimeMessage: "x".repeat(1001)
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.fields.preferredTimeMessage).toBe(
      "Message must be 1000 characters or fewer."
    );
  });

  it("treats a filled honeypot as neutral success without a real lead", () => {
    const result = validateBookCallRequestInput({
      ...validInput,
      website: "https://spam.example"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.isSpam).toBe(true);
    expect(result.value).toBeNull();
  });

  it("builds the expected database insert payload", () => {
    const result = validateBookCallRequestInput(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok || result.isSpam) return;

    const insert = buildBookCallRequestInsert({
      input: result.value,
      sourceUrl: "https://openspot.example/book-call/questions",
      userAgent: "Vitest"
    });

    expect(insert).toMatchObject({
      full_name: "Sarah Martin",
      business_name: "Studio Elise",
      email: "sarah@studioelise.com",
      phone: "(514) 555-0198",
      status: "new",
      source_path: "/book-call/questions",
      source_url: "https://openspot.example/book-call/questions",
      user_agent: "Vitest",
      consent_sms_email: true
    });
  });
});
