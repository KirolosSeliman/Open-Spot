import "server-only";

import { canPlatformAdminAccessOrganization } from "@/lib/admin/organizations";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  type ClientOnboardingInput,
  type ClientOnboardingStatus,
  isClientOnboardingStatus,
  onboardingServicesFromJson,
  onboardingServicesToJson
} from "@/lib/organization/client-onboarding";
import { hashOnboardingToken } from "@/lib/organization/onboarding-tokens";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

type ServiceClient = NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
type OnboardingRow =
  Database["public"]["Tables"]["organization_onboarding_submissions"]["Row"];
type OrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "id" | "name" | "slug" | "email" | "phone" | "timezone" | "default_language"
>;

export type ClientOnboardingRecord = {
  id: string;
  organization: OrganizationRow;
  status: ClientOnboardingStatus;
  tokenExpiresAt: string | null;
  businessName: string;
  businessType: string;
  bookingSystem: string | null;
  businessAddress: string | null;
  publicContactEmail: string | null;
  publicContactPhone: string | null;
  responsibleName: string;
  responsibleRole: string;
  responsibleEmail: string;
  responsiblePhone: string | null;
  services: ClientOnboardingInput["services"];
  averageAppointmentValueCents: number | null;
  currency: string;
  smsLanguage: "en" | "fr";
  smsTone: "warm" | "professional" | "direct";
  smsSenderLabel: string | null;
  smsQuietHoursStart: string;
  smsQuietHoursEnd: string;
  clientNotes: string | null;
  consentStatementAccepted: boolean;
  consentResponsibleName: string | null;
  consentAcceptedAt: string | null;
  adminNotes: string | null;
  requestedChanges: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

function requireServiceClient() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service role is required for onboarding.");
  }

  return supabase;
}

function normalizeStatus(status: string): ClientOnboardingStatus {
  return isClientOnboardingStatus(status) ? status : "not_started";
}

function rowToRecord(row: OnboardingRow, organization: OrganizationRow): ClientOnboardingRecord {
  return {
    id: row.id,
    organization,
    status: normalizeStatus(row.status),
    tokenExpiresAt: row.token_expires_at,
    businessName: row.business_name ?? organization.name,
    businessType: row.business_type ?? "",
    bookingSystem: row.booking_system,
    businessAddress: row.business_address,
    publicContactEmail: row.public_contact_email ?? organization.email,
    publicContactPhone: row.public_contact_phone ?? organization.phone,
    responsibleName: row.responsible_name ?? "",
    responsibleRole: row.responsible_role ?? "",
    responsibleEmail: row.responsible_email ?? "",
    responsiblePhone: row.responsible_phone,
    services: onboardingServicesFromJson(row.services),
    averageAppointmentValueCents: row.average_appointment_value_cents,
    currency: row.currency,
    smsLanguage: row.sms_language,
    smsTone: row.sms_tone as "warm" | "professional" | "direct",
    smsSenderLabel: row.sms_sender_label,
    smsQuietHoursStart: row.sms_quiet_hours_start.slice(0, 5),
    smsQuietHoursEnd: row.sms_quiet_hours_end.slice(0, 5),
    clientNotes: row.client_notes,
    consentStatementAccepted: row.consent_statement_accepted,
    consentResponsibleName: row.consent_responsible_name,
    consentAcceptedAt: row.consent_accepted_at,
    adminNotes: row.admin_notes,
    requestedChanges: row.requested_changes,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at
  };
}

async function loadOrganization(
  supabase: ServiceClient,
  organizationId: string
): Promise<OrganizationRow> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, email, phone, timezone, default_language")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Onboarding organization was not found.");
  }

  return data;
}

async function getAdminAccessRows(
  supabase: ServiceClient,
  admin: AuthorizedPlatformAdmin
) {
  if (admin.role === "super_admin") {
    return [];
  }

  const { data, error } = await supabase
    .from("platform_admin_organization_access")
    .select("organization_id, access_level, revoked_at")
    .eq("platform_admin_id", admin.id)
    .is("revoked_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => ({
    organizationId: row.organization_id,
    accessLevel: row.access_level,
    revokedAt: row.revoked_at
  }));
}

export async function canAdminReviewOnboarding({
  admin,
  organizationId
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
}) {
  const supabase = requireServiceClient();
  const accessRows = await getAdminAccessRows(supabase, admin);

  return canPlatformAdminAccessOrganization({
    adminRole: admin.role,
    organizationId,
    accessRows
  });
}

export async function loadOnboardingByToken(token: string) {
  const tokenHash = hashOnboardingToken(token);
  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_onboarding_submissions")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  if (data.token_expires_at && Date.parse(data.token_expires_at) < Date.now()) {
    return null;
  }

  return rowToRecord(data, await loadOrganization(supabase, data.organization_id));
}

