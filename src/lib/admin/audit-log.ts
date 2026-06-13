import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const pageSize = 50;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function loadPlatformAdminAuditLog({
  admin,
  searchParams = {}
}: {
  admin: AuthorizedPlatformAdmin;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const page = Math.max(1, Number(one(searchParams.page) ?? 1) || 1);
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const { data, error } = await supabase
    .from("platform_admin_audit_logs")
    .select("id, platform_admin_id, admin_email, organization_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize);

  if (error) {
    throw new Error(error.message);
  }

  await recordPlatformAdminAuditLog({
    admin,
    action: "admin.audit.viewed",
    entityType: "platform_admin_audit_logs",
    metadata: { page }
  });

  return {
    page,
    rows: (data ?? []).slice(0, pageSize),
    hasNextPage: (data ?? []).length > pageSize
  };
}
