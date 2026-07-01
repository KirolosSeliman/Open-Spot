import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("organization SMS send guards", () => {
  const organizationSmsSource = readFileSync(
    join(process.cwd(), "src/lib/sms/organization-sms.ts"),
    "utf8"
  );
  const consentRequestSource = readFileSync(
    join(process.cwd(), "src/lib/sms/consent-request.ts"),
    "utf8"
  );
  const dashboardActionsSource = readFileSync(
    join(process.cwd(), "src/lib/dashboard/actions.ts"),
    "utf8"
  );
  const openingConfirmationSource = readFileSync(
    join(process.cwd(), "src/lib/sms/opening-confirmation.ts"),
    "utf8"
  );
  const bookCallRouteSource = readFileSync(
    join(process.cwd(), "src/app/api/book-call-requests/route.ts"),
    "utf8"
  );
  const waitlistRouteSource = readFileSync(
    join(process.cwd(), "src/app/api/waitlist/route.ts"),
    "utf8"
  );
  const signInPageSource = readFileSync(
    join(process.cwd(), "src/app/sign-in/page.tsx"),
    "utf8"
  );
  const inboundHandlerSource = readFileSync(
    join(process.cwd(), "src/lib/sms/inbound-handler.ts"),
    "utf8"
  );

  it("allows consent_request sends only for needs_consent recipients", () => {
    expect(organizationSmsSource).toContain('messageType === "consent_request"');
    expect(organizationSmsSource).toContain('consentStatus === "needs_consent"');
    expect(consentRequestSource).toContain('message_type: "consent_request"');
    expect(consentRequestSource).toContain('consentStatus: "needs_consent"');
    expect(consentRequestSource).toContain('reason: "opted_out"');
  });

  it("enforces SMS quotas before any provider send", () => {
    const sendFunctionBody = organizationSmsSource.slice(
      organizationSmsSource.indexOf("export async function sendOrganizationSms")
    );
    const limitsIndex = sendFunctionBody.indexOf("assertSmsWithinOrganizationLimits");
    const simulatorIndex = sendFunctionBody.indexOf(
      "if (usesOrganizationSmsSimulator(env)) {"
    );

    expect(limitsIndex).toBeGreaterThan(-1);
    expect(simulatorIndex).toBeGreaterThan(limitsIndex);
    expect(organizationSmsSource).toContain("canSendSmsWithinLimits");
  });

  it("persists outbound SMS rows before provider sends", () => {
    expect(dashboardActionsSource).toContain('status: "pending_send"');
    expect(dashboardActionsSource).toContain("sendOrganizationSms");
    expect(openingConfirmationSource).toContain('status: "pending_send"');
    expect(consentRequestSource).toContain('status: "pending_send"');
  });

  it("throttles public lead and waitlist submissions by IP and identity keys", () => {
    expect(bookCallRouteSource).toContain("book-call:${getRequestIp(request)}");
    expect(bookCallRouteSource).toContain("book-call:email:");
    expect(bookCallRouteSource).toContain("book-call:phone:");
    expect(waitlistRouteSource).toContain("waitlist:${requestIp}:");
    expect(waitlistRouteSource).toContain("waitlist:phone:");
  });

  it("routes HELP and UNSTOP inbound keywords to auditable actions", () => {
    expect(inboundHandlerSource).toContain('classification === "sms_help"');
    expect(inboundHandlerSource).toContain('classification === "sms_unstop"');
    expect(inboundHandlerSource).toContain("sms.help.received");
    expect(inboundHandlerSource).toContain("sms.unstop.opted_in");
  });

  it("exposes password recovery on a dedicated forgot-password page", () => {
    const forgotPasswordPage = readFileSync(
      join(process.cwd(), "src", "app", "forgot-password", "page.tsx"),
      "utf8"
    );

    expect(signInPageSource).toContain('href="/forgot-password"');
    expect(signInPageSource).not.toContain("ResendAuthEmailForm");
    expect(forgotPasswordPage).toContain("ResendAuthEmailForm");
    expect(forgotPasswordPage).toContain('defaultMode="recovery"');
    expect(forgotPasswordPage).toContain("Mot de passe oublié ?");
  });
});
