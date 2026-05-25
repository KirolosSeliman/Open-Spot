import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { classifyInboundSmsBody } from "@/lib/sms/inbound";
import { createSmsProvider } from "@/lib/sms/factory";

export async function POST(request: Request) {
  const provider = createSmsProvider();
  const verified = await provider.verifyWebhookSignature(request);

  if (!verified) {
    return NextResponse.json({ error: "Invalid SMS webhook signature." }, { status: 401 });
  }

  const inbound = await provider.parseInboundRequest(request);
  const classification = classifyInboundSmsBody(inbound.body);
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      {
        classification,
        status: "received_unpersisted",
        warning: "Supabase service role is not configured."
      },
      { status: 202 }
    );
  }

  return NextResponse.json({
    classification,
    status: "received",
    note: "Persistence is handled by the configured provider workflow."
  });
}
