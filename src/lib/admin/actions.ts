"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminOrganizationAccessLevel } from "@/lib/admin/access";
import {
  canPerformPlatformAdminAction,
  type PlatformAdminAction
} from "@/lib/admin/action-permissions";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { normalizeBillingTermsInput } from "@/lib/admin/billing-terms";
import {
  getSafeInternalRedirectPath,
  requireCurrentPlatformAdmin
} from "@/lib/auth/platform-admin";
import { hasMissingStatusCallback, isFailedSmsStatus } from "@/lib/sms/status-helpers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

type SupportStatus = "healthy" | "needs_setup" | "watchlist" | "blocked" | "disabled";
type ReviewStatus = "reviewed" | "resolved" | "dismissed";

function stringField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function backToOrganization(organizationId: string, suffix = "") {
  redirect(`/admin/organizations/${organizationId}${suffix}`);
}

function getSafeReturnTo(formData: FormData, fallback: string) {
  return getSafeInternalRedirectPath(stringField(formData, "returnTo")) ?? fallback;
}

async function requireAdminAction({
  organizationId,
  action
}: {
  organizationId: string;
  action: PlatformAdminAction;
}) {
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    throw new Error("Platform admin access is required.");
  }

  const accessLevel = await getAdminOrganizationAccessLevel({
    admin: access.admin,
    organizationId
  });

  if (!accessLevel) {
    throw new Error("You do not have access to this organization.");
  }

  if (
    !canPerformPlatformAdminAction({
      adminRole: access.admin.role,
      accessLevel,
      action
    })
  ) {
    throw new Error("This admin role cannot perform this action.");
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  return { admin: access.admin, supabase };
}

async function auditAndRefresh({
  admin,
  organizationId,
  action,
  metadata = {},
  suffix = ""
}: {
  admin: { id: string; userId: string; email: string };
  organizationId: string;
  action: string;
  metadata?: Record<string, unknown>;
  suffix?: string;
}) {
  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action,
    entityType: "organizations",
    entityId: organizationId,
    metadata
  });
  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
  backToOrganization(organizationId, suffix);
}

export async function updateOrganizationSupportStatusAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const supportStatus = stringField(formData, "supportStatus") as SupportStatus;

  if (!["healthy", "needs_setup", "watchlist", "blocked", "disabled"].includes(supportStatus)) {
    backToOrganization(organizationId);
  }

  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.update_support_status"
  });
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    support_status: supportStatus
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.support_status_updated",
    metadata: { support_status: supportStatus }
  });
}

export async function updateOrganizationAdminNoteAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const adminNote = stringField(formData, "adminNote").slice(0, 2000);
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.update_admin_note"
  });
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    admin_note: adminNote || null
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.admin_note_updated",
    metadata: { note_length: adminNote.length }
  });
}

export async function toggleOrganizationInternalTestAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const isInternalTest = formData.get("isInternalTest") === "true";
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.mark_internal_test"
  });
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    is_internal_test: isInternalTest
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.internal_test_updated",
    metadata: { is_internal_test: isInternalTest }
  });
}

export async function pauseOrganizationSmsAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const reason = stringField(formData, "reason").slice(0, 500);

  if (reason.length < 3) {
    backToOrganization(organizationId);
  }

  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.pause_sms"
  });
  const now = new Date().toISOString();
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    sms_sending_paused: true,
    sms_paused_at: now,
    sms_paused_by_platform_admin_id: admin.id,
    sms_pause_reason: reason
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.sms_paused",
    metadata: { reason }
  });
}

export async function resumeOrganizationSmsAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.resume_sms"
  });
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    sms_sending_paused: false,
    sms_resumed_at: new Date().toISOString(),
    sms_resumed_by_platform_admin_id: admin.id
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.sms_resumed"
  });
}

export async function disableOrganizationAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const reason = stringField(formData, "reason").slice(0, 500);

  if (reason.length < 3) {
    backToOrganization(organizationId);
  }

  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.disable"
  });
  const now = new Date().toISOString();
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    support_status: "disabled",
    sms_sending_paused: true,
    disabled_at: now,
    disabled_by_platform_admin_id: admin.id,
    disabled_reason: reason
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.disabled",
    metadata: { reason }
  });
}

