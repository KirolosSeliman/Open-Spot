import "server-only";

import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAuthEmailClient } from "@/lib/auth/auth-email-client";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  buildInvitationRedirectUrl,
  buildPasswordRecoveryRedirectUrl
} from "@/lib/book-call/invitation-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ResendCompanyOwnerInvitationResult =
  | {
      ok: true;
      message: string;
      sentTo: string;
      method: "invite" | "recovery" | "signup_resend";
      sentAt: string;
    }
  | {
      ok: false;
      code:
        | "unauthorized"
        | "company_not_found"
        | "missing_owner_email"
        | "invalid_owner_email"
        | "missing_server_config"
        | "rate_limited"
        | "supabase_auth_error"
        | "unknown_error";
      message: string;
    };

export type ResendOwnerInvitationResult = ResendCompanyOwnerInvitationResult;

function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!domain) {
    return "***";
  }

  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function mapSupabaseAuthError(message: string): ResendCompanyOwnerInvitationResult {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("rate limit") ||
    normalized.includes("rate_limit") ||
    normalized.includes("too many")
  ) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Un courriel vient déjà d'être envoyé. Réessayez dans une minute."
    };
  }

  return {
    ok: false,
    code: "supabase_auth_error",
    message:
      message ||
      "Impossible de renvoyer le courriel pour le moment. Vérifiez la configuration Supabase Auth."
  };
}

async function findAuthUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email
    );

    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

async function resolveAuthUser(email: string, ownerUserId?: string | null) {
  const supabase = createSupabaseAdminClient();

  if (ownerUserId) {
    const { data, error } = await supabase.auth.admin.getUserById(ownerUserId);

    if (!error && data.user) {
      return data.user;
    }
  }

  return findAuthUserByEmail(email);
}

async function wasRecentlySent({
  organizationId,
  sourceRequestId
}: {
  organizationId: string;
  sourceRequestId: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const cutoffMs = Date.now() - 60_000;

  if (sourceRequestId) {
    const { data: request } = await supabase
      .from("book_call_requests")
      .select("last_invitation_attempt_at")
      .eq("id", sourceRequestId)
      .maybeSingle();

    if (
      request?.last_invitation_attempt_at &&
      new Date(request.last_invitation_attempt_at).getTime() > cutoffMs
    ) {
      return true;
    }
  }

  const { data: recentLog } = await supabase
    .from("platform_admin_audit_logs")
    .select("created_at")
    .eq("organization_id", organizationId)
    .eq("action", "owner_invitation_resent")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Boolean(
    recentLog?.created_at &&
      new Date(recentLog.created_at).getTime() > cutoffMs
  );
}

async function persistInvitationAttempt({
  sourceRequestId,
  status,
  errorMessage
}: {
  sourceRequestId: string | null;
  status: "sent" | "failed";
  errorMessage?: string | null;
}) {
  if (!sourceRequestId) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("book_call_requests")
    .update(
      status === "sent"
        ? {
            invitation_status: "sent",
            invited_at: now,
            last_invitation_attempt_at: now,
            conversion_error_message: null
          }
        : {
            invitation_status: "failed",
            last_invitation_attempt_at: now,
            conversion_error_message:
              errorMessage ?? "Invitation resend failed."
          }
    )
    .eq("id", sourceRequestId);
}

async function sendOwnerAuthEmail({
  email,
  existingUser
}: {
  email: string;
  existingUser: Awaited<ReturnType<typeof resolveAuthUser>>;
}): Promise<
  | { ok: true; method: "invite" | "recovery" | "signup_resend" }
  | { ok: false; result: ResendCompanyOwnerInvitationResult }
> {
  const admin = createSupabaseAdminClient();
  const authEmailClient = createSupabaseAuthEmailClient();
  const redirectTo = buildInvitationRedirectUrl();
  const recoveryRedirectTo = buildPasswordRecoveryRedirectUrl();

  if (!authEmailClient) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "missing_server_config",
        message: "Configuration serveur Supabase manquante."
      }
    };
  }

  if (!existingUser) {
    console.info("[resendCompanyOwnerInvitation] sending method", "invite");

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        source: "company_overview_owner_resend"
      }
    });

    if (error || !data.user) {
      console.error(
        "[resendCompanyOwnerInvitation] error",
        error?.message ?? "invite missing user"
      );
      return {
        ok: false,
        result: mapSupabaseAuthError(error?.message ?? "Invitation impossible.")
      };
    }

    return { ok: true, method: "invite" };
  }

  console.info(
    "[resendCompanyOwnerInvitation] auth user exists",
    true,
    "confirmed",
    Boolean(existingUser.email_confirmed_at)
  );

  if (existingUser.email_confirmed_at) {
    console.info("[resendCompanyOwnerInvitation] sending method", "recovery");

    const { error } = await authEmailClient.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirectTo
    });

    if (error) {
      console.error("[resendCompanyOwnerInvitation] error", error.message);
      return {
        ok: false,
        result: mapSupabaseAuthError(error.message)
      };
    }

    return { ok: true, method: "recovery" };
  }

  console.info(
    "[resendCompanyOwnerInvitation] sending method",
    "recovery (unconfirmed owner)"
  );

  const { error: recoveryError } = await authEmailClient.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: recoveryRedirectTo
    }
  );

  if (!recoveryError) {
    return { ok: true, method: "recovery" };
  }

  console.info("[resendCompanyOwnerInvitation] sending method", "signup_resend");

  const { error: resendError } = await authEmailClient.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo
    }
  });

  if (resendError) {
    console.error(
      "[resendCompanyOwnerInvitation] error",
      recoveryError.message,
      resendError.message
    );
    return {
      ok: false,
      result: mapSupabaseAuthError(resendError.message)
    };
  }

  return { ok: true, method: "signup_resend" };
}

