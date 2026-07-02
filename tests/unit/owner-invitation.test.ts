import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("company owner invitation resend", () => {
  it("uses anon auth client for recovery emails instead of service role only", () => {
    const ownerInvitation = source("src/lib/admin/owner-invitation.ts");
    const authEmailClient = source("src/lib/auth/auth-email-client.ts");

    expect(authEmailClient).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(ownerInvitation).toContain("createSupabaseAuthEmailClient");
    expect(ownerInvitation).toContain("resetPasswordForEmail");
    expect(ownerInvitation).toContain("inviteUserByEmail");
    expect(ownerInvitation).toContain('type: "signup"');
  });

  it("builds callback redirect through site url helper", () => {
    const invitationUrl = source("src/lib/book-call/invitation-url.ts");
    const siteUrl = source("src/lib/auth/site-url.ts");
    const sharedSiteUrl = source("src/lib/site-url.ts");

    expect(invitationUrl).toContain("buildAuthCallbackUrl");
    expect(siteUrl).toContain("resolveConfiguredSiteUrl");
    expect(sharedSiteUrl).toContain("PRODUCTION_SITE_URL");
    expect(sharedSiteUrl).toContain("https://open-spot.ca");
    expect(siteUrl).toContain("/auth/callback?next=");
  });

  it("returns structured success and error results to the admin UI", () => {
    const ownerInvitation = source("src/lib/admin/owner-invitation.ts");
    const button = source("src/components/admin/resend-owner-invitation-button.tsx");

    expect(ownerInvitation).toContain('ok: true');
    expect(ownerInvitation).toContain('method: "invite"');
    expect(ownerInvitation).toContain('code: "rate_limited"');
    expect(button).toContain("result.ok");
    expect(button).toContain("Envoi en cours");
  });
});
