import { NextResponse } from "next/server";

import { calculateCommissionEstimate } from "@/lib/openings/commission";
import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ValidateRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: ValidateRouteProps) {
  const { id } = await params;
  const payload = await request.json().catch(() => ({}));
  const selectedOfferId = String(payload.selectedOfferId ?? "");
  const recoveredValueCents = Number(payload.recoveredValueCents ?? 0);

  if (!selectedOfferId || !Number.isFinite(recoveredValueCents)) {
    return NextResponse.json(
      { error: "selectedOfferId and recoveredValueCents are required." },
      { status: 400 }
    );
  }

  const commissionCents = calculateCommissionEstimate({
    recoveredValueCents
  });
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Manual validation requires configured Supabase Auth.",
        commissionCents
      },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Authentication required.",
        commissionCents
      },
      { status: 401 }
    );
  }

  const { data, error } = await supabase.rpc("validate_opening_offer", {
    target_opening_id: id,
    target_offer_id: selectedOfferId,
    recovered_value_cents: recoveredValueCents,
    commission_cents: commissionCents
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    bookingRequestId: data,
    commissionCents
  });
}
