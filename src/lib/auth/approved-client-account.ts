import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type CreateApprovedClientAccountResult =
  | { status: "success" }
  | { status: "error"; message: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

async function findApprovedConversionByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("book_call_requests")
    .select(
      "id, email, organization_id, owner_user_id, full_name, business_name, conversion_status"
    )
    .eq("email", email)
    .not("organization_id", "is", null)
    .in("conversion_status", ["completed", "invite_sent", "client_created"])
    .order("converted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function isApprovedClientEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
    return false;
  }

  try {
    const approvedRequest = await findApprovedConversionByEmail(normalizedEmail);
    return Boolean(approvedRequest?.organization_id);
  } catch {
    return false;
  }
}

export async function createApprovedClientAccount({
  email,
  password,
  confirmPassword
}: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<CreateApprovedClientAccountResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return {
      status: "error",
      message: "Entrez votre adresse courriel."
    };
  }

  if (!emailPattern.test(normalizedEmail)) {
    return {
      status: "error",
      message: "Cette adresse courriel ne semble pas valide."
    };
  }

  if (!password) {
    return {
      status: "error",
      message: "Entrez un mot de passe."
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Le mot de passe doit contenir au moins 8 caractères."
    };
  }

  if (!confirmPassword) {
    return {
      status: "error",
      message: "Confirmez votre mot de passe."
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Les mots de passe ne correspondent pas."
    };
  }

  let approvedRequest;

  try {
    approvedRequest = await findApprovedConversionByEmail(normalizedEmail);
  } catch {
    return {
      status: "error",
      message:
        "Impossible de créer le compte pour le moment. Réessayez dans quelques secondes."
    };
  }

  if (!approvedRequest?.organization_id) {
    return {
      status: "error",
      message:
        "Aucun client accepté n'est associé à ce courriel. Vérifiez le courriel utilisé ou contactez Open Spot."
    };
  }

  const supabase = createSupabaseAdminClient();
  const ownerUserId = approvedRequest.owner_user_id;

  try {
    let authUserId = "";
    let authUser = await findAuthUserByEmail(normalizedEmail);

    if (!authUser && ownerUserId) {
      const { data, error: loadUserError } =
        await supabase.auth.admin.getUserById(ownerUserId);

      if (!loadUserError && data.user?.email?.trim().toLowerCase() === normalizedEmail) {
        authUser = data.user;
      }
    }

    if (!authUser) {
      const { data: createdUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: approvedRequest.full_name,
            business_name: approvedRequest.business_name,
            source: "approved_client_signup"
          }
        });

      if (createError || !createdUser.user) {
        if (createError?.message.toLowerCase().includes("already")) {
          return {
            status: "error",
            message:
              "Un compte existe déjà avec ce courriel. Connectez-vous ou réinitialisez votre mot de passe."
          };
        }

        return {
          status: "error",
          message:
            "Impossible de créer le compte pour le moment. Réessayez dans quelques secondes."
        };
      }

      authUserId = createdUser.user.id;

      if (ownerUserId && ownerUserId !== authUserId) {
        return {
          status: "error",
          message:
            "Un compte existe déjà avec ce courriel. Connectez-vous ou réinitialisez votre mot de passe."
        };
      }

      if (!ownerUserId) {
        await supabase
          .from("book_call_requests")
          .update({ owner_user_id: authUserId })
          .eq("id", approvedRequest.id);
      }
    } else {
      authUserId = authUser.id;

      const { data: activeMember } = await supabase
        .from("organization_members")
        .select("status, joined_at")
        .eq("organization_id", approvedRequest.organization_id)
        .eq("user_id", authUserId)
        .maybeSingle();

      if (activeMember?.status === "active" && activeMember.joined_at) {
        return {
        status: "error",
        message:
          "Un compte existe déjà avec ce courriel. Connectez-vous ou réinitialisez votre mot de passe."
        };
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        {
          password,
          email_confirm: true
        }
      );

      if (updateError) {
        return {
          status: "error",
          message:
            "Impossible de créer le compte pour le moment. Réessayez dans quelques secondes."
        };
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").upsert(
        {
          auth_user_id: authUserId,
          email: normalizedEmail,
          full_name: approvedRequest.full_name
        },
        { onConflict: "auth_user_id" }
      );
    }

    const now = new Date().toISOString();
    await supabase
      .from("organization_members")
      .update({
        status: "active",
        joined_at: now
      })
      .eq("organization_id", approvedRequest.organization_id)
      .eq("user_id", authUserId);

    return { status: "success" };
  } catch {
    return {
      status: "error",
      message:
        "Impossible de créer le compte pour le moment. Réessayez dans quelques secondes."
    };
  }
}
