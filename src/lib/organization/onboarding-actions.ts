"use server";

import { redirect } from "next/navigation";

import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { parseOnboardingFormData } from "@/lib/organization/client-onboarding";
import {
  ensureOnboardingSubmission,
  updateAdminOnboardingReview,
  updatePublicOnboardingSubmission
} from "@/lib/organization/onboarding-records";
import {
  generateOnboardingToken,
  hashOnboardingToken
} from "@/lib/organization/onboarding-tokens";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function requireAdmin(access: Awaited<ReturnType<typeof requireCurrentPlatformAdmin>>) {
  if (access.status !== "authorized") {
    throw new Error(
      access.status === "unconfigured"
        ? access.message
        : "Platform admin access is required."
    );
  }

  return access.admin;
}

export async function saveClientOnboardingAction(formData: FormData) {
  const token = clean(formData.get("token"));
  const intent = clean(formData.get("intent"));
  const submit = intent === "submit";
  const parsed = parseOnboardingFormData(formData, {
    requireConsent: submit
  });

  if (!token) {
    redirect("/onboarding/invalid?error=missing-token");
  }

  if (!parsed.ok) {
    redirect(
      `/onboarding/${encodeURIComponent(token)}?error=${encodeURIComponent(
        parsed.errors.join(" ")
      )}`
    );
  }

  try {
    await updatePublicOnboardingSubmission({
      token,
      input: parsed.value,
      submit
    });
  } catch (error) {
    redirect(
      `/onboarding/${encodeURIComponent(token)}?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to save onboarding."
      )}`
    );
  }

  redirect(
    `/onboarding/${encodeURIComponent(token)}?${submit ? "submitted=1" : "saved=1"}`
  );
}

export async function generateOnboardingLinkAction(formData: FormData) {
  const organizationId = clean(formData.get("organizationId"));
  const access = await requireCurrentPlatformAdmin();
  const admin = requireAdmin(access);

  if (!organizationId) {
    redirect("/admin/organizations?onboardingError=missing-organization");
  }

  const token = generateOnboardingToken();
  const tokenHash = hashOnboardingToken(token);
  const tokenExpiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 30
  ).toISOString();

  try {
    await ensureOnboardingSubmission({
      organizationId,
      tokenHash,
      tokenExpiresAt,
      admin
    });
  } catch (error) {
    redirect(
      `/admin/organizations/${organizationId}/onboarding?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Unable to generate onboarding link."
      )}`
    );
  }

  redirect(
    `/admin/organizations/${organizationId}/onboarding?token=${encodeURIComponent(
      token
    )}&generated=1`
  );
}

export async function requestOnboardingChangesAction(formData: FormData) {
  const organizationId = clean(formData.get("organizationId"));
  const requestedChanges = clean(formData.get("requestedChanges"));
  const adminNotes = clean(formData.get("adminNotes")) || null;
  const access = await requireCurrentPlatformAdmin();
  const admin = requireAdmin(access);

  if (!organizationId || !requestedChanges) {
    redirect(
      `/admin/organizations/${organizationId || ""}/onboarding?error=${encodeURIComponent(
        "Requested changes are required."
      )}`
    );
  }

  await updateAdminOnboardingReview({
    organizationId,
    admin,
    status: "changes_requested",
    requestedChanges,
    adminNotes
  });

  redirect(`/admin/organizations/${organizationId}/onboarding?reviewed=changes`);
}

export async function markOnboardingReadyForSmsAction(formData: FormData) {
  const organizationId = clean(formData.get("organizationId"));
  const adminNotes = clean(formData.get("adminNotes")) || null;
  const access = await requireCurrentPlatformAdmin();
  const admin = requireAdmin(access);

  await updateAdminOnboardingReview({
    organizationId,
    admin,
    status: "ready_for_sms_setup",
    adminNotes,
    requestedChanges: null
  });

  redirect(`/admin/organizations/${organizationId}/onboarding?reviewed=ready`);
}

export async function completeOnboardingAction(formData: FormData) {
  const organizationId = clean(formData.get("organizationId"));
  const adminNotes = clean(formData.get("adminNotes")) || null;
  const access = await requireCurrentPlatformAdmin();
  const admin = requireAdmin(access);

  await updateAdminOnboardingReview({
    organizationId,
    admin,
    status: "completed",
    adminNotes,
    requestedChanges: null
  });

  redirect(`/admin/organizations/${organizationId}/onboarding?reviewed=completed`);
}
