"use server";

import { isApprovedClientEmail } from "@/lib/auth/approved-client-account";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildInvitationRedirectUrl,
  buildPasswordRecoveryRedirectUrl
} from "@/lib/book-call/invitation-url";

export type ResendAuthEmailMode = "signup" | "recovery";

export type ResendAuthEmailResult =
  | { status: "sent" }
  | { status: "error"; message: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function resendAuthEmailAction(
  formData: FormData
): Promise<ResendAuthEmailResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const mode = String(formData.get("mode") ?? "signup") as ResendAuthEmailMode;

  if (!email) {
    return {
      status: "error",
      message: "Entrez votre adresse email pour renvoyer le lien."
    };
  }

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Cette adresse email ne semble pas valide."
    };
  }

  if (!(await isApprovedClientEmail(email))) {
    return {
      status: "error",
      message:
        "Aucun client accepte n'est associe a cet email. Verifiez l'email utilise ou contactez Open Spot."
    };
  }

  const admin = createSupabaseAdminClient();
  const redirectTo = buildInvitationRedirectUrl();

  if (mode === "recovery") {
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: buildPasswordRecoveryRedirectUrl()
    });

    if (error) {
      return {
        status: "error",
        message:
          "Impossible d'envoyer le lien de reinitialisation pour le moment."
      };
    }

    return { status: "sent" };
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: buildInvitationRedirectUrl(),
    data: {
      source: "approved_client_resend"
    }
  });

  if (!inviteError) {
    return { status: "sent" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo
    }
  });

  if (error) {
    return {
      status: "error",
      message: "Impossible d'envoyer l'email de creation de compte pour le moment."
    };
  }

  return { status: "sent" };
}
