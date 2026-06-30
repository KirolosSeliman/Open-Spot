import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the configured limit", () => {
    const key = `test:${Date.now()}:under-limit`;

    expect(checkRateLimit({ key, limit: 3, windowMs: 60_000 })).toEqual({
      ok: true,
      retryAfterSeconds: 0
    });
    expect(checkRateLimit({ key, limit: 3, windowMs: 60_000 })).toEqual({
      ok: true,
      retryAfterSeconds: 0
    });
  });

  it("blocks repeated requests after the limit is reached", () => {
    const key = `test:${Date.now()}:over-limit`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(checkRateLimit({ key, limit: 3, windowMs: 60_000 }).ok).toBe(true);
    }

    const blocked = checkRateLimit({ key, limit: 3, windowMs: 60_000 });

    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
