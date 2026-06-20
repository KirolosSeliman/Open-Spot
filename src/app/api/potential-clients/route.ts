import { NextResponse } from "next/server";

import {
  sendPotentialClientConfirmationEmail,
  sendPotentialClientOwnerNotification
} from "@/lib/potential-clients/email";
import {
  buildPotentialClientInsert,
  validatePotentialClientInput
} from "@/lib/potential-clients/validation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again, or contact us directly." },
      { status: 400 }
    );
  }

  const input = validatePotentialClientInput(
    typeof payload === "object" && payload !== null ? payload : {}
  );

  if (!input.ok) {
    return NextResponse.json({ ok: false, errors: input.errors }, { status: 400 });
  }

  if (input.value.isSpam) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again, or contact us directly." },
      { status: 503 }
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  const insertPayload = buildPotentialClientInsert({
    input: input.value,
    ip,
    userAgent
  });
  const { data: lead, error } = await supabase
    .from("potential_clients")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again, or contact us directly." },
      { status: 500 }
    );
  }

  const confirmation = await sendPotentialClientConfirmationEmail(input.value);
  const ownerNotification = await sendPotentialClientOwnerNotification(lead);
  const now = new Date().toISOString();

  await supabase
    .from("potential_clients")
    .update({
      confirmation_email_status: confirmation.status,
      confirmation_email_sent_at:
        confirmation.status === "sent" ? confirmation.sentAt : null,
      owner_notification_status: ownerNotification.status,
      owner_notification_sent_at:
        ownerNotification.status === "sent"
          ? ownerNotification.sentAt
          : null,
      updated_at: now
    })
    .eq("id", lead.id);

  return NextResponse.json({
    ok: true,
    leadId: lead.id
  });
}
