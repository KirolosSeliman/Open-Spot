import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const appointmentsPageSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "appointments", "page.tsx"),
  "utf8"
);

describe("appointments page layout", () => {
  it("stacks datetime fields in a flexible group instead of forcing narrow columns", () => {
    expect(appointmentsPageSource).toContain(
      'className="grid min-w-0 gap-4 lg:col-span-2"'
    );
    expect(appointmentsPageSource).toContain("w-full min-w-0 rounded-xl");
    expect(appointmentsPageSource).not.toContain("md:grid-cols-6");
    expect(appointmentsPageSource).not.toContain("min-w-[18rem]");
  });

  it("keeps notes labels directly attached to textareas", () => {
    expect(appointmentsPageSource).toContain("<textarea");
    expect(appointmentsPageSource).toContain('name="notes"');
    expect(appointmentsPageSource).toContain("content-start gap-2");
  });

  it("does not show internal reminder or confirmation statuses as main badges", () => {
    expect(appointmentsPageSource).toContain("formatAppointmentStatus");
    expect(appointmentsPageSource).toContain("formatReminderState");
    expect(appointmentsPageSource).not.toContain(
      "<StatusBadge>{appointment.status}</StatusBadge>"
    );
    expect(appointmentsPageSource).not.toContain(
      "<StatusBadge>{appointment.reminder_status}</StatusBadge>"
    );
    expect(appointmentsPageSource).not.toContain(
      "<StatusBadge>{appointment.confirmation_status}</StatusBadge>"
    );
  });
});
