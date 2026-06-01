import { createClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env/config";
import type { Database } from "@/types/database";

export function createSupabasePublicServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase public URL and anon key are required.");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
