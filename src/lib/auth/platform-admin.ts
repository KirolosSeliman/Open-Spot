import { isSupabaseConfigured } from "@/lib/env/config";

export type PlatformAdminState =
  | {
      status: "unconfigured";
      message: string;
    }
  | {
      status: "configured";
      message: string;
    };

export function getPlatformAdminState(): PlatformAdminState {
  if (!isSupabaseConfigured() || !process.env.PLATFORM_ADMIN_EMAILS) {
    return {
      status: "unconfigured",
      message:
        "Platform admin access is locked until Supabase and PLATFORM_ADMIN_EMAILS are configured."
    };
  }

  return {
    status: "configured",
    message:
      "Platform admin access must be checked against authenticated user email before data is shown."
  };
}
