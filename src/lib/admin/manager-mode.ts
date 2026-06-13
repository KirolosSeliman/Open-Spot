import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import type {
  AuthorizedPlatformAdmin,
  PlatformAdminAccessLevel,
  PlatformAdminRole
} from "@/lib/auth/platform-admin";
import { getCurrentPlatformAdminAccess } from "@/lib/auth/platform-admin";
import { requireOrganizationNotDisabled } from "@/lib/admin/organization-controls";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

export const PLATFORM_ADMIN_MANAGER_MODE_COOKIE =
  "open_spot_platform_manager_session";
export const PLATFORM_ADMIN_MANAGER_MODE_TTL_MINUTES = 60;

type PlatformAdminSessionRow =
  Database["public"]["Tables"]["platform_admin_sessions"]["Row"];

export type ActivePlatformAdminManagerMode = {
  sessionId: string;
  platformAdminId: string;
  adminUserId: string;
  adminEmail: string;
  organizationId: string;
  organizationName: string;
  actingRole: "manager";
  reason: string;
  startedAt: string;
  expiresAt: string;
};

export type ManagerModeAccessInput = {
  adminRole: PlatformAdminRole;
  accessLevel?: PlatformAdminAccessLevel | "super_admin" | null;
  revokedAt?: string | null;
  adminStatus?: "active" | "inactive" | "suspended";
};

export function canOpenPlatformAdminManagerMode({
  adminRole,
  accessLevel,
  revokedAt = null,
  adminStatus = "active"
}: ManagerModeAccessInput) {
  if (adminStatus !== "active" || revokedAt) {
    return false;
  }

  return adminRole === "super_admin" || accessLevel === "manager_mode";
}

export function isPlatformAdminManagerSessionActive({
  status,
  endedAt,
  expiresAt,
  now = new Date()
}: {
  status: string;
  endedAt: string | null;
  expiresAt: string;
  now?: Date;
}) {
  return status === "active" && !endedAt && Date.parse(expiresAt) > now.getTime();
}

function getManagerModeExpiresAt(now = new Date()) {
  const expiresAt = new Date(now);
  expiresAt.setMinutes(
    expiresAt.getMinutes() + PLATFORM_ADMIN_MANAGER_MODE_TTL_MINUTES
  );
  return expiresAt;
}

async function setManagerModeCookie(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(PLATFORM_ADMIN_MANAGER_MODE_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function clearManagerModeCookie() {
  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_ADMIN_MANAGER_MODE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

async function getCookieSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(PLATFORM_ADMIN_MANAGER_MODE_COOKIE)?.value ?? null;
}

function toActiveManagerModeSession(
  row: PlatformAdminSessionRow,
  organizationName: string
): ActivePlatformAdminManagerMode {
  return {
    sessionId: row.id,
    platformAdminId: row.platform_admin_id,
    adminUserId: row.admin_user_id,
    adminEmail: row.admin_email,
    organizationId: row.organization_id,
    organizationName,
    actingRole: "manager",
    reason: row.reason,
    startedAt: row.started_at,
    expiresAt: row.expires_at
  };
}

export async function startPlatformAdminManagerMode({
  admin,
  organizationId,
  reason
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
  reason: string;
}) {
  const cleanedReason = reason.trim().slice(0, 500);

  if (cleanedReason.length < 3) {
    throw new Error("A support reason of at least 3 characters is required.");
  }

  const serviceSupabase = createSupabaseServiceClient();

  if (!serviceSupabase) {
    throw new Error("Admin service client is not configured.");
  }

  const [organizationResult, accessResult] = await Promise.all([
    serviceSupabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle(),
    admin.role === "super_admin"
      ? Promise.resolve({ data: null, error: null })
      : serviceSupabase
          .from("platform_admin_organization_access")
          .select("access_level, revoked_at")
          .eq("platform_admin_id", admin.id)
          .eq("organization_id", organizationId)
          .is("revoked_at", null)
          .maybeSingle()
  ]);

  if (organizationResult.error || !organizationResult.data) {
    notFound();
  }

  await requireOrganizationNotDisabled(organizationId);

  if (accessResult.error) {
    throw new Error(accessResult.error.message);
  }

  const accessLevel =
    admin.role === "super_admin" ? "super_admin" : accessResult.data?.access_level;

  if (
    !canOpenPlatformAdminManagerMode({
      adminRole: admin.role,
      accessLevel,
      revokedAt: accessResult.data?.revoked_at ?? null,
      adminStatus: admin.status
    })
  ) {
    throw new Error("Manager mode access is not granted for this company.");
  }

  await serviceSupabase
    .from("platform_admin_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString()
    })
    .eq("admin_user_id", admin.userId)
    .eq("status", "active")
    .is("ended_at", null);

  const expiresAt = getManagerModeExpiresAt();
  const { data: session, error: sessionError } = await serviceSupabase
    .from("platform_admin_sessions")
    .insert({
      platform_admin_id: admin.id,
      admin_user_id: admin.userId,
      admin_email: admin.email,
      organization_id: organizationId,
      acting_role: "manager",
      reason: cleanedReason,
      status: "active",
      expires_at: expiresAt.toISOString()
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "Unable to start manager mode.");
  }

  await setManagerModeCookie(session.id, expiresAt);
  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "admin.manager_mode.started",
    entityType: "platform_admin_sessions",
    entityId: session.id,
    metadata: {
      reason: cleanedReason,
      acting_role: "manager",
      expires_at: expiresAt.toISOString()
    }
  });

  return {
    sessionId: session.id
  };
}