export async function loadOnboardingByOrganization({
  organizationId,
  admin
}: {
  organizationId: string;
  admin?: AuthorizedPlatformAdmin;
}) {
  if (admin) {
    const allowed = await canAdminReviewOnboarding({ admin, organizationId });

    if (!allowed) {
      return null;
    }
  }

  const supabase = requireServiceClient();
  const { data, error } = await supabase
    .from("organization_onboarding_submissions")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? rowToRecord(data, await loadOrganization(supabase, data.organization_id)) : null;
}

export async function ensureOnboardingSubmission({
  organizationId,
  tokenHash,
  tokenExpiresAt,
  admin
}: {
  organizationId: string;
  tokenHash: string;
  tokenExpiresAt: string;
  admin: AuthorizedPlatformAdmin;
}) {
  const allowed = await canAdminReviewOnboarding({ admin, organizationId });

  if (!allowed) {
    throw new Error("Admin is not allowed to manage this organization.");
  }

  const supabase = requireServiceClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("name, email, phone, default_language")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    throw new Error(organizationError?.message ?? "Organization not found.");
  }

  const { error } = await supabase
    .from("organization_onboarding_submissions")
    .upsert(
      {
        organization_id: organizationId,
        token_hash: tokenHash,
        token_expires_at: tokenExpiresAt,
        business_name: organization.name,
        public_contact_email: organization.email,
        public_contact_phone: organization.phone,
        sms_language: organization.default_language,
        status: "not_started"
      },
      {
        onConflict: "organization_id"
      }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePublicOnboardingSubmission({
  token,
  input,
  submit
}: {
  token: string;
  input: ClientOnboardingInput;
  submit: boolean;
}) {
  const current = await loadOnboardingByToken(token);

  if (!current) {
    throw new Error("Onboarding link is invalid or expired.");
  }

  if (current.status === "completed") {
    throw new Error("This onboarding has already been completed.");
  }

  const nextStatus: ClientOnboardingStatus = submit ? "submitted" : "in_progress";
  const now = new Date().toISOString();
  const supabase = requireServiceClient();
  const { error } = await supabase
    .from("organization_onboarding_submissions")
    .update({
      status: nextStatus,
      business_name: input.businessName,
      business_type: input.businessType,
      booking_system: input.bookingSystem,
      business_address: input.businessAddress,
      public_contact_email: input.publicContactEmail,
      public_contact_phone: input.publicContactPhone,
      responsible_name: input.responsibleName,
      responsible_role: input.responsibleRole,
      responsible_email: input.responsibleEmail,
      responsible_phone: input.responsiblePhone,
      services: onboardingServicesToJson(input.services),
      average_appointment_value_cents: input.averageAppointmentValueCents,
      currency: input.currency,
      sms_language: input.smsLanguage,
      sms_tone: input.smsTone,
      sms_sender_label: input.smsSenderLabel,
      sms_quiet_hours_start: input.smsQuietHoursStart,
      sms_quiet_hours_end: input.smsQuietHoursEnd,
      client_notes: input.clientNotes,
      consent_statement_accepted: input.consentStatementAccepted,
      consent_responsible_name: input.consentResponsibleName,
      consent_accepted_at: input.consentStatementAccepted
        ? current.consentAcceptedAt ?? now
        : null,
      submitted_at: submit ? now : current.submittedAt
    })
    .eq("id", current.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAdminOnboardingReview({
  organizationId,
  admin,
  status,
  adminNotes,
  requestedChanges
}: {
  organizationId: string;
  admin: AuthorizedPlatformAdmin;
  status: ClientOnboardingStatus;
  adminNotes?: string | null;
  requestedChanges?: string | null;
}) {
  const allowed = await canAdminReviewOnboarding({ admin, organizationId });

  if (!allowed) {
    throw new Error("Admin is not allowed to review this organization.");
  }

  if (
    !["changes_requested", "ready_for_sms_setup", "completed"].includes(status)
  ) {
    throw new Error("Unsupported onboarding review status.");
  }

  const now = new Date().toISOString();
  const supabase = requireServiceClient();
  const update: Database["public"]["Tables"]["organization_onboarding_submissions"]["Update"] =
    {
      status,
      admin_notes: adminNotes ?? null,
      requested_changes: requestedChanges ?? null,
      reviewed_by_platform_admin_id: admin.id,
      reviewed_at: now,
      completed_at: status === "completed" ? now : null
    };

  const { error } = await supabase
    .from("organization_onboarding_submissions")
    .update(update)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }
}
