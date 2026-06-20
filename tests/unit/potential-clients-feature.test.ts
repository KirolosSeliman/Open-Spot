import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("potential clients request-call feature", () => {
  it("defines a secure potential_clients table with consent and RLS", () => {
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260620123000_potential_clients_leads.sql"
    );

    expect(existsSync(migrationPath)).toBe(true);
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("create table if not exists public.potential_clients");
    expect(migration).toContain("consent_to_contact boolean not null");
    expect(migration).toContain("consent_text text not null");
    expect(migration).toContain("consented_at timestamptz not null");
    expect(migration).toContain("confirmation_email_status text");
    expect(migration).toContain("owner_notification_status text");
    expect(migration).toContain("alter table public.potential_clients enable row level security");
    expect(migration).toContain("revoke all privileges on table public.potential_clients from anon");
    expect(migration).toContain("potential_clients_created_at_idx");
    expect(migration).toContain("potential_clients_status_idx");
  });

  it("ships a real /book-call page, API route, and protected admin follow-up surface", () => {
    const bookCallPage = source("src/app/book-call/page.tsx");
    const form = source("src/components/marketing/request-call-form.tsx");
    const route = source("src/app/api/potential-clients/route.ts");
    const adminPage = source("src/app/admin/potential-clients/page.tsx");
    const adminLayout = source("src/app/admin/layout.tsx");
    const validation = source("src/lib/potential-clients/validation.ts");

    expect(bookCallPage).toContain("Let's find the right setup for your business.");
    expect(bookCallPage).toContain("Request a 15-minute call");
    expect(bookCallPage).toContain("<RequestCallForm");
    expect(validation).toContain("I agree to be contacted by Open Spot by SMS and email");
    expect(form).toContain("consentText");
    expect(form).toContain('name="company"');
    expect(form).toContain('autoComplete="off"');
    expect(form).toContain("Request received.");
    expect(form).not.toContain("Your call is booked");
    expect(route).toContain("createSupabaseServiceClient");
    expect(route).toContain("validatePotentialClientInput");
    expect(route).toContain("sendPotentialClientConfirmationEmail");
    expect(route).toContain("sendPotentialClientOwnerNotification");
    expect(adminPage).toContain("Potential Clients");
    expect(adminPage).toContain("Review businesses that requested a call");
    expect(adminPage).toContain("requireCurrentPlatformAdmin");
    expect(adminPage).toContain("loadPotentialClients");
    expect(adminPage).toContain("updatePotentialClientAction");
    expect(adminPage).toContain("Reply STOP to opt out.");
    expect(adminLayout).toContain('href="/admin/potential-clients"');
  });

  it("routes sales CTAs to /book-call without fake links", () => {
    const homepage = source("src/components/marketing/lunera-open-spot-template.tsx");
    const pricingPage = source("src/app/pricing/page.tsx");
    const contactPage = source("src/app/contact/page.tsx");

    expect(homepage).toContain('href="/book-call"');
    expect(pricingPage).toContain('href="/book-call"');
    expect(contactPage).toContain('href="/book-call"');
    expect(homepage).not.toContain('href="#"');
    expect(pricingPage).not.toContain('href="#"');
    expect(contactPage).not.toContain('href="#"');
  });
});
