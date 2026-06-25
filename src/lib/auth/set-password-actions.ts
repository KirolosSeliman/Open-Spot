"use server";

import { redirect } from "next/navigation";

import { buildSignInAuthErrorRedirect } from "@/lib/auth/auth-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function setPasswordError(message: string): never {
  redirect(`/auth/set-password?error=${encodeURIComponent(message)}`);
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

  const now = new Date().toISOString();
  await supabase
    .from("organization_members")
    .update({
      status: "active",
      joined_at: now
    })
    .eq("user_id", user.id)
    .eq("status", "invited");

  redirect("/sign-in?password_created=1");
}
