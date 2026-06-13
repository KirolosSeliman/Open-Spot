import { describe, expect, it, vi } from "vitest";

import type { SmsProviderClient } from "@/lib/sms/provider";

const supabaseState = vi.hoisted(() => ({
  client: null as unknown
}));

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: () => supabaseState.client
}));

const { handleInboundSmsRequest } = await import("@/lib/sms/inbound-handler");

type QueryRecord = Record<string, unknown>;

function createQueryResult(data: unknown, error: unknown = null) {
  const builder = {
    data,
    error,
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    not: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve({ data, error })),
    maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
    single: vi.fn(() => Promise.resolve({ data, error }))
  };

  return builder;
}

function createOutboundContextQuery() {
  const notFilters: string[] = [];
  let hasCombinedContextFilter = false;
  const openingContext = {
    organization_id: "org-1",
    customer_id: "customer-1",
    opening_id: "opening-old",
    appointment_id: null
  };
  const appointmentContext = {
    organization_id: "org-1",
    customer_id: "customer-1",
    opening_id: null,
    appointment_id: "appointment-new"
  };
  const resolveRows = () => {
    if (hasCombinedContextFilter) {
      return [appointmentContext];
    }

    if (notFilters.includes("opening_id")) {
      return [openingContext];
    }

    if (notFilters.includes("appointment_id")) {
      return [appointmentContext];
    }

    return [];
  };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    not: vi.fn((column: string) => {
      notFilters.push(column);
      return builder;
    }),
    or: vi.fn(() => {
      hasCombinedContextFilter = true;
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve({ data: resolveRows(), error: null }))
  };

  return builder;
}

function createConsentContextQuery() {
  const consentContext = {
    id: "sms-consent-outbound",
    organization_id: "org-1",
    customer_id: "customer-1",
    opening_id: null,
    appointment_id: null,
    message_type: "consent_request"
  };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    not: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve({ data: [consentContext], error: null }))
  };

  return builder;
}

function createWaitlistContextQuery() {
  const waitlistContext = {
    id: "sms-opening-outbound",
    organization_id: "org-1",
    customer_id: "customer-deleted",
    opening_id: "opening-1",
    appointment_id: null,
    message_type: "opening_alert"
  };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    not: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve({ data: [waitlistContext], error: null }))
  };

  return builder;
}

function createMutationResult(data: unknown = null, error: unknown = null) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => Promise.resolve({ data, error })),
    single: vi.fn(() => Promise.resolve({ data, error })),
    then: vi.fn((resolve) => Promise.resolve({ data, error }).then(resolve))
  };

  return builder;
}

function createUpsertResult(error: unknown = null) {
  return Promise.resolve({ data: null, error });
}

function createProvider(): SmsProviderClient {
  return {
    getProviderName: () => "twilio",
    verifyWebhookSignature: vi.fn(async () => true),
    parseInboundRequest: vi.fn(async () => ({
      from: "+15145550000",
      to: "+15145551234",
      body: "YES",
      providerMessageId: "SM-INBOUND"
    })),
    sendSms: vi.fn()
  };
}

