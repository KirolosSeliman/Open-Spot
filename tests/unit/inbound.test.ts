import { describe, expect, it } from "vitest";

import { classifyInboundSmsBody } from "@/lib/sms/inbound";

describe("classifyInboundSmsBody", () => {
  it("recognizes STOP-like replies", () => {
    expect(classifyInboundSmsBody(" STOP ")).toBe("opt_out");
    expect(classifyInboundSmsBody("ARRÊT")).toBe("opt_out");
  });

  it("recognizes HELP and AIDE requests", () => {
    expect(classifyInboundSmsBody("HELP")).toBe("sms_help");
    expect(classifyInboundSmsBody("aide")).toBe("sms_help");
    expect(classifyInboundSmsBody("INFO")).toBe("sms_help");
  });

  it("recognizes UNSTOP and START as re-subscribe outside consent context", () => {
    expect(classifyInboundSmsBody("UNSTOP")).toBe("sms_unstop");
    expect(classifyInboundSmsBody("start")).toBe("sms_unstop");
    expect(classifyInboundSmsBody("START", "consent")).toBe("consent_opt_in");
    expect(classifyInboundSmsBody("UNSTOP", "consent")).toBe("consent_opt_in");
  });

  it("recognizes positive booking request replies", () => {
    expect(classifyInboundSmsBody("oui")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody("YES")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody("1")).toBe("waitlist_positive");
  });

  it("recognizes explicit consent request replies without changing other contexts", () => {
    expect(classifyInboundSmsBody("OUI", "consent")).toBe("consent_opt_in");
    expect(classifyInboundSmsBody("YES", "consent")).toBe("consent_opt_in");
    expect(classifyInboundSmsBody("START", "consent")).toBe("consent_opt_in");
    expect(classifyInboundSmsBody("oui dispo", "consent")).toBe("consent_opt_in");
    expect(classifyInboundSmsBody("NO", "consent")).toBe("consent_decline");
    expect(classifyInboundSmsBody("NON", "consent")).toBe("consent_decline");
    expect(classifyInboundSmsBody("STOP", "consent")).toBe("opt_out");
    expect(classifyInboundSmsBody("YES", "waitlist")).toBe("waitlist_positive");
    expect(classifyInboundSmsBody("YES", "appointment")).toBe("appointment_confirm");
    expect(classifyInboundSmsBody("NO", "appointment")).toBe("appointment_cancel");
  });

  it("keeps unknown replies unconfirmed", () => {
    expect(classifyInboundSmsBody("how much?")).toBe("unknown");
  });
});
