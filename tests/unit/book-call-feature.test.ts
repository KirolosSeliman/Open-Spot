import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("book call request feature", () => {
  it("ships an additive secure book_call_requests migration", () => {
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260620170000_create_book_call_requests.sql"
    );

    expect(existsSync(migrationPath)).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("create table if not exists public.book_call_requests");
    expect(migration).toContain("consent_sms_email boolean not null default false");
    expect(migration).toContain("check (consent_sms_email is true)");
    expect(migration).toContain("book_call_requests_created_at_idx");
    expect(migration).toContain("book_call_requests_status_idx");
    expect(migration).toContain("book_call_requests_email_idx");
    expect(migration).toContain("alter table public.book_call_requests enable row level security");
    expect(migration).toContain("revoke all privileges on table public.book_call_requests from anon");
    expect(migration).not.toContain("create policy");
  });

  it("uses the dedicated public form and API route", () => {
    const questionsPage = source("src/app/book-call/questions/page.tsx");
    const bookingPage = source("src/components/marketing/open-spot-booking-page.tsx");
    const form = source("src/components/marketing/book-call-request-form.tsx");
    const route = source("src/app/api/book-call-requests/route.ts");
    const legacyBookCallPage = source("src/app/book-call/page.tsx");

    expect(questionsPage).toContain('<OpenSpotBookingPage kind="questions"');
    expect(bookingPage).toContain("Parlons de vos annulations.");
    expect(bookingPage).toContain("Let's talk about your cancellations.");
    expect(bookingPage).toContain("<BookCallRequestForm");
    expect(form).toContain("Nom complet");
    expect(form).toContain("Message / preferred time");
    expect(form).toContain("I agree to be contacted by Open Spot by SMS and email");
    expect(form).toContain('name="website"');
    expect(form).toContain('fetch("/api/book-call-requests"');
    expect(form).toContain("Request received. We'll follow up soon.");
    expect(form).not.toContain("Your call is booked");
    expect(route).toContain("validateBookCallRequestInput");
    expect(route).toContain("createSupabaseServiceClient");
    expect(route).toContain('code: "VALIDATION_ERROR"');
    expect(route).toContain('code: "SERVER_ERROR"');
    expect(route).not.toContain("sendSms");
    expect(route).not.toContain("twilio");
    expect(legacyBookCallPage).toContain('redirect("/book-call/questions")');
  });

  it("does not render the generic failure message before a failed submit", () => {
    const form = source("src/components/marketing/book-call-request-form.tsx");
    const returnMarkup = form.slice(form.indexOf("return ("), form.lastIndexOf("</form>"));

    expect(form).toContain(
      "Something went wrong. Please check your information and try again."
    );
    expect(returnMarkup).toContain("{formError ?");
    expect(returnMarkup).not.toContain(
      "<p>Something went wrong. Please check your information and try again.</p>"
    );
  });

  it("ships a protected admin call request surface with manual follow-up actions", () => {
    const adminPage = source("src/app/admin/call-requests/page.tsx");
    const adminTable = source("src/components/admin/call-requests-table.tsx");
    const adminActions = source("src/app/admin/call-requests/actions.ts");
    const adminLayout = source("src/app/admin/layout.tsx");
    const legacyAdminPage = source("src/app/admin/potential-clients/page.tsx");

    expect(adminPage).toContain("requireCurrentPlatformAdmin");
    expect(adminPage).toContain("loadBookCallRequests");
    expect(adminPage).toContain("Demandes d'appel");
    expect(adminTable).toContain("mailto:");
    expect(adminTable).toContain("tel:");
    expect(adminTable).toContain("sms:");
    expect(adminTable).toContain("updateBookCallRequestAction");
    expect(adminActions).toContain("requireCurrentPlatformAdmin");
    expect(adminActions).toContain("validateBookCallRequestStatus");
    expect(adminLayout).toContain('href="/admin/call-requests"');
    expect(legacyAdminPage).toContain('redirect("/admin/call-requests")');
  });
});
