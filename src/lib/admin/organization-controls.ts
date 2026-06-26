import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { getAdminOrganizationAccessLevel } from "@/lib/admin/access";
import { canPerformPlatformAdminAction } from "@/lib/admin/action-permissions";
import type { Database } from "@/types/database";

export type OrganizationAdminControls =
  Database["public"]["Tables"]["platform_organization_admin_controls"]["Row"];

export const defaultOrganizationAdminControls = {
  support_status: "healthy" as const,
  admin_note: null,
  is_internal_test: false,
  sms_sending_paused: false,
  sms_paused_at: null,
  sms_pause_reason: null,
  disabled_at: null,
  disabled_reason: null,
  archived_at: null,
  archived_by_platform_admin_id: null,
  archived_reason: null,
  unarchived_at: null,
  unarchived_by_platform_admin_id: null,
  last_health_check_at: null,
  last_health_check_status: null,
  last_health_check_payload: {}
};

export async function getOrganizationAdminControls(organizationId: string) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return {
      organization_id: organizationId,
      ...defaultOrganizationAdminControls
    };
  }

  const { data, error } = await supabase
    .from("platform_organization_admin_controls")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (
    data ?? {
      organization_id: organizationId,
      ...defaultOrganizationAdminControls
    }
  );
}

export async function isOrganizationSmsPaused(organizationId: string) {
  const controls = await getOrganizationAdminControls(organizationId);
  return controls.sms_sending_paused || Boolean(controls.disabled_at);
}

export async function requireOrganizationSmsNotPaused(organizationId: string) {
  if (await isOrganizationSmsPaused(organizationId)) {
    throw new Error("SMS sending is paused for this organization by platform admin.");
  }
}

export async function requireOrganizationNotDisabled(organizationId: string) {
  const controls = await getOrganizationAdminControls(organizationId);

  if (controls.disabled_at) {
    throw new Error("This organization is temporarily disabled. Contact support.");
  }
}

export async function loadOrganizationAdminControlsPanel({
  admin,
  organizationId
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
}) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const accessLevel = await getAdminOrganizationAccessLevel({ admin, organizationId });
  const controls = await getOrganizationAdminControls(organizationId);
  const { data: sessions, error } = await supabase
    .from("platform_admin_sessions")
    .select("id, admin_email, reason, status, started_at, expires_at, ended_at")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .is("ended_at", null)
    .order("started_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    controls,
    activeManagerSessions: sessions ?? [],
    permissions: {
      canUpdateSupportStatus: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.update_support_status"
      }),
      canUpdateAdminNote: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.update_admin_note"
      }),
      canMarkInternalTest: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.mark_internal_test"
      }),
      canPauseSms: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.pause_sms"
      }),
      canResumeSms: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.resume_sms"
      }),
      canDisable: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.disable"
      }),
      canReactivate: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.reactivate"
      }),
      canArchive: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.archive"
      }),
      canUnarchive: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.unarchive"
      }),
      canUpdateBillingTerms: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.update_billing_terms"
      }),
      canUpdateBusinessInfo: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.update_business_info"
      }),
      canEndManagerSessions: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "manager_session.end"
      }),
      canRunHealthCheck: canPerformPlatformAdminAction({
        adminRole: admin.role,
        accessLevel,
        action: "organization.run_health_check"
      })
    }
  };
}
