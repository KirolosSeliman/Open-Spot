import "server-only";

import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  buildInvitationRedirectUrl,
  buildPasswordRecoveryRedirectUrl
} from "@/lib/book-call/invitation-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ResendOwnerInvitationResult =
  | { status: "sent"; email: string }
  | { status: "failed"; errorMessage: string };

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

export async function resendCompanyOwnerInvitation({
  organizationId,
  admin
}: {
  organizationId: string;
  admin: AuthorizedPlatformAdmin;
}): Promise<ResendOwnerInvitationResult> {
  const supabase = createSupabaseAdminClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, email, source_request_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    return {
      status: "failed",
      errorMessage: "Impossible de renvoyer le courriel pour le moment."
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

  if (!ownerEmail || !emailPattern.test(ownerEmail)) {
    return {
      status: "failed",
      errorMessage: "Aucun courriel proprietaire n'est associe a cette compagnie."
    };
  }

  if (organization.source_request_id) {
    const { data: request } = await supabase
      .from("book_call_requests")
      .select("last_invitation_attempt_at")
      .eq("id", organization.source_request_id)
      .maybeSingle();

    if (
      request?.last_invitation_attempt_at &&
      Date.now() - new Date(request.last_invitation_attempt_at).getTime() < 60_000
    ) {
      return {
        status: "failed",
        errorMessage:
          "Un courriel vient d'etre envoye. Reessayez dans une minute."
      };
    }
  }

  const existingUser = await findAuthUserByEmail(ownerEmail);
  const redirectTo = buildInvitationRedirectUrl();
  const sendResult = existingUser?.email_confirmed_at
    ? await supabase.auth.resetPasswordForEmail(ownerEmail, {
        redirectTo: buildPasswordRecoveryRedirectUrl()
      })
    : await supabase.auth.admin.inviteUserByEmail(ownerEmail, {
        redirectTo,
        data: {
          source: "company_overview_owner_resend"
        }
      });

  if (sendResult.error) {
    if (organization.source_request_id) {
      await supabase
        .from("book_call_requests")
        .update({
          invitation_status: "failed",
          last_invitation_attempt_at: new Date().toISOString()
        })
        .eq("id", organization.source_request_id);
    }

    return {
      status: "failed",
      errorMessage: "Impossible de renvoyer le courriel pour le moment."
    };
  }

  const now = new Date().toISOString();

  if (organization.source_request_id) {
    await supabase
      .from("book_call_requests")
      .update({
        invitation_status: "sent",
        invited_at: now,
        last_invitation_attempt_at: now
      })
      .eq("id", organization.source_request_id);
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "owner_invitation_resent",
    entityType: "organizations",
    entityId: organizationId,
    metadata: {
      email: ownerEmail,
      owner_user_id: ownerMember?.user_id ?? null
    }
  });

  return {
    status: "sent",
    email: ownerEmail
  };
}