export async function resendCompanyOwnerInvitation({
  organizationId,
  admin
}: {
  organizationId: string;
  admin: AuthorizedPlatformAdmin;
}): Promise<ResendCompanyOwnerInvitationResult> {
  console.info("[resendCompanyOwnerInvitation] start", organizationId);

  let supabase;

  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return {
      ok: false,
      code: "missing_server_config",
      message: "Configuration serveur Supabase manquante."
    };
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, email, source_request_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    return {
      ok: false,
      code: "company_not_found",
      message: "Compagnie introuvable."
    };
  }

  const { data: ownerMember } = await supabase
    .from("organization_members")
    .select("user_id, status")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .in("status", ["invited", "active"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let ownerEmail = organization.email?.trim().toLowerCase() ?? "";

  if (ownerMember?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("auth_user_id", ownerMember.user_id)
      .maybeSingle();

    ownerEmail = profile?.email?.trim().toLowerCase() ?? ownerEmail;
  }

  if (!ownerEmail) {
    return {
      ok: false,
      code: "missing_owner_email",
      message: "Aucun courriel propriétaire n'est associé à cette compagnie."
    };
  }

  if (!emailPattern.test(ownerEmail)) {
    return {
      ok: false,
      code: "invalid_owner_email",
      message: "Le courriel propriétaire associé à cette compagnie est invalide."
    };
  }

  console.info(
    "[resendCompanyOwnerInvitation] owner email found",
    maskEmail(ownerEmail)
  );

  if (
    await wasRecentlySent({
      organizationId,
      sourceRequestId: organization.source_request_id
    })
  ) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Un courriel vient déjà d'être envoyé. Réessayez dans une minute."
    };
  }

  try {
    const existingUser = await resolveAuthUser(ownerEmail, ownerMember?.user_id);
    console.info(
      "[resendCompanyOwnerInvitation] auth user exists",
      Boolean(existingUser)
    );

    const sendResult = await sendOwnerAuthEmail({
      email: ownerEmail,
      existingUser
    });

    if (!sendResult.ok) {
      await persistInvitationAttempt({
        sourceRequestId: organization.source_request_id,
        status: "failed",
        errorMessage: sendResult.result.message
      });

      return sendResult.result;
    }

    const sentAt = new Date().toISOString();

    await persistInvitationAttempt({
      sourceRequestId: organization.source_request_id,
      status: "sent"
    });

    await recordPlatformAdminAuditLog({
      admin,
      organizationId,
      action: "owner_invitation_resent",
      entityType: "organizations",
      entityId: organizationId,
      metadata: {
        email: ownerEmail,
        method: sendResult.method,
        owner_user_id: ownerMember?.user_id ?? existingUser?.id ?? null
      }
    });

    console.info("[resendCompanyOwnerInvitation] success", sendResult.method);

    return {
      ok: true,
      message:
        "Courriel renvoyé. Demandez au propriétaire de vérifier sa boîte de réception.",
      sentTo: ownerEmail,
      method: sendResult.method,
      sentAt
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi.";

    console.error("[resendCompanyOwnerInvitation] error", message);

    await persistInvitationAttempt({
      sourceRequestId: organization.source_request_id,
      status: "failed",
      errorMessage: message
    });

    if (message.includes("Public site URL is not configured")) {
      return {
        ok: false,
        code: "missing_server_config",
        message:
          "URL publique du site non configurée. Définissez NEXT_PUBLIC_SITE_URL sur Vercel."
      };
    }

    return {
      ok: false,
      code: "unknown_error",
      message: "Impossible de renvoyer le courriel pour le moment."
    };
  }
}
