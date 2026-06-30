import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/sms/send-opening/route";

describe("/api/sms/send-opening", () => {
  it("returns 410 and does not expose a service-role opening send path", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.error).toContain("disabled");
    expect(body.error).toContain("dashboard server actions");
  });

  it("keeps the route disabled without organizationId or service-role access", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "src/app/api/sms/send-opening/route.ts"),
      "utf8"
    );

    expect(routeSource).not.toContain("createSupabaseServiceClient");
    expect(routeSource).not.toContain("organizationId");
    expect(routeSource).toContain("410");
  });
});