export async function reactivateOrganizationAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.reactivate"
  });
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    support_status: "healthy",
    disabled_at: null,
    disabled_by_platform_admin_id: null,
    disabled_reason: null,
    reactivated_at: new Date().toISOString(),
    reactivated_by_platform_admin_id: admin.id
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.reactivated"
  });
}

export async function archiveOrganizationAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const reason = stringField(formData, "reason").slice(0, 500);
  const returnTo = getSafeReturnTo(formData, "/admin/organizations");

  if (reason.length < 3) {
    redirect(returnTo);
  }

  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.archive"
  });
  const { data: existing } = await supabase
    .from("platform_organization_admin_controls")
    .select("archived_at, archived_reason")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const now = new Date().toISOString();
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    archived_at: now,
    archived_by_platform_admin_id: admin.id,
    archived_reason: reason,
    unarchived_at: null,
    unarchived_by_platform_admin_id: null
  });

  if (error) {
    throw new Error(error.message);
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "admin.organization.archived",
    entityType: "organizations",
    entityId: organizationId,
    metadata: {
      reason,
      old_values: existing ?? null,
      new_values: {
        archived_at: now
      }
    }
  });
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(returnTo);
}

export async function unarchiveOrganizationAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const returnTo = getSafeReturnTo(formData, "/admin/organizations?tab=active");
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.unarchive"
  });
  const { data: existing } = await supabase
    .from("platform_organization_admin_controls")
    .select("archived_at, archived_reason")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const now = new Date().toISOString();
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    archived_at: null,
    archived_by_platform_admin_id: null,
    archived_reason: null,
    unarchived_at: now,
    unarchived_by_platform_admin_id: admin.id
  });

  if (error) {
    throw new Error(error.message);
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "admin.organization.unarchived",
    entityType: "organizations",
    entityId: organizationId,
    metadata: {
      old_values: existing ?? null,
      new_values: {
        unarchived_at: now
      }
    }
  });
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(returnTo);
}

export async function updateOrganizationBillingTermsAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.update_billing_terms"
  });
  const { terms, notes } = normalizeBillingTermsInput({
    currency: stringField(formData, "currency"),
    monthlySubscription: stringField(formData, "monthlySubscription"),
    filledSpotFeeMode: stringField(formData, "filledSpotFeeMode"),
    fixedFee: stringField(formData, "fixedFee"),
    percentage: stringField(formData, "percentage"),
    notes: stringField(formData, "notes")
  });
  const { data: existing } = await supabase
    .from("platform_organization_billing_terms")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const { error } = await supabase.from("platform_organization_billing_terms").upsert({
    organization_id: organizationId,
    currency: terms.currency,
    monthly_subscription_cents: terms.monthlySubscriptionCents,
    filled_spot_fee_mode: terms.filledSpotFeeMode,
    filled_spot_fixed_fee_cents: terms.filledSpotFixedFeeCents,
    filled_spot_percentage_bps: terms.filledSpotPercentageBps,
    notes,
    updated_by_platform_admin_id: admin.id
  });

  if (error) {
    throw new Error(error.message);
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "admin.organization.billing_terms_updated",
    entityType: "platform_organization_billing_terms",
    entityId: organizationId,
    metadata: {
      old_values: existing ?? null,
      new_values: terms
    }
  });
  revalidatePath(`/admin/organizations/${organizationId}`);
  redirect(`/admin/organizations/${organizationId}`);
}

