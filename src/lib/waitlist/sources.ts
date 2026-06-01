export type WaitlistSignupSource = "public_link" | "qr_code" | "kiosk";

const allowedSources = new Set<WaitlistSignupSource>([
  "public_link",
  "qr_code",
  "kiosk"
]);

export function normalizeWaitlistSignupSource(
  value: string | null | undefined
): WaitlistSignupSource {
  return allowedSources.has(value as WaitlistSignupSource)
    ? (value as WaitlistSignupSource)
    : "public_link";
}
