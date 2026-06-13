import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { classifyInboundSmsBody } from "@/lib/sms/inbound";

const inboundRoute = readFileSync(
  join(process.cwd(), "src/app/api/sms/inbound/route.ts"),
  "utf8"
);
const inboundHandler = readFileSync(
  join(process.cwd(), "src/lib/sms/inbound-handler.ts"),
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
    expect(inboundHandler).toContain("createSupabaseServiceClient");
    expect(inboundHandler).toContain("isSimulatorWebhookAllowed");
    expect(inboundHandler).toContain("SIMULATOR_WEBHOOK_SECRET_HEADER");
    expect(inboundHandler).toContain('.from("sms_messages")');
    expect(inboundHandler).toContain('direction: "inbound"');
    expect(inboundHandler).toContain('status: "received"');
    expect(inboundHandler).toContain('status: "opted_out"');
    expect(inboundHandler).toContain("unsubscribed_at");
    expect(inboundHandler).toContain('action: "sms.inbound.linked"');
    expect(inboundHandler).toContain('action: "sms.opt_out.received"');
  });

  it("handles duplicate provider message ids idempotently", () => {
    expect(inboundHandler).toContain("provider_message_id");
    expect(inboundHandler).toContain(".maybeSingle()");
    expect(inboundHandler).toContain("idempotent: true");
    expect(inboundHandler).toContain("Inbound idempotency lookup failed.");
  });

  it("links waitlist positive replies without automatic confirmation", () => {
    expect(inboundHandler).toContain('.from("opening_offers")');
    expect(inboundHandler).toContain('status: "responded"');
    expect(inboundHandler).toContain("getNextResponseRank");
    expect(inboundHandler).toContain('.from("booking_requests")');
    expect(inboundHandler).toContain('status: "pending_merchant_validation"');
  });

  it("updates appointment confirmation and cancellation without auto-confirming recovery", () => {
    expect(inboundHandler).toContain("appointment_id");
    expect(inboundHandler).toContain('classification === "appointment_confirm"');
    expect(inboundHandler).toContain('status: "scheduled"');
    expect(inboundHandler).toContain('confirmation_status: "confirmed_by_client"');
    expect(inboundHandler).toContain('classification === "appointment_cancel"');
    expect(inboundHandler).toContain('confirmation_status: "cancelled_by_client"');
    expect(inboundHandler).toContain('"appointment.sms_confirmed"');
    expect(inboundHandler).toContain('"appointment.sms_cancelled"');
    expect(inboundHandler).toContain("maybeCreateRecoveryOpeningFromAppointment");
    expect(inboundHandler).toContain("auto_create_opening_on_sms_cancellation");
    expect(inboundHandler).toContain('source: "appointment_cancellation"');
    expect(inboundHandler).toContain("source_appointment_id");
    expect(inboundHandler).toContain('status: "pending" as const');
  });

  it("does not guess tenant context when no outbound message matches", () => {
    expect(inboundHandler).toContain("received_unlinked");
    expect(inboundHandler).toContain("received_linked");
    expect(inboundHandler).toContain("No prior outbound message context");
    expect(inboundHandler).toContain('.eq("provider", providerName)');
    expect(inboundHandler).toContain('.eq("to_number", fromNumber)');
    expect(inboundHandler).toContain('.eq("from_number", toNumber)');
    expect(inboundHandler).toContain('.not("customer_id", "is", null)');
    expect(inboundHandler).toContain(
      '.or("opening_id.not.is.null,appointment_id.not.is.null,message_type.eq.consent_request")'
    );
  });

  it("keeps the Next route file as a minimal App Router wrapper", () => {
    expect(inboundRoute).toContain(
      'import { handleInboundSmsRequest } from "@/lib/sms/inbound-handler";'
    );
    expect(inboundRoute).toContain('export const runtime = "nodejs";');
    expect(inboundRoute).toContain("export async function POST");
    expect(inboundRoute).not.toContain("createSupabaseServiceClient");
    expect(inboundRoute).not.toContain("maybeCreateRecoveryOpeningFromAppointment");
  });
});
