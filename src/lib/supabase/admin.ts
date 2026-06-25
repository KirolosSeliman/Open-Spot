import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export function createSupabaseAdminClient() {
  const client = createSupabaseServiceClient();

  if (!client) {
    throw new Error("Supabase Admin environment is not configured.");
  }

  return client;
}
