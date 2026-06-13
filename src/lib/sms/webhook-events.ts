import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/types/database";

type WebhookEventInsert =
  Database["public"]["Tables"]["platform_sms_webhook_events"]["Insert"];

function toJsonObject(value: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

export function buildSmsBodyPreview(body: string | null | undefined) {
  const value = String(body ?? "").replace(/\s+/g, " ").trim();
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

export async function recordSmsWebhookEvent(
  event: Omit<WebhookEventInsert, "payload_summary"> & {
    payload_summary?: Record<string, unknown>;
  }
) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("platform_sms_webhook_events").insert({
    ...event,
    body_preview: buildSmsBodyPreview(event.body_preview),
    payload_summary: toJsonObject(event.payload_summary ?? {})
  });

  if (error) {
    console.error("SMS webhook diagnostic event write failed:", error.message);
  }
}
