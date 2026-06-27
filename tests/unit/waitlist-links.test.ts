import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildPublicWaitlistUrl } from "@/lib/waitlist/links";
import { buildWaitlistSignupRpcArgs } from "@/lib/waitlist/rpc";
import { createWaitlistSubmissionPayload } from "@/lib/waitlist/submission";

describe("public waitlist links and consent", () => {
  it("builds public and kiosk waitlist links from organization slug", () => {
    expect(
      buildPublicWaitlistUrl({
        baseUrl: "https://app.example.com/",
        slug: "kiroclipz"
      })
    ).toBe("https://app.example.com/b/kiroclipz/waitlist");
    expect(
      buildPublicWaitlistUrl({
        baseUrl: "https://app.example.com/",
        slug: "kiroclipz",
        source: "qr_code"
      })
    ).toBe("https://app.example.com/b/kiroclipz/waitlist?source=qr_code");
    expect(
      buildPublicWaitlistUrl({
        baseUrl: "https://app.example.com/",
        slug: "kiroclipz",
        mode: "kiosk"
      })
    ).toBe("https://app.example.com/b/kiroclipz/waitlist/kiosk");
  });

  it("encodes organization slugs and requires an absolute origin", () => {
    expect(
      buildPublicWaitlistUrl({
        baseUrl: "https://app.example.com",
        slug: "salon/centre ville",
        source: "qr_code"
      })
    ).toBe(
      "https://app.example.com/b/salon%2Fcentre%20ville/waitlist?source=qr_code"
    );

    expect(() =>
      buildPublicWaitlistUrl({
        baseUrl: "",
        slug: "kiroclipz"
      })
    ).toThrow("A valid absolute public app URL is required.");
  });

  it("keeps unsafe origins out of the production QR page", () => {
    const qrPage = readFileSync(
      join(process.cwd(), "src", "app", "dashboard", "qr-code", "page.tsx"),
      "utf8"
    );
    const qrUnavailableState = readFileSync(
      join(
        process.cwd(),
        "src",
        "components",
        "dashboard",
        "qr-link",
        "unavailable-state.tsx"
      ),
      "utf8"
    );

    expect(qrPage).toContain("getPublicAppOrigin");
    expect(qrPage).toContain("canRenderPublicLinks");
    expect(qrPage).toContain("PublicOriginConfigState");
    expect(qrUnavailableState).toContain("Les liens publics ne sont pas prets");
    expect(qrPage).not.toContain("http://localhost:3000");
  });

  it("requires explicit consent before public waitlist opt-in", () => {
    expect(
      createWaitlistSubmissionPayload({
        organizationSlug: "kiroclipz",
        fullName: "Maya",
        phone: "5142494425",
        preferredLanguage: "fr",
        signupSource: "kiosk",
        consentAccepted: false
      })
    ).toEqual({
      ok: false,
      errors: ["SMS consent is required to join the waitlist."]
    });
  });

  it("builds kiosk RPC args without accepting a browser organization id", () => {
    const parsed = createWaitlistSubmissionPayload({
      organizationSlug: "kiroclipz",
      fullName: "Maya",
      phoneCountry: "+1",
      phoneNational: "5142494425",
      preferredLanguage: "fr",
      serviceIds: [
        "69de94b6-a1c1-4ebd-8c58-949584843e88",
        "69de94b6-a1c1-4ebd-8c58-949584843e88",
        "",
        "e30acd47-462a-4e51-b73f-edc34415dc45"
      ],
      consentAccepted: true,
      signupSource: "kiosk"
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(buildWaitlistSignupRpcArgs(parsed.payload)).toMatchObject({
      organization_slug: "kiroclipz",
      customer_full_name: "Maya",
      customer_phone_e164: "+15142494425",
      consent_accepted: true,
      service_ids: [
        "69de94b6-a1c1-4ebd-8c58-949584843e88",
        "e30acd47-462a-4e51-b73f-edc34415dc45"
      ],
      signup_source: "kiosk"
    });
    expect(buildWaitlistSignupRpcArgs(parsed.payload)).not.toHaveProperty(
      "organization_id"
    );
  });

  it("submits waitlist signups through a server route with service-role isolated to server code", () => {
    const routeHandler = readFileSync(
      join(process.cwd(), "src", "app", "api", "waitlist", "route.ts"),
      "utf8"
    );
    const rpcBuilder = readFileSync(
      join(process.cwd(), "src", "lib", "waitlist", "rpc.ts"),
      "utf8"
    );

    expect(routeHandler).toContain("createSupabaseServiceClient");
    expect(routeHandler).toContain("register_waitlist_signup");
    expect(rpcBuilder).toContain("consent_accepted");
    expect(routeHandler).not.toContain("createSupabasePublicServerClient");
    expect(routeHandler).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(routeHandler).not.toContain(
      "Waitlist storage is not configured for this environment."
    );
    expect(routeHandler).not.toContain("organization_id");
  });

  it("rejects malformed service ids before calling the database RPC", () => {
    expect(
      createWaitlistSubmissionPayload({
        organizationSlug: "kiroclipz",
        fullName: "Maya",
        phone: "5142494425",
        preferredLanguage: "fr",
        serviceIds: ["not-a-uuid"],
        consentAccepted: true
      })
    ).toEqual({
      ok: false,
      errors: ["Selected service ids are invalid."]
    });
  });

  it("falls back unknown signup sources to public_link", () => {
    const parsed = createWaitlistSubmissionPayload({
      organizationSlug: "kiroclipz",
      fullName: "Maya",
      phone: "5142494425",
      preferredLanguage: "fr",
      consentAccepted: true,
      signupSource: "external"
    });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.payload.signupSource).toBe("public_link");
    }
  });

  it("keeps kiosk page public and free of dashboard/private data reads", () => {
    const kioskPage = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "b",
        "[slug]",
        "waitlist",
        "kiosk",
        "page.tsx"
      ),
      "utf8"
    );
    const waitlistForm = readFileSync(
      join(
        process.cwd(),
        "src",
        "components",
        "forms",
        "waitlist-preview.tsx"
      ),
      "utf8"
    );
    const phoneField = readFileSync(
      join(
        process.cwd(),
        "src",
        "components",
        "forms",
        "phone-number-field.tsx"
      ),
      "utf8"
    );

    expect(kioskPage).toContain('signupSource="kiosk"');
    expect(kioskPage).not.toContain("getActiveOrganizationWorkspace");
    expect(kioskPage).not.toContain("dashboard");
    expect(waitlistForm).toContain("formRef.current?.reset()");
    expect(waitlistForm).toContain("PhoneNumberField");
    expect(phoneField).toContain('countryName = "phoneCountry"');
    expect(phoneField).toContain('nationalName = "phoneNational"');
    expect(waitlistForm).toContain("consentAccepted");
    expect(waitlistForm).not.toContain("defaultChecked");
  });

  it("loads active public services and renders them as checkbox choices", () => {
    const publicProfile = readFileSync(
      join(process.cwd(), "src", "lib", "waitlist", "public-profile.ts"),
      "utf8"
    );
    const waitlistPage = readFileSync(
      join(process.cwd(), "src", "app", "b", "[slug]", "waitlist", "page.tsx"),
      "utf8"
    );
    const waitlistForm = readFileSync(
      join(
        process.cwd(),
        "src",
        "components",
        "forms",
        "waitlist-preview.tsx"
      ),
      "utf8"
    );

    expect(publicProfile).toContain("get_public_waitlist_signup_data");
    expect(publicProfile).not.toContain("createSupabaseServiceClient");
    expect(publicProfile).toContain("return null");
    expect(publicProfile).toContain("isPublicWaitlistSignupData");
    expect(waitlistPage).toContain('export const dynamic = "force-dynamic"');
    expect(waitlistPage).toContain("notFound()");
    expect(waitlistPage).toContain("services={profile.services}");
    expect(waitlistForm).toContain('name="serviceIds"');
    expect(waitlistForm).toContain('type="checkbox"');
    expect(waitlistForm).toContain("Which services are you interested in?");
  });

  it("client dashboard exposes an explicit edit route and prefilled edit form", () => {
    const clientsPage = readFileSync(
      join(process.cwd(), "src", "app", "dashboard", "clients", "page.tsx"),
      "utf8"
    );
    const editPage = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "dashboard",
        "clients",
        "[id]",
        "edit",
        "page.tsx"
      ),
      "utf8"
    );

    expect(clientsPage).toContain("Actions");
    expect(clientsPage).toContain("/dashboard/clients/${customer.id}/edit");
    expect(editPage).toContain("loadCustomerEditData");
    expect(editPage).toContain("updateCustomerAction");
    expect(editPage).toContain('name="customerId"');
    expect(editPage).toContain("PhoneNumberField");
    expect(editPage).toContain("defaultValue={customer.full_name}");
    expect(editPage).toContain("searchParams");
  });

  it("revalidates public waitlist pages when merchant services change", () => {
    const dashboardActions = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "actions.ts"),
      "utf8"
    );

    expect(dashboardActions).toContain("revalidateServiceSurfaces");
    expect(dashboardActions).toContain("revalidatePath(`/b/${slug}/waitlist`)");
    expect(dashboardActions).toContain(
      "revalidatePath(`/b/${slug}/waitlist/kiosk`)"
    );
  });

  it("uses a narrow public RPC for service display without anon table reads", () => {
    const publicRpcMigration = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260528175000_public_waitlist_signup_data_rpc.sql"
      ),
      "utf8"
    );

    expect(publicRpcMigration).toContain(
      "create or replace function public.get_public_waitlist_signup_data"
    );
    expect(publicRpcMigration).toContain("security definer");
    expect(publicRpcMigration).toContain("set search_path = ''");
    expect(publicRpcMigration).toContain("and s.active = true");
    expect(publicRpcMigration).toContain(
      "grant execute on function public.get_public_waitlist_signup_data(text)"
    );
    expect(publicRpcMigration).toContain("to anon, authenticated, service_role");
    expect(publicRpcMigration).not.toContain("from public.customers");
    expect(publicRpcMigration).not.toContain("from public.waitlist_entries");
    expect(publicRpcMigration).not.toContain("from public.sms_messages");
    expect(publicRpcMigration).not.toMatch(/\bdrop\s+table\b|\btruncate\b|\bdelete\s+from\b/i);
  });

  it("removes public preferred days and discount interest fields while keeping SMS consent", () => {
    const waitlistForm = readFileSync(
      join(
        process.cwd(),
        "src",
        "components",
        "forms",
        "waitlist-preview.tsx"
      ),
      "utf8"
    );

    expect(waitlistForm).not.toContain("preferredDays");
    expect(waitlistForm).not.toContain("discountInterest");
    expect(waitlistForm).not.toContain("last-minute offers or discounts");
    expect(waitlistForm).toContain("consentAccepted");
    expect(waitlistForm).toContain("does not automatically confirm");
    expect(waitlistForm).toContain("STOP or ARRET");
    expect(waitlistForm).toContain(
      "This business has not configured service options yet."
    );
  });

  it("waitlist dashboard renders selected service interests as chips", () => {
    const waitlistPage = readFileSync(
      join(process.cwd(), "src", "app", "dashboard", "waitlist", "page.tsx"),
      "utf8"
    );
    const operationsData = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "operations-data.ts"),
      "utf8"
    );

    expect(operationsData).toContain(".from(\"waitlist_entry_services\")");
    expect(operationsData).toContain("serviceInterestNames");
    expect(waitlistPage).toContain("Liste générale");
    expect(waitlistPage).toContain("serviceInterestNames.map");
  });
});
