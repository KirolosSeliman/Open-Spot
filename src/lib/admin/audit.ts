import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

export type PlatformAdminAuditActor = {
  id: string;
  userId: string;
  email: string;
};

function toJsonObject(metadata: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(metadata)) as Json;
}

export async function recordPlatformAdminAuditLog({
  admin,
  organizationId = null,
  action,
  entityType = null,
  entityId = null,
  metadata = {}
}: {
  admin: PlatformAdminAuditActor;
  organizationId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("platform_admin_audit_logs").insert({
    platform_admin_id: admin.id,
    admin_user_id: admin.userId,
    admin_email: admin.email,
    organization_id: organizationId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: toJsonObject(metadata)
  });

  if (error) {
    console.error("Platform admin audit log write failed:", error.message);
  }
}
