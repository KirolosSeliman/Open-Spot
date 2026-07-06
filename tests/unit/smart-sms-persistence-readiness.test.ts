import { describe, expect, it } from "vitest";

import {
  checkSmartSmsPersistenceReadinessWithClient,
  isSmartSmsPersistenceSchemaError
} from "@/lib/sms/smart-sms-persistence-readiness";

type QueryResult = {
  data?: unknown;
  error?: { code?: string; message?: string } | null;
};

function createFakeSupabase(results: Record<string, QueryResult>) {
  return {
    from(table: string) {
      return createQuery(table, results);
    },
    schema(schemaName: string) {
      return {
        from(table: string) {
          return createQuery(`${schemaName}.${table}`, results);
        }
      };
    }
  };
}

function createFakeSupabaseWithoutSchema(results: Record<string, QueryResult>) {
  return {
    from(table: string) {
      return createQuery(table, results);
    }
  };
}

function createQuery(key: string, results: Record<string, QueryResult>) {
  const query = {
    select(columns: string) {
      void columns;
      return query;
    },
    eq() {
      return query;
    },
    limit() {
      return Promise.resolve(results[key] ?? { data: [], error: null });
    },
    maybeSingle() {
      return Promise.resolve(results[key] ?? { data: null, error: null });
    }
  };

  return query;
}

describe("smart SMS persistence readiness", () => {
  it("returns ready when all smart SMS objects are queryable", async () => {
    const readiness = await checkSmartSmsPersistenceReadinessWithClient(
      createFakeSupabase({
        organization_settings: { data: [], error: null },
        customer_sms_preferences: { data: [], error: null },
        customer_activity_events: { data: [], error: null },
        alert_recipient_decisions: { data: [], error: null },
        "information_schema.table_constraints": {
          data: { constraint_name: "alert_recipient_decisions_alert_customer_unique" },
          error: null
        }
      })
    );

    expect(readiness).toEqual({
      ready: true,
      blockingReasons: [],
      warnings: [],
      missingObjects: []
    });
  });

  it("returns a controlled not-ready result for a missing table", async () => {
    const readiness = await checkSmartSmsPersistenceReadinessWithClient(
      createFakeSupabase({
        organization_settings: { data: [], error: null },
        customer_sms_preferences: {
          error: {
            code: "42P01",
            message: "relation public.customer_sms_preferences does not exist"
          }
        },
        customer_activity_events: { data: [], error: null },
        alert_recipient_decisions: { data: [], error: null },
        "information_schema.table_constraints": {
          data: { constraint_name: "alert_recipient_decisions_alert_customer_unique" },
          error: null
        }
      })
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.missingObjects).toContain("public.customer_sms_preferences");
    expect(readiness.blockingReasons).toContain(
      "Mode intelligent SMS indisponible : migration non appliquée."
    );
  });

  it("returns a controlled not-ready result for a missing required column", async () => {
    const readiness = await checkSmartSmsPersistenceReadinessWithClient(
      createFakeSupabase({
        organization_settings: {
          error: {
            code: "42703",
            message: "column organization_settings.smart_sending_enabled does not exist"
          }
        },
        customer_sms_preferences: { data: [], error: null },
        customer_activity_events: { data: [], error: null },
        alert_recipient_decisions: { data: [], error: null },
        "information_schema.table_constraints": {
          data: { constraint_name: "alert_recipient_decisions_alert_customer_unique" },
          error: null
        }
      })
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.missingObjects).toContain(
      "public.organization_settings.smart_sending_enabled"
    );
  });

  it("keeps runtime ready with a warning when the alert/customer unique constraint cannot be confirmed", async () => {
    const readiness = await checkSmartSmsPersistenceReadinessWithClient(
      createFakeSupabase({
        organization_settings: { data: [], error: null },
        customer_sms_preferences: { data: [], error: null },
        customer_activity_events: { data: [], error: null },
        alert_recipient_decisions: { data: [], error: null },
        "information_schema.table_constraints": { data: null, error: null }
      })
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.blockingReasons).toEqual([]);
    expect(readiness.missingObjects).toEqual([]);
    expect(readiness.warnings).toContain(
      "Smart SMS persistence constraint check is unavailable."
    );
  });

  it("stays ready when information_schema is not exposed but required runtime tables are queryable", async () => {
    const readiness = await checkSmartSmsPersistenceReadinessWithClient(
      createFakeSupabaseWithoutSchema({
        organization_settings: { data: [], error: null },
        customer_sms_preferences: { data: [], error: null },
        customer_activity_events: { data: [], error: null },
        alert_recipient_decisions: { data: [], error: null }
      })
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.blockingReasons).toEqual([]);
    expect(readiness.missingObjects).toEqual([]);
  });

  it("treats inaccessible information_schema as a non-blocking warning", async () => {
    const readiness = await checkSmartSmsPersistenceReadinessWithClient(
      createFakeSupabase({
        organization_settings: { data: [], error: null },
        customer_sms_preferences: { data: [], error: null },
        customer_activity_events: { data: [], error: null },
        alert_recipient_decisions: { data: [], error: null },
        "information_schema.table_constraints": {
          error: {
            code: "42501",
            message: "permission denied for schema information_schema"
          }
        }
      })
    );

    expect(readiness.ready).toBe(true);
    expect(readiness.blockingReasons).toEqual([]);
    expect(readiness.missingObjects).toEqual([]);
    expect(readiness.warnings).toContain(
      "Smart SMS persistence constraint check is unavailable."
    );
  });

  it("returns an unavailable warning for non-schema errors without throwing", async () => {
    const readiness = await checkSmartSmsPersistenceReadinessWithClient(
      createFakeSupabase({
        organization_settings: {
          error: {
            code: "57014",
            message: "canceling statement due to statement timeout"
          }
        },
        customer_sms_preferences: { data: [], error: null },
        customer_activity_events: { data: [], error: null },
        alert_recipient_decisions: { data: [], error: null },
        "information_schema.table_constraints": {
          data: { constraint_name: "alert_recipient_decisions_alert_customer_unique" },
          error: null
        }
      })
    );

    expect(readiness.ready).toBe(false);
    expect(readiness.missingObjects).toEqual([]);
    expect(readiness.warnings).toContain(
      "Smart SMS persistence is temporarily unavailable."
    );
  });

  it("detects Supabase schema cache, missing relation, and missing column errors", () => {
    expect(isSmartSmsPersistenceSchemaError({ code: "42P01" })).toBe(true);
    expect(isSmartSmsPersistenceSchemaError({ code: "42703" })).toBe(true);
    expect(
      isSmartSmsPersistenceSchemaError({
        message: "Could not find the table public.alert_recipient_decisions in the schema cache"
      })
    ).toBe(true);
    expect(isSmartSmsPersistenceSchemaError({ code: "57014" })).toBe(false);
  });
});
