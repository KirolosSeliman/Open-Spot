type EnvSource = Partial<Record<string, string | undefined>>;

export function validateProductionEnvironment(env: EnvSource = process.env) {
  const errors: string[] = [];
  const smsProvider = env.SMS_PROVIDER ?? "simulator";

  if (env.NODE_ENV === "production") {
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is required in production.");
    }

    if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production.");
    }

    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push("SUPABASE_SERVICE_ROLE_KEY is required on the server in production.");
    }

    if (smsProvider !== "simulator" && env.ALLOW_REAL_SMS_SENDS !== "true") {
      errors.push("ALLOW_REAL_SMS_SENDS must be true for real SMS providers.");
    }
  }

  return errors;
}
