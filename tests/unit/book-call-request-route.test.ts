import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/book-call-requests/route";

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonRequest(payload: unknown) {
  return new Request("https://openspot.example/api/book-call-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: "https://openspot.example/book-call/questions",
      "user-agent": "Vitest"
    },
    body: JSON.stringify(payload)
  });
}

const validPayload = {
  locale: "en",
  fullName: "Sarah Martin",
  businessName: "Studio Elise",
  email: "sarah@studioelise.com",
  phone: "(514) 555-0198",
  businessType: "Hair salon",
  currentBookingSystem: "Fresha",
  cancellationVolume: "3 to 5 per week",
  preferredTimeMessage: "Weekday mornings.",
  consentSmsEmail: true,
  website: ""
};

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
});

describe("book call request API route", () => {
  it("returns clean validation errors", async () => {
    const response = await POST(
      jsonRequest({
        ...validPayload,
        fullName: "",
        email: "bad",
        consentSmsEmail: false
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      code: "VALIDATION_ERROR",
      fields: expect.objectContaining({
        fullName: expect.any(String),
        email: expect.any(String),
        consentSmsEmail: expect.any(String)
      })
    });
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("does not insert honeypot submissions and returns neutral success", async () => {
    const response = await POST(
      jsonRequest({
        ...validPayload,
        website: "https://spam.example"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ ok: true });
  });

  it("returns a controlled server error when service access is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await POST(jsonRequest(validPayload));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      code: "SERVER_ERROR"
    });
    expect(JSON.stringify(body)).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(JSON.stringify(body)).not.toContain("stack");
  });
});