export async function getActivePlatformAdminManagerMode() {
  const sessionId = await getCookieSessionId();

  if (!sessionId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    await clearManagerModeCookie();
    return null;
  }

  const serviceSupabase = createSupabaseServiceClient();

  if (!serviceSupabase) {
    await clearManagerModeCookie();
    return null;
  }

  const { data: session, error } = await serviceSupabase
    .from("platform_admin_sessions")
    .select(
      "id, platform_admin_id, admin_user_id, admin_email, organization_id, acting_role, reason, status, started_at, expires_at, ended_at, created_at"
    )
    .eq("id", sessionId)
    .eq("admin_user_id", user.id)
    .maybeSingle();

  if (error || !session) {
    await clearManagerModeCookie();
    return null;
  }

  if (
    !isPlatformAdminManagerSessionActive({
      status: session.status,
      endedAt: session.ended_at,
      expiresAt: session.expires_at
    })
  ) {
    if (session.status === "active" && !session.ended_at) {
      await serviceSupabase
        .from("platform_admin_sessions")
        .update({ status: "expired" })
        .eq("id", session.id);
    }

    await clearManagerModeCookie();
    return null;
  }

  const { data: organization } = await serviceSupabase
    .from("organizations")
    .select("name")
    .eq("id", session.organization_id)
    .maybeSingle();

  return toActiveManagerModeSession(session, organization?.name ?? "Organization");
}

export async function endPlatformAdminManagerMode() {
  const activeSession = await getActivePlatformAdminManagerMode();
  await clearManagerModeCookie();

  if (!activeSession) {
    return null;
  }

  const serviceSupabase = createSupabaseServiceClient();

  if (!serviceSupabase) {
    return activeSession;
  }

  await serviceSupabase
    .from("platform_admin_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString()
    })
    .eq("id", activeSession.sessionId);

  await recordPlatformAdminAuditLog({
    admin: {
      id: activeSession.platformAdminId,
      userId: activeSession.adminUserId,
      email: activeSession.adminEmail
    },
    organizationId: activeSession.organizationId,
    action: "admin.manager_mode.ended",
    entityType: "platform_admin_sessions",
    entityId: activeSession.sessionId,
    metadata: {
      source: "exit_manager_mode"
    }
  });

  return activeSession;
}

export async function requireActivePlatformAdminManagerMode() {
  const session = await getActivePlatformAdminManagerMode();

  if (!session) {
    throw new Error("Active platform admin manager mode is required.");
  }

  return session;
}

export async function recordManagerModeDashboardAction({
  action,
  entityType = null,
  entityId = null,
  metadata = {}
}: {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const session = await getActivePlatformAdminManagerMode();

  if (!session) {
    return;
  }

  await recordPlatformAdminAuditLog({
    admin: {
      id: session.platformAdminId,
      userId: session.adminUserId,
      email: session.adminEmail
    },
    organizationId: session.organizationId,
    action,
    entityType,
    entityId,
    metadata: {
      ...metadata,
      manager_mode_session_id: session.sessionId,
      acting_role: "manager"
    }
  });
}

export async function getCurrentAdminForManagerModeStart() {
  const access = await getCurrentPlatformAdminAccess();

  if (access.status !== "authorized") {
    throw new Error("Platform admin access is required.");
  }

  return access.admin;
}
