import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const appointmentsPageSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "appointments", "page.tsx"),
  "utf8"
);

describe("appointments page layout", () => {
  it("uses the calendar shell and query-driven calendar views", () => {
    expect(appointmentsPageSource).toContain("AppointmentsCalendarShell");
    expect(appointmentsPageSource).toContain('view: params.view');
    expect(appointmentsPageSource).toContain('date: params.date');
  });

  it("loads upcoming appointments separately from calendar range data", () => {
    expect(appointmentsPageSource).toContain("upcomingAppointments");
    expect(appointmentsPageSource).toContain("calendarAppointments");
  });
});
