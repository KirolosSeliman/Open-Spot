import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { calculateCommissionEstimate } from "@/lib/openings/commission";
import { isSupabaseConfigured } from "@/lib/env/config";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { canValidateBookings } from "@/lib/organization/permissions";
import { sendOpeningConfirmationSmsAfterValidation } from "@/lib/sms/opening-confirmation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ValidateRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: ValidateRouteProps) {
  const { id: openingId } = await params;
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

  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    return NextResponse.json(
      { error: "Organization workspace is not ready." },
      { status: 503 }
    );
  }

  if (!canValidateBookings(workspace.organization.role)) {
    return NextResponse.json(
      { error: "You do not have permission to perform this action." },
      { status: 403 }
    );
  }

  const organization = workspace.organization;
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

  const { data: offer, error: offerLookupError } = await supabase
    .from("opening_offers")
    .select("id, customer_id, status")
    .eq("organization_id", organization.id)
    .eq("opening_id", openingId)
    .eq("id", selectedOfferId)
    .maybeSingle();

  if (offerLookupError || !offer) {
    return NextResponse.json(
      { error: offerLookupError?.message ?? "Opening offer not found." },
      { status: 400 }
    );
  }

  const { data: customer, error: customerLookupError } = await supabase
    .from("customers")
    .select("id, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", offer.customer_id)
    .maybeSingle();

  if (customerLookupError) {
    return NextResponse.json(
      { error: "Unable to validate the selected client." },
      { status: 400 }
    );
  }

  if (customer?.deleted_at) {
    return NextResponse.json(
      {
        error:
          "This client was deleted and cannot be selected for a recovered spot."
      },
      { status: 400 }
    );
  }

  const { data: bookingRequestId, error } = await supabase.rpc(
    "validate_opening_offer",
    {
      target_opening_id: openingId,
      target_offer_id: selectedOfferId,
      recovered_value_cents: recoveredValueCents,
      commission_cents: commissionCents
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!bookingRequestId) {
    return NextResponse.json(
      { error: "Opening validation did not return a booking request." },
      { status: 400 }
    );
  }

  const confirmationSmsWarning = await sendOpeningConfirmationSmsAfterValidation({
    supabase,
    organization,
    openingId,
    offerId: selectedOfferId,
    bookingRequestId
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cancellations");
  revalidatePath(`/dashboard/cancellations/${openingId}`);
  revalidatePath("/dashboard/responses");

  return NextResponse.json({
    bookingRequestId,
    commissionCents,
    notice: confirmationSmsWarning
      ? "Client confirmé."
      : "Client confirmé. SMS de confirmation envoyé.",
    confirmationSmsWarning
  });
}
