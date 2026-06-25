import { NextResponse, type NextRequest } from "next/server";

import { mapSupabaseAuthError } from "@/lib/auth/auth-errors";
import { getSafeInternalRedirectPath } from "@/lib/auth/platform-admin";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

type OtpType = "invite" | "recovery" | "signup" | "email" | "magiclink";

function getDefaultNextPath(type: string | null) {
  if (type === "recovery" || type === "invite" || type === "signup") {
    return "/auth/set-password";
  }

  return "/dashboard";
}

function buildRedirectResponse(request: NextRequest, pathname: string, search = "") {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = search;
  return NextResponse.redirect(redirectUrl);
}

function hasServerAuthParams(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  return Boolean(
    params.get("code") ||
      (params.get("token_hash") && params.get("type")) ||
      params.get("error") ||
      params.get("error_code")
  );
}

export async function GET(request: NextRequest) {
  if (!hasServerAuthParams(request)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/auth/callback/hash";
    return NextResponse.rewrite(rewriteUrl);
  }

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const nextParam = params.get("next");
  const authError = params.get("error");
  const authErrorCode = params.get("error_code");
  const authErrorDescription = params.get("error_description");

  if (authError || authErrorCode) {
    const mapped = mapSupabaseAuthError(authErrorCode, authErrorDescription);
    return buildRedirectResponse(
      request,
      "/sign-in",
      new URLSearchParams({ auth_error: mapped }).toString()
    );
  }

  const safeNext =
    getSafeInternalRedirectPath(nextParam) ?? getDefaultNextPath(type);

  if (code) {
    const redirectResponse = buildRedirectResponse(request, safeNext);
    const supabase = createSupabaseRouteHandlerClient(request, redirectResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return buildRedirectResponse(
        request,
        "/sign-in",
        new URLSearchParams({
          auth_error: "expired_or_invalid_link"
        }).toString()
      );
    }

    return redirectResponse;
  }

  if (tokenHash && type) {
    const destination =
      getSafeInternalRedirectPath(nextParam) ?? getDefaultNextPath(type);
    const redirectResponse = buildRedirectResponse(request, destination);
    const supabase = createSupabaseRouteHandlerClient(request, redirectResponse);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as OtpType
    });

    if (error) {
      return buildRedirectResponse(
        request,
        "/sign-in",
        new URLSearchParams({
          auth_error: "expired_or_invalid_link"
        }).toString()
      );
    }

    return redirectResponse;
  }

  return buildRedirectResponse(
    request,
    "/sign-in",
    new URLSearchParams({ auth_error: "missing_token" }).toString()
  );
}
