import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildAppointmentCreateInput,
  buildAppointmentUpdateInput,
  buildCustomerCreateInput,
  buildCustomerUpdateInput,
  buildServiceCreateInput,
  buildServiceUpdateInput,
  buildWaitlistCreateInput,
  parsePriceToCents
} from "@/lib/dashboard/forms";

describe("dashboard operational forms", () => {
  it("validates service input and converts dollars to cents", () => {
    expect(parsePriceToCents("55.50")).toBe(5550);
    expect(
      buildServiceCreateInput({
        name: "Coupe",
        durationMinutes: "45",
        normalPrice: "55.50",
        active: "on",
        organizationId: "browser_org"
      })
    ).toEqual({
      ok: true,
      value: {
        name: "Coupe",
        description: null,
        durationMinutes: 45,
        normalPriceCents: 5550,
        active: true
      }
    });
  });

  it("rejects invalid service input", () => {
    expect(
      buildServiceCreateInput({
        name: "",
        durationMinutes: "0",
        normalPrice: "-1"
      })
    ).toEqual({
      ok: false,
      errors: [
        "Service name is required.",
        "Duration must be a positive whole number of minutes.",
        "Price must be a positive amount."
      ]
    });
  });

  it("validates service updates without accepting browser organization id", () => {
    expect(
      buildServiceUpdateInput({
        serviceId: "service_1",
        name: "Coloration",
        description: "Racines et gloss",
        durationMinutes: "90",
        normalPrice: "125",
        active: "on",
        organizationId: "browser_org"
      })
    ).toEqual({
      ok: true,
      value: {
        serviceId: "service_1",
        name: "Coloration",
        description: "Racines et gloss",
        durationMinutes: 90,
        normalPriceCents: 12500,
        active: true
      }
    });
  });

  it("rejects service updates without a service id", () => {
    expect(
      buildServiceUpdateInput({
        serviceId: "",
        name: "Coloration",
        durationMinutes: "90",
        normalPrice: "125"
      })
    ).toEqual({
      ok: false,
      errors: ["Service id is required."]
    });
  });

  it("validates customer input, normalizes phone, and ignores browser organization id", () => {
    expect(
      buildCustomerCreateInput({
        fullName: "Maya Tremblay",
        phoneCountry: "+1",
        phoneNational: "514-249-4425",
        email: " MAYA@example.com ",
        preferredLanguage: "fr",
        consentStatus: "opted_in",
        serviceId: "service_1",
        addToWaitlist: "on",
        organizationId: "browser_org"
      })
    ).toEqual({
      ok: true,
      value: {
        fullName: "Maya Tremblay",
        phoneE164: "+15142494425",
        email: "maya@example.com",
        preferredLanguage: "fr",
        notes: null,
        consentStatus: "opted_in",
        serviceId: "service_1",
        addToWaitlist: true
      }
    });
  });

  it("validates customer updates by id and normalizes edited phone input", () => {
    expect(
      buildCustomerUpdateInput({
        customerId: "customer_1",
        fullName: "Kirolos",
        phoneCountry: "+1",
        phoneNational: "514-249-4425",
        email: "kirolos@example.com",
        preferredLanguage: "fr",
        consentStatus: "opted_in",
        hasConsentProof: "on",
        organizationId: "browser_org"
      })
    ).toEqual({
      ok: true,
      value: {
        customerId: "customer_1",
        fullName: "Kirolos",
        phoneE164: "+15142494425",
        email: "kirolos@example.com",
        preferredLanguage: "fr",
        notes: null,
        consentStatus: "opted_in"
      }
    });

    expect(
      buildCustomerUpdateInput({
        customerId: "",
        fullName: "",
        phoneCountry: "+1",
        phoneNational: "555",
        preferredLanguage: "es"
      })
    ).toEqual({
      ok: false,
      errors: [
        "Client id is required.",
        "Client name is required.",
        "Enter a valid 10-digit Canadian or US phone number.",
        "Preferred language must be French or English."
      ]
    });
  });

  it("keeps customer update action scoped to selected id and blocks duplicate phones", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "actions.ts"),
      "utf8"
    );

    expect(source).toContain("export async function updateCustomerAction");
    const updateSource = source.slice(
      source.indexOf("export async function updateCustomerAction"),
      source.indexOf("export async function createWaitlistEntryAction")
    );

    expect(source).toContain('formData.get("customerId")');
    expect(source).toContain(".eq(\"id\", input.value.customerId)");
    expect(source).toContain(".neq(\"id\", input.value.customerId)");
    expect(source).toContain("Another client already uses this phone number.");
    expect(source).toContain("record_customer_update_audit");
    expect(source).toContain("phone_changed");
    expect(source).toContain("onConflict: \"organization_id,customer_id\"");
    expect(updateSource).not.toContain("source: \"manual\"");
  });

  it("uses a role-checked RPC for customer update audit rows", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260603213000_record_customer_update_audit_rpc.sql"
      ),
      "utf8"
    );

    expect(migration).toContain(
      "create or replace function public.record_customer_update_audit"
    );
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("private.has_org_role");
    expect(migration).toContain("'owner', 'manager', 'staff'");
    expect(migration).toContain("insert into public.audit_logs");
    expect(migration).toContain("'customer.updated'");
    expect(migration).toContain(
      "grant execute on function public.record_customer_update_audit"
    );
    expect(migration).not.toMatch(
      /on public\.audit_logs for (?:insert|update|delete) to authenticated/i
    );
  });

  it("validates waitlist input without accepting organization id", () => {
    expect(
      buildWaitlistCreateInput({
        customerId: "customer_1",
        serviceId: "",
        status: "active",
        preferredDays: ["monday", "", "friday"],
        preferredTimeWindows: ["afternoon"],
        discountInterest: "on",
        organizationId: "browser_org"
      })
    ).toEqual({
      ok: true,
      value: {
        customerId: "customer_1",
        serviceId: null,
        status: "active",
        preferredDays: ["monday", "friday"],
        preferredTimeWindows: ["afternoon"],
        discountInterest: true,
        notes: null
      }
    });
  });

  it("validates appointment input and ignores browser organization id", () => {
    expect(
      buildAppointmentCreateInput({
        customerId: "customer_1",
        serviceId: "service_1",
        startsAt: "2026-06-01T14:00",
        endsAt: "2026-06-01T15:00",
        timezone: "America/Toronto",
        notes: "Prefers text reminders",
        sendReminder: "on",
        requestConfirmation: "on",
        organizationId: "browser_org"
      })
    ).toEqual({
      ok: true,
      value: {
        customerId: "customer_1",
        serviceId: "service_1",
        startsAt: "2026-06-01T14:00",
        endsAt: "2026-06-01T15:00",
        timezone: "America/Toronto",
        notes: "Prefers text reminders",
        sendReminder: true,
        requestConfirmation: true
      }
    });
  });

  it("uses the visible appointment status model and preserves reminder flags", () => {
    expect(
      buildAppointmentUpdateInput({
        appointmentId: "appointment_1",
        customerId: "customer_1",
        serviceId: "service_1",
        startsAt: "2026-06-01T14:00",
        endsAt: "2026-06-01T15:00",
        timezone: "America/Toronto",
        status: "not_yet_confirmed",
        confirmationStatus: "pending",
        sendReminder: "on",
        requestConfirmation: "on"
      })
    ).toEqual({
      ok: true,
      value: {
        appointmentId: "appointment_1",
        customerId: "customer_1",
        serviceId: "service_1",
        startsAt: "2026-06-01T14:00",
        endsAt: "2026-06-01T15:00",
        timezone: "America/Toronto",
        notes: null,
        status: "not_yet_confirmed",
        confirmationStatus: "pending",
        sendReminder: true,
        requestConfirmation: true
      }
    });

    for (const status of ["confirmed", "completed", "no_show"]) {
      expect(
        buildAppointmentUpdateInput({
          appointmentId: "appointment_1",
          customerId: "customer_1",
          startsAt: "2026-06-01T14:00",
          status
        })
      ).toEqual({
        ok: false,
        errors: ["Appointment status is invalid."]
      });
    }
  });

  it("rejects appointment input with missing customer or invalid time order", () => {
    expect(
      buildAppointmentCreateInput({
        customerId: "",
        startsAt: "2026-06-01T15:00",
        endsAt: "2026-06-01T14:00"
      })
    ).toEqual({
      ok: false,
      errors: [
        "Client is required.",
        "Appointment end time must be after the start time."
      ]
    });
  });

  it("dashboard writes derive organization id from the active workspace", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "actions.ts"),
      "utf8"
    );

    expect(source).toContain("getActiveOrganizationWorkspace");
    expect(source).toContain("canManageServices");
    expect(source).toContain("canManageCustomers");
    expect(source).toContain("canValidateBookings");
    expect(source).toContain("!canPerform(workspace.organization.role)");
    expect(source).toContain("organization_id: organization.id");
    expect(source).toContain(".eq(\"organization_id\", organization.id)");
    expect(source).toContain("updateServiceAction");
    expect(source).toContain("toggleServiceActiveAction");
    expect(source).toContain("createAppointmentAction");
    expect(source).toContain("updateAppointmentAction");
    expect(source).toContain(".from(\"scheduled_messages\")");
    expect(source).toContain("consent?.status === \"opted_in\"");
    expect(source).toContain("A client with this phone number already exists.");
    expect(source).not.toContain(".update({\n          full_name: input.value.fullName");
    expect(source).not.toContain('formData.get("organizationId")');
  });
});
