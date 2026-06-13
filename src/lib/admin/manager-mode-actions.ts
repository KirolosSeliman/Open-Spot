"use server";

import { redirect } from "next/navigation";

import {
  endPlatformAdminManagerMode,
  getCurrentAdminForManagerModeStart,
  startPlatformAdminManagerMode
} from "@/lib/admin/manager-mode";

export async function startManagerModeAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!organizationId) {
    redirect("/admin/organizations");
  }

  if (reason.length < 3) {
    redirect(
      `/admin/organizations/${organizationId}?managerModeError=${encodeURIComponent(
        "A support reason of at least 3 characters is required."
      )}`
    );
  }

  try {
    const admin = await getCurrentAdminForManagerModeStart();
    await startPlatformAdminManagerMode({
      admin,
      organizationId,
      reason
    });
  } catch (error) {
    redirect(
      `/admin/organizations/${organizationId}?managerModeError=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Manager mode could not be started."
      )}`
    );
  }

  redirect("/dashboard");
}

export async function exitManagerModeAction() {
  const endedSession = await endPlatformAdminManagerMode();

  redirect(
    endedSession
      ? `/admin/organizations/${endedSession.organizationId}`
      : "/admin/organizations"
  );
}
