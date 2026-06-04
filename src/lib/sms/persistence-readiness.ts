import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SmsPersistenceReadiness = {
  ready: boolean;
  blockingReasons: string[];
};

const requiredDeliveryColumns = [
  "error_code",
  "error_message",
  "status_callback_received_at",
  "delivered_at",
  "failed_at",
  "provider_status_payload",
  "provider_message_id",
  "from_number",
  "to_number"
] as const;

export function getSmsDeliveryReadinessQuery() {
  return [
    "id",
    "organization_id",
    "status",
    ...requiredDeliveryColumns
  ].join(", ");
}

export function isSmsPersistenceSchemaError(error: {
  message?: string;
  code?: string;
} | null | undefined) {
  if (!error) {
    return false;
  }

  const message = String(error.message ?? "").toLowerCase();

  return (
    error.code === "42703" ||
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

export async function checkSmsDeliveryPersistenceReadiness(): Promise<SmsPersistenceReadiness> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("sms_messages")
    .select(getSmsDeliveryReadinessQuery())
    .limit(1);

  if (!error) {
    return {
      ready: true,
      blockingReasons: []
    };
  }

  if (isSmsPersistenceSchemaError(error)) {
    return {
      ready: false,
      blockingReasons: [
        "SMS delivery tracking schema is not ready. Apply Supabase migrations before sending SMS alerts."
      ]
    };
  }

  return {
    ready: false,
    blockingReasons: [
      "SMS delivery persistence is temporarily unavailable. Please try again shortly."
    ]
  };
}
