import "server-only";

import { notFound, redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { PlatformAdminRole } from "@/lib/platform-admin/helpers";

export type PlatformAdminSession = {
  userId: string;
  email: string | null;
  role: PlatformAdminRole;
  active: true;
};

export async function requirePlatformAdmin(options?: {
  allowedRoles?: PlatformAdminRole[];
}): Promise<PlatformAdminSession> {
  if (!isSupabaseConfigured()) {
    redirect("/sign-in");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in");
  }

  const serviceSupabase = createSupabaseServiceClient();

  if (!serviceSupabase) {
    notFound();
  }

  const { data: admin, error: adminError } = await serviceSupabase
    .from("platform_admins")
    .select("user_id, role, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (adminError || !admin) {
    notFound();
  }

  if (
    options?.allowedRoles &&
    !options.allowedRoles.includes(admin.role as PlatformAdminRole)
  ) {
    notFound();
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: admin.role as PlatformAdminRole,
    active: true
  };
}
