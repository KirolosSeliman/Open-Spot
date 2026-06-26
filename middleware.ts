import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env/config";
import type { Database } from "@/types/database";

const privateRoutePrefixes = [
  "/dashboard",
  "/admin",
  "/clients",
  "/waitlist",
  "/services",
  "/messages",
  "/settings",
  "/team",
  "/subscription",
  "/responses",
  "/cancellations",
  "/new-cancellation"
];

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPrivateRoute(pathname: string) {
  return privateRoutePrefixes.some((prefix) =>
    matchesRoutePrefix(pathname, prefix)
  );
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });
  const pathname = request.nextUrl.pathname;

  if (!isPrivateRoute(pathname)) {
    return response;
  }

  if (!isSupabaseConfigured()) {
    return redirectTo(request, "/sign-in");
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectTo(request, "/sign-in");
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/clients/:path*",
    "/waitlist/:path*",
    "/services/:path*",
    "/messages/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/subscription/:path*",
    "/responses/:path*",
    "/cancellations/:path*",
    "/new-cancellation/:path*"
  ]
};
