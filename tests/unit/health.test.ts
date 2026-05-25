import { describe, expect, it } from "vitest";

import { createHealthPayload } from "@/lib/env/health";

describe("createHealthPayload", () => {
  it("returns app status without exposing secrets", () => {
    const payload = createHealthPayload("simulator");

    expect(payload).toEqual({
      app: "2e Chance RDV",
      status: "ok",
      smsProvider: "simulator"
    });
    expect(JSON.stringify(payload)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
