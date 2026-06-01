import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { classifyInboundSmsBody } from "@/lib/sms/inbound";

const inboundRoute = readFileSync(
  join(process.cwd(), "src/app/api/sms/inbound/route.ts"),
  "utf8"
);

describe("inbound SMS persistence route", () => {
  it("classifies opt-out, appointment, and waitlist replies conservatively", () => {
    expect(classifyInboundSmsBody(" STOP ")).toBe("opt_out");
    expect(classifyInboundSmsBody("arret")).toBe("opt_out");
    expect(classifyInboundSmsBody("UNSUBSCRIBE")).toBe("opt_out");
    expect(classifyInboundSmsBody("1")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody("oui")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody(" YES ")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody("non", "appointment")).toBe(
      "appointment_cancel"
    );
    expect(classifyInboundSmsBody("cancel", "appointment")).toBe(
      "appointment_cancel"
    );
    expect(classifyInboundSmsBody("cancel")).toBe("opt_out");
    expect(classifyInboundSmsBody("confirm", "appointment")).toBe(
      "appointment_confirm"
    );
    expect(classifyInboundSmsBody("hello")).toBe("unknown");
  });

  it("persists inbound messages and opt-outs through the service client", () => {
    expect(inboundRoute).toContain("createSupabaseServiceClient");
    expect(inboundRoute).toContain("isSimulatorWebhookAllowed");
    expect(inboundRoute).toContain("SIMULATOR_WEBHOOK_SECRET_HEADER");
    expect(inboundRoute).toContain('.from("sms_messages")');
    expect(inboundRoute).toContain('direction: "inbound"');
    expect(inboundRoute).toContain('status: "received"');
    expect(inboundRoute).toContain('status: "opted_out"');
    expect(inboundRoute).toContain("unsubscribed_at");
    expect(inboundRoute).toContain('action: "sms.inbound.linked"');
    expect(inboundRoute).toContain('action: "sms.opt_out.received"');
  });

  it("handles duplicate provider message ids idempotently", () => {
    expect(inboundRoute).toContain("provider_message_id");
    expect(inboundRoute).toContain(".maybeSingle()");
    expect(inboundRoute).toContain("idempotent: true");
    expect(inboundRoute).toContain("Inbound idempotency lookup failed.");
  });

  it("links waitlist positive replies without automatic confirmation", () => {
    expect(inboundRoute).toContain('.from("opening_offers")');
    expect(inboundRoute).toContain('status: "responded"');
    expect(inboundRoute).toContain("getNextResponseRank");
    expect(inboundRoute).toContain('.from("booking_requests")');
    expect(inboundRoute).toContain('status: "pending_merchant_validation"');
  });

  it("updates appointment confirmation and cancellation without auto-confirming recovery", () => {
    expect(inboundRoute).toContain("appointment_id");
    expect(inboundRoute).toContain('classification === "appointment_confirm"');
    expect(inboundRoute).toContain('status: "scheduled"');
    expect(inboundRoute).toContain('confirmation_status: "confirmed_by_client"');
    expect(inboundRoute).toContain('classification === "appointment_cancel"');
    expect(inboundRoute).toContain('confirmation_status: "cancelled_by_client"');
    expect(inboundRoute).toContain('"appointment.sms_confirmed"');
    expect(inboundRoute).toContain('"appointment.sms_cancelled"');
    expect(inboundRoute).toContain("maybeCreateRecoveryOpeningFromAppointment");
    expect(inboundRoute).toContain("auto_create_opening_on_sms_cancellation");
    expect(inboundRoute).toContain('source: "appointment_cancellation"');
    expect(inboundRoute).toContain("source_appointment_id");
    expect(inboundRoute).toContain('status: "pending" as const');
  });

  it("does not guess tenant context when no outbound message matches", () => {
    expect(inboundRoute).toContain("received_unlinked");
    expect(inboundRoute).toContain("received_linked");
    expect(inboundRoute).toContain("No prior outbound message context");
    expect(inboundRoute).toContain('.eq("provider", providerName)');
    expect(inboundRoute).toContain('.eq("to_number", fromNumber)');
    expect(inboundRoute).toContain('.eq("from_number", toNumber)');
    expect(inboundRoute).toContain('.not("opening_id", "is", null)');
  });
});
