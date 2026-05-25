import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSmsProvider } from "@/lib/sms/factory";

export async function POST() {
  const supabase = createSupabaseServiceClient();
  const provider = createSmsProvider();

  if (!supabase) {
    return NextResponse.json(
      {
        provider: provider.getProviderName(),
        error: "Opening send requires configured Supabase service role and organization context."
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      provider: provider.getProviderName(),
      error: "Opening send persistence is not enabled until organization-scoped recipient queries are connected."
    },
    { status: 501 }
  );
}
