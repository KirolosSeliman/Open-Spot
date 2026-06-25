export type AuthErrorCode =
  | "expired_or_invalid_link"
  | "missing_token"
  | "network_error"
  | "confirmed";

export function getAuthErrorMessage(code: string | null | undefined) {
  switch (code) {
    case "expired_or_invalid_link":
      return "Ce lien a expire ou a deja ete utilise. Vous pouvez demander un nouvel email.";
    case "missing_token":
      return "Le lien ouvert ne contient pas les informations necessaires. Demandez un nouvel email.";
    case "network_error":
      return "Impossible de verifier le lien pour le moment. Reessayez dans quelques secondes.";
    case "confirmed":
      return "Votre email est confirme. Vous pouvez maintenant vous connecter.";
    default:
      return null;
  }
}

export function mapSupabaseAuthError(
  errorCode: string | null,
  errorDescription: string | null
): AuthErrorCode {
  const normalizedCode = (errorCode ?? "").toLowerCase();
  const normalizedDescription = (errorDescription ?? "").toLowerCase();

  if (
    normalizedCode.includes("otp_expired") ||
    normalizedCode.includes("expired") ||
    normalizedDescription.includes("expired") ||
    normalizedDescription.includes("invalid")
  ) {
    return "expired_or_invalid_link";
  }

  return "expired_or_invalid_link";
}

export function buildSignInAuthErrorRedirect(code: AuthErrorCode, email?: string | null) {
  const params = new URLSearchParams({
    auth_error: code
  });

  if (email?.trim()) {
    params.set("email", email.trim().toLowerCase());
  }

  return `/sign-in?${params.toString()}`;
}
