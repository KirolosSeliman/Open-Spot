"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { canValidateBookings } from "@/lib/organization/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildResponsesRedirect(params: Record<string, string>) {
  const search = new URLSearchParams({ tab: "openings", ...params });
  return `/dashboard/responses?${search.toString()}`;
}

async function requireValidationOrganization() {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    throw new Error("Supabase must be configured before performing this action.");
  }

  if (!canValidateBookings(workspace.organization.role)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return workspace.organization;
}

export async function rejectOpeningOfferFromResponsesAction(formData: FormData) {
  const openingId = String(formData.get("openingId") ?? "");
  const offerId = String(formData.get("offerId") ?? "");

  if (!openingId || !offerId) {
    redirect(
      buildResponsesRedirect({
        validationError: "L'annulation et l'offre sont requises."
      })
    );
  }

  const organization = await requireValidationOrganization();
  const supabase = await createSupabaseServerClient();

  const [{ data: opening, error: openingError }, { data: offer, error: offerError }] =
    await Promise.all([
      supabase
        .from("openings")
        .select("id, status")
        .eq("organization_id", organization.id)
        .eq("id", openingId)
        .maybeSingle(),
      supabase
        .from("opening_offers")
        .select("id, status")
        .eq("organization_id", organization.id)
        .eq("opening_id", openingId)
        .eq("id", offerId)
        .maybeSingle()
    ]);

  if (openingError || !opening) {
    redirect(
      buildResponsesRedirect({
        validationError: openingError?.message ?? "Annulation introuvable."
      })
    );
  }

  if (offerError || !offer) {
    redirect(
      buildResponsesRedirect({
        validationError: offerError?.message ?? "Offre introuvable."
      })
    );
  }

  if (opening.status === "filled") {
    redirect(
      buildResponsesRedirect({
        validationError: "Ce créneau est déjà récupéré."
      })
    );
  }

  if (["selected", "rejected"].includes(offer.status)) {
    redirect(
      buildResponsesRedirect({
        validationError: "Cette réponse ne peut plus être refusée."
      })
    );
  }

  const { error: updateError } = await supabase
    .from("opening_offers")
    .update({ status: "rejected" })
    .eq("organization_id", organization.id)
    .eq("opening_id", openingId)
    .eq("id", offerId)
    .in("status", ["sent", "responded"]);

  if (updateError) {
    redirect(
      buildResponsesRedirect({
        validationError: updateError.message
      })
    );
  }

  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/cancellations");
  revalidatePath(`/dashboard/cancellations/${openingId}`);

  redirect(
    buildResponsesRedirect({
      notice: "Réponse refusée manuellement."
    })
  );
}
