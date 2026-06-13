import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("sign out UI", () => {
  it("uses the server sign out action for dashboard and admin logout buttons", () => {
    const authActions = readFileSync(
      join(process.cwd(), "src", "lib", "auth", "actions.ts"),
      "utf8"
    );
    const dashboardShell = readFileSync(
      join(process.cwd(), "src", "components", "dashboard", "dashboard-shell.tsx"),
      "utf8"
    );
    const adminPage = readFileSync(
      join(process.cwd(), "src", "app", "admin", "page.tsx"),
      "utf8"
    );

    expect(authActions).toContain("export async function signOutAction");
    expect(authActions).toContain("supabase.auth.signOut()");
    expect(authActions).toContain('redirect("/sign-in")');

    expect(dashboardShell).toContain("signOutAction");
    expect(dashboardShell).toContain("Déconnexion");
    expect(dashboardShell).toContain("<form action={signOutAction}");

    expect(adminPage).toContain("signOutAction");
    expect(adminPage).toContain("Déconnexion");
    expect(adminPage).toContain("<form action={signOutAction}");
  });
});
