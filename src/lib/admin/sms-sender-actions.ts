"use server";

import { revalidatePath } from "next/cache";

import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import {
  getOrCreateOrganizationSmsSender,
  loadOrganizationSmsSender,
  toSafeOrganizationSmsSenderView,
  updateOrganizationSmsSender
} from "@/lib/sms/organization-sender";
import {
  computeSmsSenderReadiness,
  deriveSenderStatusFromConfig
} from "@/lib/sms/sms-setup-readiness";
import {
  activateOrganizationSmsSender,
  assignTwilioNumberToOrganization,
  blockOrganizationSmsSender,
  configureTwilioWebhooksForOrganization,
  connectTwilioSubaccountForOrganization,
  createOrUpdateTwilioMessagingServiceForOrganization,
  createTwilioSubaccountForOrganization,
  listTwilioNumbersForOrganization,
  pauseOrganizationSmsSender,
  sendOrganizationTestSms,
  syncTwilioSubaccountForOrganization,
  verifyTwilioConfigurationForOrganization
} from "@/lib/sms/twilio-admin";
import { DEFAULT_ORGANIZATION_TEST_SMS_BODY } from "@/lib/sms/organization-sms-copy";
import { getSafeTwilioUiError } from "@/lib/sms/twilio-ui-errors";
import { validateE164 } from "@/lib/sms/twilio-validation";
import { loadOrganizationSmsReadiness } from "@/lib/sms/organization-gate";
import {
  requireCurrentPlatformAdmin,
  type AuthorizedPlatformAdmin
} from "@/lib/auth/platform-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type SmsSenderActionResult = {
  ok: boolean;
  message: string;
};

function stringField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function actionErrorMessage(error: unknown) {
  return getSafeTwilioUiError(error).message;
}

async function requireSuperAdmin(): Promise<AuthorizedPlatformAdmin> {
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    throw new Error("Platform admin access is required.");
  }

  if (access.admin.role !== "super_admin") {
    throw new Error("This action requires super_admin privileges.");
  }

  return access.admin;
}

async function requirePlatformAdmin(): Promise<AuthorizedPlatformAdmin> {
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    throw new Error("Platform admin access is required.");
  }

  return access.admin;
}

function refreshSmsPage(organizationId: string) {
  revalidatePath(`/admin/organizations/${organizationId}/sms`);
  revalidatePath(`/admin/organizations/${organizationId}`);
}

async function auditSmsAction({
  admin,
  organizationId,
  action,
  metadata = {}
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action,
    entityType: "organization_sms_senders",
    entityId: organizationId,
    metadata
  });
}

