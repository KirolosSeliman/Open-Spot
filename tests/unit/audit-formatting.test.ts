import { describe, expect, it } from "vitest";

import {
  formatAuditActionLabel,
  getAuditCategory,
  getAuditImportance,
  maskAuditEntityId
} from "@/lib/admin/audit-formatting";

describe("audit formatting", () => {
  it("maps admin.organization.sms_viewed", () => {
    expect(formatAuditActionLabel("admin.organization.sms_viewed")).toBe(
      "Page SMS consultée"
    );
    expect(getAuditCategory("admin.organization.sms_viewed")).toBe("sms");
    expect(getAuditImportance("admin.organization.sms_viewed")).toBe("view");
  });

  it("maps billing.payment_reminder_sent", () => {
    expect(formatAuditActionLabel("billing.payment_reminder_sent")).toBe(
      "Rappel de paiement envoyé"
    );
    expect(getAuditCategory("billing.payment_reminder_sent")).toBe("billing");
    expect(getAuditImportance("billing.payment_reminder_sent")).toBe("critical");
  });

  it("maps sms.opt_out.received", () => {
    expect(getAuditCategory("sms.opt_out.received")).toBe("compliance");
    expect(getAuditImportance("sms.opt_out.received")).toBe("critical");
  });

  it("maps sms.positive_reply.received", () => {
    expect(getAuditCategory("sms.positive_reply.received")).toBe("sms");
    expect(getAuditImportance("sms.positive_reply.received")).toBe("normal");
  });

  it("humanizes unknown actions without crashing", () => {
    expect(formatAuditActionLabel("custom.unknown_action.test")).toBe(
      "Unknown Action Test"
    );
  });

  it("masks entity ids", () => {
    expect(maskAuditEntityId(null)).toBe("—");
    expect(maskAuditEntityId("short-id")).toBe("short-id");
    expect(maskAuditEntityId("c47fde07-1234-5678-9abc-def012345678")).toBe(
      "c47fde07…5678"
    );
  });
});
