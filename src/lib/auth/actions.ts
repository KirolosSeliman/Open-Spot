"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    authErrorRedirect("/sign-in", "Supabase is not configured locally.");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    authErrorRedirect("/sign-in", "Email and password are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authErrorRedirect("/sign-in", error.message);
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    authErrorRedirect("/signup", "Supabase is not configured locally.");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    authErrorRedirect(
      "/signup",
      "A valid email and password of at least 8 characters are required."
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    authErrorRedirect("/signup", error.message);
  }

  redirect("/onboarding");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/sign-in");
}
