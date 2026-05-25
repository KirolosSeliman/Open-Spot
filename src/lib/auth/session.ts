import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthGuardResult =
  | {
      status: "unconfigured";
      user: null;
    }
  | {
      status: "authenticated";
      user: {
        id: string;
        email?: string;
      };
    };

export async function requireDashboardUser(): Promise<AuthGuardResult> {
  if (!isSupabaseConfigured()) {
    return {
      status: "unconfigured",
      user: null
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  return {
    status: "authenticated",
    user: {
      id: user.id,
      email: user.email
    }
  };
}
