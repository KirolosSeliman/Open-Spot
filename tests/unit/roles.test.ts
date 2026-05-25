import { describe, expect, it } from "vitest";

import {
  canManageCustomers,
  canManageOrganizationSettings,
  canManageServices,
  canValidateBookings
} from "@/lib/organization/permissions";

describe("organization permissions", () => {
  it("keeps staff permissions conservative", () => {
    expect(canManageOrganizationSettings("staff")).toBe(false);
    expect(canManageServices("staff")).toBe(false);
    expect(canManageCustomers("staff")).toBe(false);
    expect(canValidateBookings("staff")).toBe(true);
  });

  it("allows owner and manager to manage setup data", () => {
    expect(canManageOrganizationSettings("owner")).toBe(true);
    expect(canManageServices("manager")).toBe(true);
    expect(canManageCustomers("manager")).toBe(true);
  });
});
