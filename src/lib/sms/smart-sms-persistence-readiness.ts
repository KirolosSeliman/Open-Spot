import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SmartSmsPersistenceReadiness = {
  ready: boolean;
  blockingReasons: string[];
  warnings: string[];
  missingObjects: string[];
};

type SupabaseLikeClient = {
  from(table: string): {
    select(columns: string): {
      limit(count: number): PromiseLike<QueryResult>;
    };
  };
  schema?: (schemaName: string) => {
    from(table: string): {
      select(columns: string): {
        eq(column: string, value: string): unknown;
        maybeSingle(): PromiseLike<QueryResult>;
      };
    };
  };
};

type QueryResult = {
  data?: unknown;
  error?: {
    code?: string;
    message?: string;
  } | null;
};

const smartSmsMigrationMessage =
  "Mode intelligent SMS indisponible : migration non appliquée.";

const requiredSmartSmsChecks = [
  {
    table: "organization_settings",
    objectName: "public.organization_settings.smart_sending_enabled",
    columns:
      "smart_sending_enabled, cooldown_after_completed_appointment_days, cooldown_after_filled_spot_days, max_sms_per_day, max_sms_per_7_days, max_sms_per_30_days, block_if_future_appointment_exists, future_appointment_window_days, allowed_send_start_time, allowed_send_end_time, always_review_recipients_before_send"
  },
  {
    table: "customer_sms_preferences",
    objectName: "public.customer_sms_preferences",
    columns: "id, organization_id, customer_id, manual_send_mode, manual_snooze_until"
  },
  {
    table: "customer_activity_events",
    objectName: "public.customer_activity_events",
    columns: "id, organization_id, customer_id, event_type, related_alert_id"
  },
  {
    table: "alert_recipient_decisions",
    objectName: "public.alert_recipient_decisions",
    columns:
      "id, alert_id, organization_id, customer_id, sent_at, delivery_status, manual_override, final_decision, base_decision"
  }
] as const;

export function isSmartSmsPersistenceSchemaError(error: {
  code?: string;
  message?: string;
} | null | undefined) {
  if (!error) {
    return false;
  }

  const message = String(error.message ?? "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

async function checkAlertRecipientUniqueConstraint(
  supabase: SupabaseLikeClient
) {
  if (!supabase.schema) {
    return {
      checked: false,
      exists: false,
      error: {
        message: "information_schema is not exposed by this Supabase client"
      }
    };
  }

  const query = supabase
    .schema("information_schema")
    .from("table_constraints")
    .select("constraint_name")
    .eq("table_schema", "public");

  if (
    query &&
    typeof (query as { eq?: unknown }).eq === "function"
  ) {
    (query as { eq: (column: string, value: string) => unknown }).eq(
      "table_name",
      "alert_recipient_decisions"
    );
    (query as { eq: (column: string, value: string) => unknown }).eq(
      "constraint_name",
      "alert_recipient_decisions_alert_customer_unique"
    );
  }

  const result = await (query as { maybeSingle: () => PromiseLike<QueryResult> })
    .maybeSingle();

  return {
    checked: true,
    exists: Boolean(result.data),
    error: result.error ?? null
  };
}

export async function checkSmartSmsPersistenceReadinessWithClient(
  supabase: SupabaseLikeClient
): Promise<SmartSmsPersistenceReadiness> {
  const missingObjects: string[] = [];
  const warnings: string[] = [];
  let requiredObjectUnavailable = false;

  for (const check of requiredSmartSmsChecks) {
    const { error } = await supabase
      .from(check.table)
      .select(check.columns)
      .limit(1);

    if (!error) {
      continue;
    }

    if (isSmartSmsPersistenceSchemaError(error)) {
      missingObjects.push(check.objectName);
      continue;
    }

    warnings.push("Smart SMS persistence is temporarily unavailable.");
    requiredObjectUnavailable = true;
  }

  const constraintCheck = await checkAlertRecipientUniqueConstraint(supabase);

  if (constraintCheck.error) {
    warnings.push("Smart SMS persistence constraint check is unavailable.");
  } else if (constraintCheck.checked && !constraintCheck.exists) {
    warnings.push("Smart SMS persistence constraint check is unavailable.");
  }

  const ready = missingObjects.length === 0 && !requiredObjectUnavailable;

  return {
    ready,
    blockingReasons:
      missingObjects.length > 0
        ? [smartSmsMigrationMessage]
        : requiredObjectUnavailable
          ? ["Smart SMS persistence is temporarily unavailable."]
          : [],
    warnings,
    missingObjects
  };
}

export async function checkSmartSmsPersistenceReadiness(): Promise<SmartSmsPersistenceReadiness> {
  const supabase = await createSupabaseServerClient();

  return checkSmartSmsPersistenceReadinessWithClient(
    supabase as unknown as SupabaseLikeClient
  );
}
