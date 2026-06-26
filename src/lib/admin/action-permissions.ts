import type {
  PlatformAdminAccessLevel,
  PlatformAdminRole
} from "@/lib/auth/platform-admin";

export type PlatformAdminAction =
  | "organization.update_support_status"
  | "organization.update_admin_note"
  | "organization.mark_internal_test"
  | "organization.pause_sms"
  | "organization.resume_sms"
  | "organization.disable"
  | "organization.reactivate"
  | "organization.archive"
  | "organization.unarchive"
  | "organization.update_billing_terms"
  | "organization.update_business_info"
  | "organization.manage_manual_billing"
  | "compliance.mark_reviewed"
  | "compliance.mark_resolved"
  | "manager_session.end"
  | "organization.run_health_check";

export function canPerformPlatformAdminAction({
  adminRole,
  accessLevel,
  action
}: {
  adminRole: PlatformAdminRole;
  accessLevel?: PlatformAdminAccessLevel | "super_admin" | null;
  action: PlatformAdminAction;
}) {
  if (adminRole === "super_admin") {
    return true;
  }

  if (adminRole === "analyst" || !accessLevel) {
    return false;
  }

  if (
    action === "organization.disable" ||
    action === "organization.reactivate" ||
    action === "organization.archive" ||
    action === "organization.unarchive" ||
    action === "organization.update_billing_terms" ||
    action === "organization.manage_manual_billing"
  ) {
    return false;
  }

  if (action === "organization.pause_sms" || action === "organization.resume_sms") {
    return false;
  }

  if (adminRole === "support_admin") {
    return (
      ["support", "manager_mode"].includes(accessLevel) &&
      [
        "organization.update_support_status",
        "organization.update_admin_note",
        "organization.update_business_info",
        "compliance.mark_reviewed",
        "compliance.mark_resolved",
        "manager_session.end",
        "organization.run_health_check"
      ].includes(action)
    );
  }

  if (adminRole === "account_admin") {
    return [
      "organization.update_admin_note",
      "organization.update_business_info",
      "organization.run_health_check",
      "manager_session.end"
    ].includes(action);
  }

  return false;
}
