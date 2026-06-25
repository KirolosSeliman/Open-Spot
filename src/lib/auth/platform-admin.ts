import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type PlatformAdminEnv = Partial<Record<string, string | undefined>>;

export type PlatformAdminRole =
  | "super_admin"
  | "account_admin"
  | "support_admin"
  | "analyst";
export type PlatformAdminStatus = "active" | "inactive" | "suspended";
export type PlatformAdminAccessLevel = "read_only" | "support" | "manager_mode";

export type AuthorizedPlatformAdmin = {
  id: string;
  userId: string;
  email: string;
  role: PlatformAdminRole;
  status: "active";
};

export type PlatformAdminAccess =
  | {
      status: "unconfigured";
      message: string;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "forbidden";
      email: string | null;
      reason: string;
    }
  | {
      status: "authorized";
      admin: AuthorizedPlatformAdmin;
    };

export type PlatformAdminState =
  | Extract<PlatformAdminAccess, { status: "unconfigured" }>
  | {
      status: "configured";
      message: string;
    };

export function getConfiguredPlatformAdminEmails(
  env: PlatformAdminEnv = process.env
): string[] {
  return (env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(
  email: string | null | undefined,
  env: PlatformAdminEnv = process.env
): boolean {
  return isConfiguredPlatformAdminEmail(email, env);
}

export function isConfiguredPlatformAdminEmail(
  email: string | null | undefined,
  env: PlatformAdminEnv = process.env
): boolean {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return getConfiguredPlatformAdminEmails(env).includes(normalizedEmail);
}

import { getSafeInternalRedirectPath } from "@/lib/auth/safe-redirect";

export { getSafeInternalRedirectPath };

export function getPostSignInRedirectPath({
  email,
  requestedRedirect,
  fallbackPath = "/dashboard",
  env = process.env
}: {
  email: string | null | undefined;
  requestedRedirect?: string | null;
  fallbackPath?: string;
  env?: PlatformAdminEnv;
}) {
  if (isConfiguredPlatformAdminEmail(email, env)) {
    return "/admin";
  }

  const safeRedirect = getSafeInternalRedirectPath(requestedRedirect);

  if (
    safeRedirect &&
    safeRedirect !== "/admin" &&
    !safeRedirect.startsWith("/admin/") &&
    !safeRedirect.startsWith("/admin?")
  ) {
    return safeRedirect;
  }

  return fallbackPath;
}

async function recordBootstrapAuditLog(admin: AuthorizedPlatformAdmin) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("platform_admin_audit_logs").insert({
    platform_admin_id: admin.id,
    admin_user_id: admin.userId,
    admin_email: admin.email,
    action: "platform_admin.bootstrap_created",
    entity_type: "platform_admins",
    entity_id: admin.id,
    metadata: {
      source: "PLATFORM_ADMIN_EMAILS"
    }
  });

  if (error) {
    console.error("Platform admin bootstrap audit failed:", error.message);
  }
}

export async function getCurrentPlatformAdminAccess(): Promise<PlatformAdminAccess> {
  if (!isSupabaseConfigured()) {
    return {
      status: "unconfigured",
      message: "Platform admin access is locked until Supabase is configured."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      status: "unauthenticated"
    };
  }

  const email = user.email ?? null;
  const normalizedEmail = email?.trim().toLowerCase() ?? null;

  if (!normalizedEmail) {
    return {
      status: "forbidden",
      email,
      reason: "Authenticated user has no email."
    };
  }

  const serviceSupabase = createSupabaseServiceClient();

  if (!serviceSupabase) {
    return {
      status: "unconfigured",
      message:
        "Admin database is not configured. Run migrations and configure service role access."
    };
  }

  const { data: existingAdmin, error: existingAdminError } = await serviceSupabase
    .from("platform_admins")
    .select("id, user_id, email, role, status")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingAdminError) {
    return {
      status: "unconfigured",
      message:
        "Admin database is not configured. Run migrations and configure PLATFORM_ADMIN_EMAILS for bootstrap."
    };
  }

  if (existingAdmin) {
    if (existingAdmin.status !== "active") {
      return {
        status: "forbidden",
        email: normalizedEmail,
        reason: `Platform admin is ${existingAdmin.status}.`
      };
    }

    if (existingAdmin.user_id && existingAdmin.user_id !== user.id) {
      return {
        status: "forbidden",
        email: normalizedEmail,
        reason: "Platform admin email is already bound to another auth user."
      };
    }

    if (!existingAdmin.user_id) {
      const { error: bindError } = await serviceSupabase
        .from("platform_admins")
        .update({
          user_id: user.id,
          last_seen_at: new Date().toISOString()
        })
        .eq("id", existingAdmin.id);

      if (bindError) {
        return {
          status: "forbidden",
          email: normalizedEmail,
          reason: "Unable to bind admin record to current auth user."
        };
      }
    } else {
      await serviceSupabase
        .from("platform_admins")
        .update({
          last_seen_at: new Date().toISOString()
        })
        .eq("id", existingAdmin.id);
    }

    return {
      status: "authorized",
      admin: {
        id: existingAdmin.id,
        userId: user.id,
        email: normalizedEmail,
        role: existingAdmin.role,
        status: "active"
      }
    };
  }

  if (!isConfiguredPlatformAdminEmail(normalizedEmail)) {
    return {
      status: "forbidden",
      email: normalizedEmail,
      reason: "Email is not configured as a platform admin."
    };
  }

  const { data: bootstrappedAdmin, error: bootstrapError } = await serviceSupabase
    .from("platform_admins")
    .insert({
      user_id: user.id,
      email: normalizedEmail,
      role: "super_admin",
      status: "active",
      active: true,
      last_seen_at: new Date().toISOString()
    })
    .select("id, email, role")
    .single();

  if (bootstrapError || !bootstrappedAdmin) {
    return {
      status: "forbidden",
      email: normalizedEmail,
      reason: bootstrapError?.message ?? "Unable to bootstrap platform admin."
    };
  }

  const admin: AuthorizedPlatformAdmin = {
    id: bootstrappedAdmin.id,
    userId: user.id,
    email: bootstrappedAdmin.email,
    role: bootstrappedAdmin.role,
    status: "active"
  };

  await recordBootstrapAuditLog(admin);

  return {
    status: "authorized",
    admin
  };
}

export async function requireCurrentPlatformAdmin() {
  const access = await getCurrentPlatformAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/sign-in?redirect=/admin");
  }

  if (access.status === "forbidden") {
    redirect("/dashboard");
  }

  return access;
}

export function getPlatformAdminState(): PlatformAdminState {
  if (!isSupabaseConfigured() || getConfiguredPlatformAdminEmails().length === 0) {
    return {
      status: "unconfigured",
      message:
        "Platform admin access is locked until Supabase and PLATFORM_ADMIN_EMAILS are configured."
    };
  }

  return {
    status: "configured",
    message:
      "Platform admin access must be checked against authenticated user email before data is shown."
  };
}
