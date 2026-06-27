import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type AdminOrganizationBusinessInfo = {
  organizationId: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  timezone: string;
  defaultLanguage: "en" | "fr";
  contactName: string;
  businessType: string;
  bookingSystem: string;
  cancellationVolume: string;
  businessAddress: string;
  internalNotes: string;
  sourceRequestId: string | null;
};

export async function loadAdminOrganizationBusinessInfo(
  organizationId: string
): Promise<AdminOrganizationBusinessInfo | null> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, email, phone, timezone, default_language, source_request_id"
    )
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError) {
    throw new Error(organizationError.message);
  }

  if (!organization) {
    return null;
  }

  const callRequestResult = organization.source_request_id
    ? await supabase
        .from("book_call_requests")
        .select(
          "full_name, business_type, current_booking_system, cancellation_volume, internal_notes"
        )
        .eq("id", organization.source_request_id)
        .maybeSingle()
    : { data: null, error: null };

  if (callRequestResult.error) {
    throw new Error(callRequestResult.error.message);
  }

  const callRequest = callRequestResult.data;

  return {
    organizationId: organization.id,
    name: organization.name,
    slug: organization.slug,
    email: organization.email ?? "",
    phone: organization.phone ?? "",
    timezone: organization.timezone,
    defaultLanguage: organization.default_language,
    contactName: callRequest?.full_name ?? "",
    businessType: callRequest?.business_type ?? "",
    bookingSystem: callRequest?.current_booking_system ?? "",
    cancellationVolume: callRequest?.cancellation_volume ?? "",
    businessAddress: "",
    internalNotes: callRequest?.internal_notes ?? "",
    sourceRequestId: organization.source_request_id
  };
}
