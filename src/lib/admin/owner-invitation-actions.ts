"use server";

import { revalidatePath } from "next/cache";

import { resendCompanyOwnerInvitation } from "@/lib/admin/owner-invitation";
import type { ResendCompanyOwnerInvitationResult } from "@/lib/admin/owner-invitation";
import { getCurrentPlatformAdminAccess } from "@/lib/auth/platform-admin";

export async function resendCompanyOwnerInvitationAction(
  organizationId: string
): Promise<ResendCompanyOwnerInvitationResult> {
  const access = await getCurrentPlatformAdminAccess();

  if (access.status !== "authorized") {
    return {
      ok: false,
      code: "unauthorized",
      message: "Vous n'avez pas l'autorisation de renvoyer ce courriel."
    };
  }

  const result = await resendCompanyOwnerInvitation({
    organizationId,
    admin: access.admin
  });

  revalidatePath(`/admin/organizations/${organizationId}`);

  return result;
}
