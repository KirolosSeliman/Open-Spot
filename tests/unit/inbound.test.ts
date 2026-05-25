import { describe, expect, it } from "vitest";

import { classifyInboundSmsBody } from "@/lib/sms/inbound";

describe("classifyInboundSmsBody", () => {
  it("recognizes STOP-like replies", () => {
    expect(classifyInboundSmsBody(" STOP ")).toBe("opt_out");
    expect(classifyInboundSmsBody("ARRÊT")).toBe("opt_out");
  });

  it("recognizes positive booking request replies", () => {
    expect(classifyInboundSmsBody("oui")).toBe("positive");
    expect(classifyInboundSmsBody("YES")).toBe("positive");
    expect(classifyInboundSmsBody("1")).toBe("positive");
  });

  it("keeps unknown replies unconfirmed", () => {
    expect(classifyInboundSmsBody("how much?")).toBe("unknown");
  });
});
