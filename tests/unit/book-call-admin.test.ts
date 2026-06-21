import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  calculateBookCallRequestStats,
  filterBookCallRequests,
  type BookCallRequestRow
} from "@/lib/book-call/admin";
import {
  bookCallRequestStatuses,
  validateBookCallRequestStatus
} from "@/lib/book-call/validation";

function request(overrides: Partial<BookCallRequestRow>): BookCallRequestRow {
  return {
    id: crypto.randomUUID(),
    locale: "fr",
    full_name: "Sarah Martin",
    business_name: "Studio Elise",
    email: "sarah@studioelise.com",
    phone: "(514) 555-0198",
    business_type: "Salon de coiffure",
    current_booking_system: "Fresha",
    cancellation_volume: "3 à 5 par semaine",
    preferred_time_message: "Mardi matin.",
    consent_sms_email: true,
    status: "new",
    source_path: "/book-call/questions",
    source_url: null,
    user_agent: null,
    internal_notes: null,
    created_at: "2026-06-20T12:00:00.000Z",
    updated_at: "2026-06-20T12:00:00.000Z",
    contacted_at: null,
    ...overrides
  };
}

describe("book call admin", () => {
  it("allows only the production status set", () => {
    expect(bookCallRequestStatuses).toEqual([
      "new",
      "contacted",
      "qualified",
      "closed",
      "spam"
    ]);
    expect(validateBookCallRequestStatus("qualified")).toBe("qualified");
    expect(validateBookCallRequestStatus("call_booked")).toBeNull();
    expect(validateBookCallRequestStatus("archived")).toBeNull();
  });

  it("calculates dashboard counters and filters reviewed rows", () => {
    const rows = [
      request({ status: "new" }),
      request({ status: "contacted" }),
      request({ status: "qualified", business_name: "Clinique Nova" }),
      request({ status: "closed" }),
      request({ status: "spam" })
    ];

    expect(calculateBookCallRequestStats(rows)).toEqual({
      total: 5,
      new: 1,
      contacted: 1,
      qualified: 1
    });
    expect(filterBookCallRequests(rows, { status: "qualified" })).toHaveLength(1);
    expect(filterBookCallRequests(rows, { q: "nova" })[0].business_name).toBe(
      "Clinique Nova"
    );
  });

  it("keeps the admin loader behind platform admin protection", () => {
    const adminPage = readFileSync(
      join(process.cwd(), "src", "app", "admin", "call-requests", "page.tsx"),
      "utf8"
    );
    const adminActions = readFileSync(
      join(process.cwd(), "src", "app", "admin", "call-requests", "actions.ts"),
      "utf8"
    );
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260620170000_create_book_call_requests.sql"
      ),
      "utf8"
    );

    expect(adminPage).toContain("requireCurrentPlatformAdmin");
    expect(adminActions).toContain("requireCurrentPlatformAdmin");
    expect(migration).toContain("alter table public.book_call_requests enable row level security");
    expect(migration).not.toContain("for select to anon");
    expect(migration).not.toContain("for select to public");
  });
});
