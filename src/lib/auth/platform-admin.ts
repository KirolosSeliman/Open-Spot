import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PlatformAdminEnv = Partial<Record<string, string | undefined>>;

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
    }
  | {
      status: "authorized";
      email: string;
      userId: string;
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
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return getConfiguredPlatformAdminEmails(env).includes(normalizedEmail);
}

export function getSafeInternalRedirectPath(
  redirectValue: string | null | undefined
): string | null {
  const value = redirectValue?.trim();

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value, "https://open-spot.local");

    if (url.origin !== "https://open-spot.local") {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

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
  if (isPlatformAdminEmail(email, env)) {
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

  if (getConfiguredPlatformAdminEmails().length === 0) {
    return {
      status: "unconfigured",
      message:
        "Platform admin access is locked until PLATFORM_ADMIN_EMAILS is configured."
    };
  }

  if (!email || !isPlatformAdminEmail(email)) {
    return {
      status: "forbidden",
      email
    };
  }

  return {
    status: "authorized",
    email,
    userId: user.id
  };
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