export async function createTwilioSubaccountAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const organizationName = stringField(formData, "organizationName");
    const admin = await requireSuperAdmin();
    const supabase = createSupabaseServiceClient();

    if (!supabase) {
      return { ok: false, message: "Service client not configured." };
    }

    await getOrCreateOrganizationSmsSender({
      organizationId,
      createdByPlatformAdminId: admin.id
    });
    await createTwilioSubaccountForOrganization({
      organizationId,
      organizationName,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_subaccount_created"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Sous-compte Twilio créé." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function connectTwilioSubaccountAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const subaccountSid = stringField(formData, "subaccountSid");
    const admin = await requireSuperAdmin();

    await getOrCreateOrganizationSmsSender({
      organizationId,
      createdByPlatformAdminId: admin.id
    });
    await connectTwilioSubaccountForOrganization({
      organizationId,
      subaccountSid,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_subaccount_connected",
      metadata: { subaccount_sid_masked: subaccountSid.slice(0, 4) + "..." }
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Sous-compte Twilio connecté." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function verifyTwilioConfigurationAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const organizationName = stringField(formData, "organizationName");
    const admin = await requireSuperAdmin();

    await verifyTwilioConfigurationForOrganization({
      organizationId,
      organizationName,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_sender_synced",
      metadata: { mode: "live_verification" }
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Configuration Twilio vérifiée et synchronisée." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function syncTwilioSenderAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const organizationName = stringField(formData, "organizationName");
    const admin = await requireSuperAdmin();

    await syncTwilioSubaccountForOrganization({
      organizationId,
      organizationName,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_sender_synced"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Configuration synchronisée depuis Twilio." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function assignTwilioPhoneNumberAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const phoneNumberSid = stringField(formData, "phoneNumberSid");
    const admin = await requireSuperAdmin();

    await assignTwilioNumberToOrganization({
      organizationId,
      phoneNumberSid,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_number_assigned"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Numéro SMS assigné." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function createOrUpdateMessagingServiceAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  let organizationId = "";
  let admin: AuthorizedPlatformAdmin | null = null;

  try {
    organizationId = stringField(formData, "organizationId");
    const organizationName = stringField(formData, "organizationName");
    admin = await requireSuperAdmin();

    await createOrUpdateTwilioMessagingServiceForOrganization({
      organizationId,
      organizationName,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_messaging_service_updated"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Service d'envoi configuré." };
  } catch (error) {
    if (admin && organizationId) {
      const safe = getSafeTwilioUiError(error);
      await auditSmsAction({
        admin,
        organizationId,
        action: "admin.organization.sms_messaging_service_attach_failed",
        metadata: {
          error_code: safe.twilioCode ?? null,
          message: safe.message
        }
      });
    }

    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function configureTwilioWebhooksAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const admin = await requireSuperAdmin();

    await configureTwilioWebhooksForOrganization({
      organizationId,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_webhooks_configured"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Webhooks Twilio configurés." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function sendSmsSetupTestAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const testPhoneE164 = stringField(formData, "testPhoneE164");
    const testMessageBody =
      stringField(formData, "testMessageBody") || DEFAULT_ORGANIZATION_TEST_SMS_BODY;
    const admin = await requireSuperAdmin();

    if (!validateE164(testPhoneE164)) {
      return { ok: false, message: "Numéro de test invalide (E.164 requis)." };
    }

    await sendOrganizationTestSms({
      organizationId,
      testPhoneE164,
      testMessageBody,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_test_sent",
      metadata: { phone_last4: testPhoneE164.slice(-4) }
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "SMS test envoyé." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function runFullSmsSetupTestAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  const testResult = await sendSmsSetupTestAction(formData);

  if (!testResult.ok) {
    return testResult;
  }

  return {
    ok: true,
    message:
      "SMS de test envoyé. Vérifiez la réception, attendez le callback de statut, puis testez STOP/AIDE manuellement."
  };
}

export async function activateSmsForOrganizationAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const admin = await requireSuperAdmin();
    const supabase = createSupabaseServiceClient();

    if (!supabase) {
      return { ok: false, message: "Service client not configured." };
    }

    const [sender, organizationReadiness] = await Promise.all([
      loadOrganizationSmsSender(organizationId),
      loadOrganizationSmsReadiness(supabase, organizationId)
    ]);
    const readiness = computeSmsSenderReadiness({
      sender,
      organizationReadiness
    });

    if (!readiness.canActivate) {
      return {
        ok: false,
        message: readiness.blockingReasons.join(" · ")
      };
    }

    await activateOrganizationSmsSender({
      organizationId,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_activated",
      metadata: {
        billing_status: organizationReadiness.billingStatus,
        sms_status: "active"
      }
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "SMS activés pour cette compagnie." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function pauseSmsForOrganizationAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const admin = await requireSuperAdmin();

    await pauseOrganizationSmsSender({
      organizationId,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_sender_paused"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Sender SMS mis en pause." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function blockSmsForOrganizationAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const admin = await requireSuperAdmin();

    await blockOrganizationSmsSender({
      organizationId,
      platformAdminId: admin.id
    });
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_sender_blocked"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Sender SMS bloqué." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function approveSmsComplianceAction(
  formData: FormData
): Promise<SmsSenderActionResult> {
  try {
    const organizationId = stringField(formData, "organizationId");
    const admin = await requirePlatformAdmin();
    const sender = await loadOrganizationSmsSender(organizationId);

    if (!sender) {
      return { ok: false, message: "Configuration SMS non démarrée." };
    }

    await updateOrganizationSmsSender(
      organizationId,
      {
        compliance_status: "approved",
        stop_help_status: "active",
        sender_status: deriveSenderStatusFromConfig({
          ...sender,
          compliance_status: "approved",
          stop_help_status: "active"
        })
      },
      admin.id
    );
    await auditSmsAction({
      admin,
      organizationId,
      action: "admin.organization.sms_compliance_approved"
    });
    refreshSmsPage(organizationId);

    return { ok: true, message: "Conformité SMS approuvée." };
  } catch (error) {
    return {
      ok: false,
      message: actionErrorMessage(error)
    };
  }
}

export async function listTwilioPhoneNumbersAction(organizationId: string) {
  await requireSuperAdmin();

  try {
    const numbers = await listTwilioNumbersForOrganization({ organizationId });

    return {
      ok: true as const,
      numbers: numbers.map((number) => ({
        sid: number.sid,
        phoneE164: number.phoneE164,
        friendlyName: number.friendlyName
      }))
    };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : "Unable to list numbers."
    };
  }
}

export async function loadSafeOrganizationSmsSenderView(organizationId: string) {
  const sender = await loadOrganizationSmsSender(organizationId);

  return toSafeOrganizationSmsSenderView(sender);
}
