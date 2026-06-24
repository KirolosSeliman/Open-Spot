import "server-only";

import { randomBytes } from "node:crypto";

import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import type {
  BookCallRequestRow,
  ConversionResult,
  ResendInvitationResult
} from "@/lib/book-call/conversion-types";
import {
  buildInvitationRedirectUrl,
  buildPasswordRecoveryRedirectUrl
} from "@/lib/book-call/invitation-url";
import { normalizeOrganizationSlug } from "@/lib/organization/onboarding";
import { normalizePhoneToE164 } from "@/lib/customers/phone";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/lib/i18n/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ClaimOutcome =
  | { outcome: "claimed"; request: BookCallRequestRow }
  | { outcome: "already_converted"; request: BookCallRequestRow }
  | { outcome: "processing"; request: BookCallRequestRow }
  | { outcome: "not_found" }
  | { outcome: "blocked"; request: BookCallRequestRow };

function sanitizeErrorMessage(message: string) {
  return message.replace(/service_role|secret|token|password/gi, "[redacted]");
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
      throw new Error(sanitizeErrorMessage(error.message));
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

function buildUniqueSlug(baseName: string) {
  const base = normalizeOrganizationSlug(baseName) || "client";
  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`.slice(0, 60).replace(/-+$/g, "");
}

function resolveOrganizationPhone(phone: string | null) {
  if (!phone) {
    return null;
  }

  const normalized = normalizePhoneToE164(phone);

  return normalized.ok ? normalized.phoneE164 : null;
}

async function loadCallRequest(requestId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("book_call_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(sanitizeErrorMessage(error.message));
  }

  return data;
}

async function claimConversion(requestId: string): Promise<ClaimOutcome> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("claim_book_call_request_conversion", {
    p_request_id: requestId
  });

  if (error) {
    throw new Error(sanitizeErrorMessage(error.message));
  }

  const payload = data as {
    outcome: ClaimOutcome["outcome"];
    request?: BookCallRequestRow;
  };

  if (payload.outcome === "not_found") {
    return { outcome: "not_found" };
  }

  if (!payload.request) {
    throw new Error("Conversion claim returned an invalid payload.");
  }

  return {
    outcome: payload.outcome,
    request: payload.request
  } as ClaimOutcome;
}

async function finalizeConversion({
  requestId,
  organizationId,
  ownerUserId,
  adminUserId,
  conversionStatus,
  invitationStatus,
  invitationSent,
  errorCode,
  errorMessage
}: {
  requestId: string;
  organizationId: string;
  ownerUserId: string;
  adminUserId: string;
  conversionStatus: BookCallRequestRow["conversion_status"];
  invitationStatus: BookCallRequestRow["invitation_status"];
  invitationSent: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("book_call_requests")
    .update({
      conversion_status: conversionStatus,
      organization_id: organizationId,
      owner_user_id: ownerUserId,
      converted_at:
        conversionStatus === "completed" ||
        conversionStatus === "invite_sent" ||
        conversionStatus === "invite_failed" ||
        conversionStatus === "client_created"
          ? now
          : undefined,
      converted_by: adminUserId,
      invitation_status: invitationStatus,
      invited_at: invitationSent ? now : undefined,
      last_invitation_attempt_at: invitationSent ? now : undefined,
      conversion_error_code: errorCode ?? null,
      conversion_error_message: errorMessage ?? null,
      status: "converted"
    })
    .eq("id", requestId);

  if (error) {
    throw new Error(sanitizeErrorMessage(error.message));
  }
}

async function markConversionFailed(
  requestId: string,
  errorCode: string,
  errorMessage: string
) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("book_call_requests")
    .update({
      conversion_status: "failed",
      conversion_error_code: errorCode,
      conversion_error_message: sanitizeErrorMessage(errorMessage)
    })
    .eq("id", requestId);
}

async function inviteOrLinkOwner({
  request,
  admin
}: {
  request: BookCallRequestRow;
  admin: AuthorizedPlatformAdmin;
}): Promise<{
  userId: string;
  existingUser: boolean;
  invitationSent: boolean;
  invitationError?: string;
}> {
  const supabase = createSupabaseAdminClient();
  const email = request.email.trim().toLowerCase();
  const redirectTo = buildInvitationRedirectUrl();
  const locale = (request.locale === "en" ? "en" : "fr") as Locale;
  const existingUser = await findAuthUserByEmail(email);

  if (!existingUser) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: request.full_name,
        business_name: request.business_name,
        role: "owner",
        source: "call_request_conversion",
        locale
      }
    });

    if (error || !data.user) {
      return {
        userId: "",
        existingUser: false,
        invitationSent: false,
        invitationError: sanitizeErrorMessage(error?.message ?? "Invitation failed.")
      };
    }

    return {
      userId: data.user.id,
      existingUser: false,
      invitationSent: true
    };
  }

  const isConfirmed = Boolean(existingUser.email_confirmed_at);

  if (isConfirmed) {
    return {
      userId: existingUser.id,
      existingUser: true,
      invitationSent: false
    };
  }

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      full_name: request.full_name,
      business_name: request.business_name,
      role: "owner",
      source: "call_request_conversion",
      locale
    }
  });

  if (error) {
    return {
      userId: existingUser.id,
      existingUser: true,
      invitationSent: false,
      invitationError: sanitizeErrorMessage(error.message)
    };
  }

  return {
    userId: existingUser.id,
    existingUser: true,
    invitationSent: true
  };
}

async function bootstrapOrganization({
  request,
  ownerUserId,
  adminUserId
}: {
  request: BookCallRequestRow;
  ownerUserId: string;
  adminUserId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const slug = buildUniqueSlug(request.business_name);
  const phone = resolveOrganizationPhone(request.phone);
  const locale = request.locale === "en" ? "en" : "fr";

  const { data, error } = await supabase.rpc(
    "admin_bootstrap_organization_from_call_request",
    {
      p_request_id: request.id,
      p_owner_user_id: ownerUserId,
      p_organization_name: request.business_name.trim(),
      p_organization_slug: slug,
      p_organization_email: request.email.trim().toLowerCase(),
      p_organization_phone: phone ?? "",
      p_organization_timezone: "America/Toronto",
      p_organization_default_language: locale,
      p_business_type: request.business_type ?? "",
      p_booking_system: request.current_booking_system ?? "",
      p_created_by: adminUserId
    }
  );

  if (error) {
    throw new Error(sanitizeErrorMessage(error.message));
  }

  return String(data);
}

export async function convertCallRequestToClient({
  requestId,
  admin
}: {
  requestId: string;
  admin: AuthorizedPlatformAdmin;
}): Promise<ConversionResult> {
  if (!uuidPattern.test(requestId)) {
    return {
      status: "failed",
      errorCode: "invalid_request_id",
      errorMessage: "Identifiant de demande invalide."
    };
  }

  const claim = await claimConversion(requestId);

  if (claim.outcome === "not_found") {
    return {
      status: "failed",
      errorCode: "not_found",
      errorMessage: "Demande introuvable."
    };
  }

  if (claim.outcome === "processing") {
    return {
      status: "processing",
      errorMessage:
        "Une conversion est deja en cours pour cette demande. Reessayez dans quelques minutes."
    };
  }

  if (claim.outcome === "already_converted" && claim.request.organization_id) {
    return {
      status: "already_converted",
      organizationId: claim.request.organization_id,
      userId: claim.request.owner_user_id,
      invitationStatus:
        (claim.request.invitation_status as import("@/lib/book-call/conversion-types").CallRequestInvitationStatus | null) ??
        null,
      email: claim.request.email
    };
  }

  const request = claim.request;
  const email = request.email.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    await markConversionFailed(request.id, "invalid_email", "Email invalide.");
    return {
      status: "failed",
      errorCode: "invalid_email",
      errorMessage: "Email invalide ou absent."
    };
  }

  if (!request.business_name?.trim()) {
    await markConversionFailed(
      request.id,
      "missing_business_name",
      "Nom du commerce manquant."
    );
    return {
      status: "failed",
      errorCode: "missing_business_name",
      errorMessage: "Nom du commerce manquant."
    };
  }

  try {
    const ownerResolution = await inviteOrLinkOwner({ request, admin });

    if (!ownerResolution.userId) {
      await markConversionFailed(
        request.id,
        "invitation_failed",
        ownerResolution.invitationError ?? "Invitation impossible."
      );
      return {
        status: "failed",
        errorCode: "invitation_failed",
        errorMessage:
          ownerResolution.invitationError ??
          "Impossible d'inviter le proprietaire."
      };
    }

    const organizationId = await bootstrapOrganization({
      request,
      ownerUserId: ownerResolution.userId,
      adminUserId: admin.userId
    });

    const invitationSent = ownerResolution.invitationSent;
    const conversionStatus =
      ownerResolution.existingUser && !invitationSent
        ? "completed"
        : invitationSent
          ? "completed"
          : "invite_failed";
    const invitationStatus = ownerResolution.existingUser && !invitationSent
      ? "not_required"
      : invitationSent
        ? "sent"
        : "failed";

    await finalizeConversion({
      requestId: request.id,
      organizationId,
      ownerUserId: ownerResolution.userId,
      adminUserId: admin.userId,
      conversionStatus,
      invitationStatus,
      invitationSent,
      errorCode: invitationSent ? null : "invitation_failed",
      errorMessage: invitationSent
        ? null
        : ownerResolution.invitationError ?? "Invitation non envoyee."
    });

    await recordPlatformAdminAuditLog({
      admin,
      organizationId,
      action: "call_request_converted_to_client",
      entityType: "book_call_requests",
      entityId: request.id,
      metadata: {
        organization_id: organizationId,
        owner_user_id: ownerResolution.userId,
        invitation_sent: invitationSent,
        existing_user: ownerResolution.existingUser,
        result: conversionStatus
      }
    });

    if (!invitationSent && !ownerResolution.existingUser) {
      return {
        status: "partial",
        organizationId,
        userId: ownerResolution.userId,
        invitationSent: false,
        errorCode: "invitation_failed",
        errorMessage:
          ownerResolution.invitationError ??
          "Le client a ete cree, mais l'invitation n'a pas pu etre envoyee.",
        email
      };
    }

    return {
      status: "completed",
      organizationId,
      userId: ownerResolution.userId,
      invitationSent,
      existingUser: ownerResolution.existingUser,
      email
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? sanitizeErrorMessage(error.message)
        : "Conversion echouee.";

    await markConversionFailed(request.id, "conversion_failed", message);

    if (message.includes("already belongs to an organization")) {
      return {
        status: "failed",
        errorCode: "owner_has_organization",
        errorMessage:
          "Ce compte appartient deja a une organisation. Rattachement impossible en mode mono-organisation."
      };
    }

    return {
      status: "failed",
      errorCode: "conversion_failed",
      errorMessage: message
    };
  }
}

export async function resendCallRequestInvitation({
  requestId,
  admin
}: {
  requestId: string;
  admin: AuthorizedPlatformAdmin;
}): Promise<ResendInvitationResult> {
  if (!uuidPattern.test(requestId)) {
    return {
      status: "failed",
      errorCode: "invalid_request_id",
      errorMessage: "Identifiant de demande invalide."
    };
  }

  const request = await loadCallRequest(requestId);

  if (!request?.organization_id || !request.owner_user_id) {
    return {
      status: "failed",
      errorCode: "not_converted",
      errorMessage: "Cette demande n'a pas encore ete convertie."
    };
  }

  const email = request.email.trim().toLowerCase();
  const supabase = createSupabaseAdminClient();
  const existingUser = await findAuthUserByEmail(email);

  if (!existingUser) {
    return {
      status: "failed",
      errorCode: "user_not_found",
      errorMessage: "Utilisateur proprietaire introuvable."
    };
  }

  const redirectTo = buildInvitationRedirectUrl();
  const isConfirmed = Boolean(existingUser.email_confirmed_at);
  const sendResult = isConfirmed
    ? await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildPasswordRecoveryRedirectUrl()
      })
    : await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          full_name: request.full_name,
          business_name: request.business_name,
          source: "call_request_conversion_resend"
        }
      });

  if (sendResult.error) {
    await supabase
      .from("book_call_requests")
      .update({
        invitation_status: "failed",
        last_invitation_attempt_at: new Date().toISOString(),
        conversion_error_code: "invitation_resend_failed",
        conversion_error_message: sanitizeErrorMessage(sendResult.error.message)
      })
      .eq("id", requestId);

    return {
      status: "failed",
      errorCode: "invitation_resend_failed",
      errorMessage: sanitizeErrorMessage(sendResult.error.message)
    };
  }

  const now = new Date().toISOString();
  await supabase
    .from("book_call_requests")
    .update({
      invitation_status: "sent",
      invited_at: now,
      last_invitation_attempt_at: now,
      conversion_status: "completed",
      conversion_error_code: null,
      conversion_error_message: null
    })
    .eq("id", requestId);

  await recordPlatformAdminAuditLog({
    admin,
    organizationId: request.organization_id,
    action: "call_request.invitation_resent",
    entityType: "book_call_requests",
    entityId: request.id,
    metadata: {
      owner_user_id: request.owner_user_id,
      email
    }
  });

  return {
    status: "sent",
    email
  };
}

export async function loadCallRequestDetail(requestId: string) {
  if (!uuidPattern.test(requestId)) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data: request, error } = await supabase
    .from("book_call_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) {
    return null;
  }

  let organization: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
  } | null = null;

  if (request.organization_id) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, slug, email, phone")
      .eq("id", request.organization_id)
      .maybeSingle();

    organization = data;
  }

  return {
    request,
    organization
  };
}
