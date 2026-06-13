"use server";

import { redirect } from "next/navigation";

import {
  getPostSignInRedirectPath,
  getSafeInternalRedirectPath
} from "@/lib/auth/platform-admin";
import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authErrorRedirect(
  path: string,
  message: string,
  requestedRedirect?: string | null
): never {
  const params = new URLSearchParams({
    error: message
  });
  const safeRedirect = getSafeInternalRedirectPath(requestedRedirect);

  if (safeRedirect) {
    params.set("redirect", safeRedirect);
  }

  redirect(`${path}?${params.toString()}`);
}

export async function signInAction(formData: FormData) {
  const requestedRedirect = String(formData.get("redirect") ?? "");

  if (!isSupabaseConfigured()) {
    authErrorRedirect(
      "/sign-in",
      "Supabase is not configured locally.",
      requestedRedirect
    );
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    authErrorRedirect(
      "/sign-in",
      "Email and password are required.",
      requestedRedirect
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authErrorRedirect("/sign-in", error.message, requestedRedirect);
  }

  redirect(
    getPostSignInRedirectPath({
      email,
      requestedRedirect
    })
  );
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
