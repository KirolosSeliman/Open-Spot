import { describe, expect, it } from "vitest";

import {
  clientEnvKeys,
  getSmsProvider,
  isSupabaseConfigured,
  serverOnlyEnvKeys
} from "@/lib/env/config";

describe("environment configuration", () => {
  it("keeps service role and SMS credentials server-only", () => {
    expect(serverOnlyEnvKeys).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serverOnlyEnvKeys).toContain("PLIVO_AUTH_TOKEN");
    expect(serverOnlyEnvKeys).toContain("TWILIO_AUTH_TOKEN");
    expect(clientEnvKeys).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(clientEnvKeys).not.toContain("PLIVO_AUTH_TOKEN");
    expect(clientEnvKeys).not.toContain("TWILIO_AUTH_TOKEN");
  });

  it("defaults SMS provider to simulator for local safety", () => {
    expect(getSmsProvider({})).toBe("simulator");
  });

  it("requires both public Supabase values before auth clients are used", () => {
    expect(isSupabaseConfigured({})).toBe(false);
    expect(
      isSupabaseConfigured({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
      })
    ).toBe(true);
  });
});
