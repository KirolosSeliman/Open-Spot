import type {
  AuthorizedPlatformAdmin,
  PlatformAdminAccessLevel
} from "@/lib/auth/platform-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function getAdminVisibleOrganizationIds(admin: AuthorizedPlatformAdmin) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  if (admin.role === "super_admin") {
    const { data, error } = await supabase.from("organizations").select("id");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => row.id);
  }

  const { data, error } = await supabase
    .from("platform_admin_organization_access")
    .select("organization_id")
    .eq("platform_admin_id", admin.id)
    .is("revoked_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.organization_id);
}

export async function getAdminOrganizationAccessLevel({
  admin,
  organizationId
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
}): Promise<PlatformAdminAccessLevel | "super_admin" | null> {
  if (admin.role === "super_admin") {
    return "super_admin";
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const { data, error } = await supabase
    .from("platform_admin_organization_access")
    .select("access_level")
    .eq("platform_admin_id", admin.id)
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.access_level ?? null;
}

export async function assertAdminCanAccessOrganization({
  admin,
  organizationId
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
}) {
  const accessLevel = await getAdminOrganizationAccessLevel({
    admin,
    organizationId
  });

  if (!accessLevel) {
    throw new Error("You do not have access to this organization.");
  }

  return accessLevel;
}
