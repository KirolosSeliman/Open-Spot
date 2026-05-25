import { describe, expect, it } from "vitest";

import { validateProductionEnvironment } from "@/lib/env/production";

describe("validateProductionEnvironment", () => {
  it("blocks real SMS providers without explicit production opt-in", () => {
    expect(
      validateProductionEnvironment({
        NODE_ENV: "production",
        SMS_PROVIDER: "plivo"
      })
    ).toContain("ALLOW_REAL_SMS_SENDS must be true for real SMS providers.");
  });
});
