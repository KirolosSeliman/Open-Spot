import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export function createSupabaseAuthEmailClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
