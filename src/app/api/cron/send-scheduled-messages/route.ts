import { NextResponse } from "next/server";

import { createSmsProvider } from "@/lib/sms/factory";
import {
  isAuthorizedCronRequest,
  processDueScheduledMessages
} from "@/lib/sms/scheduled-messages";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  if (
    !isAuthorizedCronRequest(
      request.headers.get("authorization"),
      process.env.CRON_SECRET
    )
  ) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Scheduled message processing requires Supabase service role configuration."
      },
      { status: 503 }
    );
  }

  const provider = createSmsProvider();

  try {
    const summary = await processDueScheduledMessages({
      supabase,
      provider,
      batchSize: 25
    });

    return NextResponse.json({
      provider: provider.getProviderName(),
      ...summary
    });
  } catch {
    return NextResponse.json(
      { error: "Scheduled message processing failed." },
      { status: 500 }
    );
  }
}