describe("inbound SMS context selection", () => {
  it("uses the newest outbound context across openings and appointments", async () => {
    const fromCalls: string[] = [];
    let smsMessagesFromCount = 0;
    const inserts: QueryRecord[] = [];
    const updatesByTable = new Map<string, QueryRecord[]>();

    const supabase = {
      from: vi.fn((table: string) => {
        fromCalls.push(table);

        if (table === "sms_messages") {
          smsMessagesFromCount += 1;
        }

        if (table === "sms_messages" && smsMessagesFromCount === 1) {
          return createQueryResult(null);
        }

        if (table === "sms_messages" && smsMessagesFromCount === 2) {
          return createOutboundContextQuery();
        }

        return {
          insert: vi.fn((row: QueryRecord) => {
            inserts.push(row);
            return createMutationResult({ id: `${table}-inserted` });
          }),
          update: vi.fn((row: QueryRecord) => {
            updatesByTable.set(table, [
              ...(updatesByTable.get(table) ?? []),
              row
            ]);
            return createMutationResult();
          }),
          select: vi.fn(() => createQueryResult(null)),
          eq: vi.fn(() => createQueryResult(null))
        };
      })
    };

    supabaseState.client = supabase;

    const response = await handleInboundSmsRequest(
      new Request("https://example.com/webhook", { method: "POST" }),
      createProvider()
    );

    const body = await response.json();

    expect(body).toMatchObject({
      classification: "appointment_confirm",
      appointmentId: "appointment-new",
      openingId: null,
      status: "received_linked"
    });
    expect(updatesByTable.get("appointments")).toContainEqual({
      status: "scheduled",
      confirmation_status: "confirmed_by_client"
    });
    expect(updatesByTable.has("opening_offers")).toBe(false);
    expect(inserts).toContainEqual(
      expect.objectContaining({
        appointment_id: "appointment-new",
        opening_id: null
      })
    );
  });

  it("uses a newer consent request context without creating an opening booking request", async () => {
    const fromCalls: string[] = [];
    let smsMessagesFromCount = 0;
    const inserts: QueryRecord[] = [];
    const updatesByTable = new Map<string, QueryRecord[]>();
    const upsertsByTable = new Map<string, QueryRecord[]>();

    const supabase = {
      from: vi.fn((table: string) => {
        fromCalls.push(table);

        if (table === "sms_messages") {
          smsMessagesFromCount += 1;
        }

        if (table === "sms_messages" && smsMessagesFromCount === 1) {
          return createQueryResult(null);
        }

        if (table === "sms_messages" && smsMessagesFromCount === 2) {
          return createConsentContextQuery();
        }

        if (table === "sms_consent_requests") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => ({
                      maybeSingle: vi.fn(() =>
                        Promise.resolve({
                          data: { id: "request-1", status: "sent" },
                          error: null
                        })
                      )
                    }))
                  }))
                }))
              }))
            })),
            update: vi.fn((row: QueryRecord) => {
              updatesByTable.set(table, [
                ...(updatesByTable.get(table) ?? []),
                row
              ]);
              return createMutationResult();
            })
          };
        }

        return {
          insert: vi.fn((row: QueryRecord) => {
            inserts.push(row);
            return createMutationResult({ id: `${table}-inserted` });
          }),
          update: vi.fn((row: QueryRecord) => {
            updatesByTable.set(table, [
              ...(updatesByTable.get(table) ?? []),
              row
            ]);
            return createMutationResult();
          }),
          upsert: vi.fn((row: QueryRecord) => {
            upsertsByTable.set(table, [
              ...(upsertsByTable.get(table) ?? []),
              row
            ]);
            return createUpsertResult();
          }),
          select: vi.fn(() => createQueryResult(null)),
          eq: vi.fn(() => createQueryResult(null))
        };
      })
    };

    supabaseState.client = supabase;

    const response = await handleInboundSmsRequest(
      new Request("https://example.com/webhook", { method: "POST" }),
      createProvider()
    );

    const body = await response.json();

    expect(body).toMatchObject({
      classification: "consent_opt_in",
      action: "consent_opted_in",
      appointmentId: null,
      openingId: null,
      status: "received_linked"
    });
    expect(upsertsByTable.get("sms_consents")).toContainEqual(
      expect.objectContaining({
        status: "opted_in",
        source: "sms_consent_request_reply"
      })
    );
    expect(updatesByTable.get("sms_consent_requests")).toContainEqual(
      expect.objectContaining({
        status: "accepted",
        inbound_sms_message_id: "sms_messages-inserted"
      })
    );
    expect(updatesByTable.has("appointments")).toBe(false);
    expect(updatesByTable.has("opening_offers")).toBe(false);
    expect(fromCalls).not.toContain("booking_requests");
    expect(inserts).toContainEqual(
      expect.objectContaining({
        message_type: "consent_reply",
        appointment_id: null,
        opening_id: null
      })
    );
  });

  it("persists but ignores positive replies from deleted customers", async () => {
    let smsMessagesFromCount = 0;
    const inserts: QueryRecord[] = [];
    const updatesByTable = new Map<string, QueryRecord[]>();
    const upsertsByTable = new Map<string, QueryRecord[]>();
    const fromCalls: string[] = [];

    const supabase = {
      from: vi.fn((table: string) => {
        fromCalls.push(table);

        if (table === "sms_messages") {
          smsMessagesFromCount += 1;
        }

        if (table === "sms_messages" && smsMessagesFromCount === 1) {
          return createQueryResult(null);
        }

        if (table === "sms_messages" && smsMessagesFromCount === 2) {
          return createWaitlistContextQuery();
        }

        if (table === "customers") {
          return createQueryResult({
            deleted_at: "2026-06-13T10:00:00.000Z"
          });
        }

        return {
          insert: vi.fn((row: QueryRecord) => {
            inserts.push(row);
            return createMutationResult({ id: `${table}-inserted` });
          }),
          update: vi.fn((row: QueryRecord) => {
            updatesByTable.set(table, [
              ...(updatesByTable.get(table) ?? []),
              row
            ]);
            return createMutationResult();
          }),
          upsert: vi.fn((row: QueryRecord) => {
            upsertsByTable.set(table, [
              ...(upsertsByTable.get(table) ?? []),
              row
            ]);
            return createUpsertResult();
          }),
          select: vi.fn(() => createQueryResult(null)),
          eq: vi.fn(() => createQueryResult(null))
        };
      })
    };

    supabaseState.client = supabase;

    const response = await handleInboundSmsRequest(
      new Request("https://example.com/webhook", { method: "POST" }),
      createProvider()
    );

    const body = await response.json();

    expect(body).toMatchObject({
      classification: "waitlist_positive",
      action: "ignored_deleted_customer",
      customerId: "customer-deleted",
      openingId: "opening-1",
      status: "received_linked"
    });
    expect(upsertsByTable.has("sms_consents")).toBe(false);
    expect(updatesByTable.has("opening_offers")).toBe(false);
    expect(updatesByTable.has("appointments")).toBe(false);
    expect(fromCalls).not.toContain("booking_requests");
    expect(inserts).toContainEqual(
      expect.objectContaining({
        action: "sms.deleted_customer_reply_ignored"
      })
    );
  });
});
