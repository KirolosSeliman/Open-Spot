"use server";

import {
  buildAuthCallbackUrl,
  getRequestSiteUrl
} from "@/lib/auth/site-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResendAuthEmailMode = "signup" | "recovery";

export type ResendAuthEmailResult =
  | { status: "sent" }
  | { status: "error"; message: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function resendAuthEmailAction(
  formData: FormData
): Promise<ResendAuthEmailResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const mode = String(formData.get("mode") ?? "signup") as ResendAuthEmailMode;

  if (!email) {
    return {
      status: "error",
      message: "Entrez votre adresse email pour renvoyer le lien."
    };
  }

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Cette adresse email ne semble pas valide."
    };
  }

  let redirectTo: string;

  try {
    const siteUrl = await getRequestSiteUrl();
    redirectTo = buildAuthCallbackUrl("/auth/set-password", siteUrl);
  } catch {
    return {
      status: "error",
      message:
        "Impossible d'envoyer l'email pour le moment. Reessayez dans quelques secondes."
    };
  }

  const supabase = await createSupabaseServerClient();

  if (mode === "recovery") {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      return {
        status: "error",
        message:
          "Impossible d'envoyer le lien de reinitialisation pour le moment."
      };
    }

    return { status: "sent" };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo
    }
  });

  if (error) {
    return {
      status: "error",
      message: "Impossible d'envoyer l'email de creation de compte pour le moment."
    };
  }

  return { status: "sent" };
}
