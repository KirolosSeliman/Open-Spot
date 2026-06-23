import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { dashboardReplies } from "@/lib/dashboard/mock-data";
import { dashboardCopy } from "@/lib/i18n/dashboard-copy";

const operationsDataSource = readFileSync(
  join(process.cwd(), "src", "lib", "dashboard", "operations-data.ts"),
  "utf8"
);
const responsesPageSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "responses", "page.tsx"),
  "utf8"
);

describe("dashboard SMS replies", () => {
  it("keeps replies ordered by exact inbound timestamp ascending", () => {
    const timestamps = dashboardReplies.map((reply) =>
      new Date(reply.receivedAt).getTime()
    );

    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
    expect(dashboardReplies.map((reply) => reply.order)).toEqual([1, 2, 3]);
  });

  it("stores the raw inbound reply separately from interpretation metadata", () => {
    expect(dashboardReplies[0]?.rawBody).toBe("Oui, je peux venir !");
    expect(dashboardReplies[1]?.rawBody).toBe("Oui, dispo à 14h30");
    expect(dashboardReplies[2]?.rawBody).toBe("Merci mais pas dispo aujourd'hui");
    expect(dashboardReplies[0]?.normalizedIntent).toBe("positive");
  });

  it("loads linked inbound SMS replies from organization-scoped Supabase data", () => {
    expect(operationsDataSource).toContain('.from("sms_messages")');
    expect(operationsDataSource).toContain('.eq("direction", "inbound")');
    expect(operationsDataSource).toContain("classifyInboundSmsBody");
    expect(operationsDataSource).toContain("lastInboundBody");
    expect(responsesPageSource).toContain("customer.replyClassification");
    expect(responsesPageSource).toContain("item.classification");
    expect(responsesPageSource).toContain(
      "copy.responses.labels.awaitingManualValidation"
    );
    expect(dashboardCopy.fr.responses.labels.awaitingManualValidation).toBe(
      "En attente de validation manuelle"
    );
  });
});
