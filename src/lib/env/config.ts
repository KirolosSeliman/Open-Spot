export const clientEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "APP_BASE_URL"
] as const;

export const serverOnlyEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "ALLOW_REAL_SMS_SENDS",
  "PLIVO_AUTH_ID",
  "PLIVO_AUTH_TOKEN",
  "PLIVO_SOURCE_NUMBER",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_MESSAGING_SERVICE_SID",
  "TWILIO_SOURCE_NUMBER",
  "TWILIO_STATUS_CALLBACK_URL",
  "CRON_SECRET",
  "SIMULATOR_WEBHOOK_SECRET"
] as const;

export type SmsProvider = "simulator" | "plivo" | "twilio";

type EnvSource = Partial<Record<string, string | undefined>>;

export function getSmsProvider(env: EnvSource = process.env): SmsProvider {
  const provider = env.SMS_PROVIDER;

  if (provider === "plivo" || provider === "twilio") {
    return provider;
  }

  return "simulator";
}

export function isSupabaseConfigured(env: EnvSource = process.env) {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
