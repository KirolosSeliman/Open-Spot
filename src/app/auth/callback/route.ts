import { NextResponse } from "next/server";

import { getSafeInternalRedirectPath } from "@/lib/auth/platform-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const nextParam = url.searchParams.get("next");
  const safeNext = getSafeInternalRedirectPath(nextParam) ?? "/dashboard";
  const redirectBase = new URL(request.url);
  redirectBase.pathname = safeNext;
  redirectBase.search = "";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      redirectBase.pathname = "/auth/set-password";
      redirectBase.search = `?error=${encodeURIComponent("Ce lien d'acces est invalide ou a expire.")}`;
      return NextResponse.redirect(redirectBase);
    }

    return NextResponse.redirect(redirectBase);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "invite" | "recovery" | "signup" | "email"
    });

    if (error) {
      redirectBase.pathname = "/auth/set-password";
      redirectBase.search = `?error=${encodeURIComponent("Ce lien d'acces est invalide ou a expire.")}`;
      return NextResponse.redirect(redirectBase);
    }

    return NextResponse.redirect(redirectBase);
  }

  redirectBase.pathname = "/sign-in";
  redirectBase.search = `?error=${encodeURIComponent("Lien d'authentification invalide.")}`;
  return NextResponse.redirect(redirectBase);
}
