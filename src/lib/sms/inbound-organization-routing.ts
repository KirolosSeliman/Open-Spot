import {
  loadOrganizationSmsSenderByMessagingServiceSid,
  loadOrganizationSmsSenderByPhoneE164
} from "@/lib/sms/organization-sender";
import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";

export async function resolveInboundOrganizationFromSender({
  toNumber,
  messagingServiceSid
}: {
  toNumber: string;
  messagingServiceSid?: string | null;
}): Promise<OrganizationSmsSenderRow | null> {
  if (toNumber) {
    const byPhone = await loadOrganizationSmsSenderByPhoneE164(toNumber);

    if (byPhone) {
      return byPhone;
    }
  }

  if (messagingServiceSid) {
    const byService = await loadOrganizationSmsSenderByMessagingServiceSid(
      messagingServiceSid
    );

    if (byService) {
      return byService;
    }
  }

  return null;
}

export async function findInboundCustomer({
  supabase,
  organizationId,
  fromNumber
}: {
  supabase: NonNullable<
    ReturnType<
      typeof import("@/lib/supabase/service").createSupabaseServiceClient
    >
  >;
  organizationId: string;
  fromNumber: string;
}) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, deleted_at")
    .eq("organization_id", organizationId)
    .eq("phone_e164", fromNumber)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findLatestOutboundContext({
  supabase,
  providerName,
  organizationId,
  fromNumber,
  toNumber
}: {
  supabase: NonNullable<
    ReturnType<
      typeof import("@/lib/supabase/service").createSupabaseServiceClient
    >
  >;
  providerName: string;
  organizationId: string;
  fromNumber: string;
  toNumber: string;
}) {
  const { data: contextRows, error } = await supabase
    .from("sms_messages")
    .select("id, organization_id, customer_id, opening_id, appointment_id, message_type")
    .eq("provider", providerName)
    .eq("organization_id", organizationId)
    .eq("direction", "outbound")
    .eq("to_number", fromNumber)
    .eq("from_number", toNumber)
    .not("customer_id", "is", null)
    .or("opening_id.not.is.null,appointment_id.not.is.null,message_type.eq.consent_request")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return contextRows?.[0] ?? null;
}
