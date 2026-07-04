"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildSignInAuthErrorRedirect } from "@/lib/auth/auth-errors";
import { workspaceMemberStatuses } from "@/lib/organization/membership";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function setPasswordError(message: string): never {
  redirect(`/auth/set-password?error=${encodeURIComponent(message)}`);
}

function signInNoticeRedirect(notice: string): never {
  redirect(`/sign-in?notice=${encodeURIComponent(notice)}`);
}

export async function setPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    setPasswordError("Le mot de passe doit contenir au moins 8 caractères.");
  }

  if (password !== confirmPassword) {
    setPasswordError("Les mots de passe ne correspondent pas.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(buildSignInAuthErrorRedirect("expired_or_invalid_link"));
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    setPasswordError(error.message);
  }

  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    signInNoticeRedirect(
      "Votre mot de passe a été créé, mais nous n'avons pas pu finaliser votre accès commerce. Contactez Open Spot."
    );
  }

  const now = new Date().toISOString();
  const { error: activationError } = await serviceClient
    .from("organization_members")
    .update({
      status: "active",
      joined_at: now
    })
    .eq("user_id", user.id)
    .eq("status", "invited");

  if (activationError) {
    signInNoticeRedirect(
      "Votre mot de passe a été créé, mais nous n'avons pas pu finaliser votre accès commerce. Contactez Open Spot."
    );
  }

  const { data: memberships, error: membershipCheckError } = await serviceClient
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .in("status", [...workspaceMemberStatuses])
    .limit(1);

  if (membershipCheckError || !memberships || memberships.length === 0) {
    signInNoticeRedirect(
      "Votre mot de passe a été créé, mais aucun accès commerce n'est associé à ce compte. Contactez Open Spot."
    );
  }

  revalidatePath("/sign-in");
  revalidatePath("/dashboard");
  redirect("/sign-in?password_created=1");
}