export async function markComplianceReviewAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const issueKey = stringField(formData, "issueKey").slice(0, 240);
  const issueType = stringField(formData, "issueType").slice(0, 80);
  const severity = stringField(formData, "severity") || "medium";
  const status = stringField(formData, "status") as ReviewStatus;
  const note = stringField(formData, "note").slice(0, 1000);

  if (!["reviewed", "resolved", "dismissed"].includes(status)) {
    redirect(organizationId ? `/admin/organizations/${organizationId}/compliance` : "/admin/compliance");
  }

  const action =
    status === "resolved" ? "compliance.mark_resolved" : "compliance.mark_reviewed";
  const context = organizationId
    ? await requireAdminAction({ organizationId, action })
    : null;
  let admin = context?.admin;
  let supabase = context?.supabase;

  if (!context) {
    const access = await requireCurrentPlatformAdmin();

    if (access.status !== "authorized") {
      throw new Error("Platform admin access is required.");
    }

    if (access.admin.role !== "super_admin") {
      throw new Error("Only super admins can review global compliance issues.");
    }

    const serviceSupabase = createSupabaseServiceClient();

    if (!serviceSupabase) {
      throw new Error("Admin service client is not configured.");
    }

    admin = access.admin;
    supabase = serviceSupabase;
  }

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  if (!admin) {
    throw new Error("Platform admin access is required.");
  }
  const now = new Date().toISOString();
  const { error } = await supabase.from("platform_compliance_reviews").upsert({
    organization_id: organizationId || null,
    issue_key: issueKey,
    issue_type: issueType,
    severity: severity === "high" || severity === "low" ? severity : "medium",
    status,
    note: note || null,
    reviewed_by_platform_admin_id: admin.id,
    reviewed_at: status === "reviewed" ? now : null,
    resolved_at: status === "resolved" ? now : null,
    dismissed_at: status === "dismissed" ? now : null
  });

  if (error) {
    throw new Error(error.message);
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId: organizationId || null,
    action:
      status === "resolved"
        ? "admin.compliance.resolved"
        : status === "dismissed"
          ? "admin.compliance.dismissed"
          : "admin.compliance.reviewed",
    entityType: "platform_compliance_reviews",
    entityId: issueKey,
    metadata: { issue_type: issueType, status }
  });
  revalidatePath("/admin/compliance");
  revalidatePath(`/admin/organizations/${organizationId}/compliance`);
  redirect(organizationId ? `/admin/organizations/${organizationId}/compliance` : "/admin/compliance");
}

export async function endOrganizationManagerSessionsAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "manager_session.end"
  });
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("platform_admin_sessions")
    .update({ status: "ended", ended_at: now })
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .is("ended_at", null)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.manager_session.ended_by_admin",
    metadata: { ended_count: data?.length ?? 0 }
  });
}

export async function runOrganizationHealthCheckAction(formData: FormData) {
  const organizationId = stringField(formData, "organizationId");
  const { admin, supabase } = await requireAdminAction({
    organizationId,
    action: "organization.run_health_check"
  });
  const [
    organizationResult,
    servicesResult,
    customersResult,
    optInResult,
    smsResult,
    controlsResult
  ] = await Promise.all([
    supabase.from("organizations").select("id").eq("id", organizationId).maybeSingle(),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("active", true),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("sms_consents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "opted_in"),
    supabase
      .from("sms_messages")
      .select("provider, direction, status, status_callback_received_at, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(200),
    supabase
      .from("platform_organization_admin_controls")
      .select("sms_sending_paused, disabled_at")
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  if (organizationResult.error || !organizationResult.data) {
    throw new Error(organizationResult.error?.message ?? "Organization not found.");
  }

  const recentSms = smsResult.data ?? [];
  const failedSms = recentSms.filter((message) => isFailedSmsStatus(message.status)).length;
  const missingCallbacks = recentSms.filter((message) =>
    hasMissingStatusCallback({
      provider: message.provider,
      direction: message.direction,
      status: message.status,
      statusCallbackReceivedAt: message.status_callback_received_at,
      createdAt: message.created_at
    })
  ).length;
  const status =
    controlsResult.data?.disabled_at
      ? "blocked"
      : failedSms > 0 || missingCallbacks > 0 || controlsResult.data?.sms_sending_paused
        ? "warning"
        : "healthy";
  const payload = {
    services_active: servicesResult.count ?? 0,
    customers_total: customersResult.count ?? 0,
    opted_in_customers: optInResult.count ?? 0,
    recent_sms: recentSms.length,
    recent_failed_sms: failedSms,
    missing_callbacks: missingCallbacks,
    sms_paused: Boolean(controlsResult.data?.sms_sending_paused),
    disabled: Boolean(controlsResult.data?.disabled_at)
  } satisfies Record<string, unknown>;
  const { error } = await supabase.from("platform_organization_admin_controls").upsert({
    organization_id: organizationId,
    last_health_check_at: new Date().toISOString(),
    last_health_check_status: status,
    last_health_check_payload: payload as Json
  });

  if (error) {
    throw new Error(error.message);
  }

  await auditAndRefresh({
    admin,
    organizationId,
    action: "admin.organization.health_check_ran",
    metadata: payload
  });
}
