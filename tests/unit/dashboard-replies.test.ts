import { describe, expect, it } from "vitest";

import { dashboardReplies } from "@/lib/dashboard/mock-data";

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
});
