import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  generateBillingPaymentReminderSmsMessage,
  generateBookCallConfirmationSmsMessage
} from "@/lib/sms/platform-message-generator";

describe("platform SMS", () => {
  it("generates French book call confirmation SMS", () => {
    const message = generateBookCallConfirmationSmsMessage({
      firstName: "Marie",
      language: "fr"
    });

    expect(message.body).toContain("Bonjour Marie");
    expect(message.body).toContain("Open Spot a bien recu votre demande d'appel");
    expect(message.body).toContain("STOP");
  });

  it("generates English billing payment reminder SMS with payment link", () => {
    const message = generateBillingPaymentReminderSmsMessage({
      contactName: "Alex",
      businessName: "Studio Nova",
      billingPeriod: "June 2026",
      amountDue: "$685.00",
      paymentUrl: "https://pay.example.com/abc",
      language: "en"
    });

    expect(message.body).toContain("Hi Alex");
    expect(message.body).toContain("Studio Nova");
    expect(message.body).toContain("June 2026");
    expect(message.body).toContain("$685.00");
    expect(message.body).toContain("https://pay.example.com/abc");
  });
});

describe("platform SMS integration wiring", () => {
  it("sends book call confirmation after request persistence", () => {
    const route = readFileSync(
      join(process.cwd(), "src/app/api/book-call-requests/route.ts"),
      "utf8"
    );

    expect(route).toContain("sendBookCallConfirmationSms");
    expect(route.indexOf('from("book_call_requests")')).toBeLessThan(
      route.indexOf("sendBookCallConfirmationSms")
    );
    expect(route).toContain("confirmationSmsSent");
  });

  it("ships platform SMS helper and billing reminder UI", () => {
    const platformConfig = readFileSync(
      join(process.cwd(), "src/lib/sms/platform-config.ts"),
      "utf8"
    );
    const platformSms = readFileSync(
      join(process.cwd(), "src/lib/sms/platform-sms.ts"),
      "utf8"
    );
    const billingButton = readFileSync(
      join(process.cwd(), "src/components/admin/billing-payment-reminder-button.tsx"),
      "utf8"
    );
    const billingPage = readFileSync(
      join(process.cwd(), "src/app/admin/organizations/[id]/billing/page.tsx"),
      "utf8"
    );

    expect(platformConfig).toContain("TWILIO_PLATFORM_MESSAGING_SERVICE_SID");
    expect(platformConfig).toContain("TWILIO_PLATFORM_FROM_NUMBER");
    expect(platformSms).toContain("sendPlatformSms");
    expect(platformSms).toContain("platform_sms_messages");
    expect(platformSms).toContain("withinHours: 24");
    expect(billingPage).toContain("BillingPaymentReminderButton");
    expect(billingButton).toContain("Envoyer un rappel de paiement");
  });

  it("documents platform Twilio env vars", () => {
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(envExample).toContain("TWILIO_PLATFORM_MESSAGING_SERVICE_SID=");
    expect(envExample).toContain("TWILIO_PLATFORM_FROM_NUMBER=");
  });
});
