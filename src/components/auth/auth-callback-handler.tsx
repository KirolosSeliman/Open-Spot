"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthBackToSignInLink, AuthStateCard } from "@/components/auth/auth-state-card";
import { getSafeInternalRedirectPath } from "@/lib/auth/safe-redirect";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CallbackView = "loading" | "redirecting" | "error" | "incomplete";

type OtpType = "invite" | "recovery" | "signup" | "email" | "magiclink";

function readHashParams() {
  if (typeof window === "undefined" || !window.location.hash) {
    return null;
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash);
}

function clearUrlHash() {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
}

function resolveRedirectPath(nextParam: string | null, type: string | null) {
  const safeNext = getSafeInternalRedirectPath(nextParam);

  if (safeNext) {
    return safeNext;
  }

  if (
    type === "recovery" ||
    type === "invite" ||
    type === "signup" ||
    type === "magiclink"
  ) {
    return "/auth/set-password";
  }

  return "/auth/set-password";
}

function hasHashAuthError(hashParams: URLSearchParams | null) {
  return Boolean(hashParams?.get("error") || hashParams?.get("error_code"));
}

export function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<CallbackView>("loading");

  useEffect(() => {
    let cancelled = false;

    async function completeCallback() {
      const supabase = createSupabaseBrowserClient();
      const nextParam = searchParams.get("next");
      const hashParams = readHashParams();

      if (hasHashAuthError(hashParams)) {
        clearUrlHash();
        if (!cancelled) {
          setView("error");
        }
        return;
      }

      const queryError = searchParams.get("error");
      const queryErrorCode = searchParams.get("error_code");

      if (queryError || queryErrorCode) {
        if (!cancelled) {
          setView("error");
        }
        return;
      }

      const accessToken = hashParams?.get("access_token");
      const refreshToken = hashParams?.get("refresh_token");
      const hashType = hashParams?.get("type");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (cancelled) {
          return;
        }

        if (error) {
          setView("error");
          return;
        }

        clearUrlHash();
        setView("redirecting");
        router.replace(resolveRedirectPath(nextParam, hashType ?? null));
        return;
      }

      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (cancelled) {
          return;
        }

        if (error) {
          setView("error");
          return;
        }

        setView("redirecting");
        router.replace(
          resolveRedirectPath(nextParam, searchParams.get("type"))
        );
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as OtpType
        });

        if (cancelled) {
          return;
        }

        if (error) {
          setView("error");
          return;
        }

        setView("redirecting");
        router.replace(resolveRedirectPath(nextParam, type));
        return;
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (session) {
        setView("redirecting");
        router.replace(resolveRedirectPath(nextParam, type));
        return;
      }

      setView("incomplete");
    }

    void completeCallback();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (view === "loading") {
    return (
      <AuthStateCard
        action={null}
        description="Nous préparons votre accès sécurisé à Open Spot."
        title="Vérification du lien…"
      />
    );
  }

  if (view === "redirecting") {
    return (
      <AuthStateCard
        action={null}
        description="Redirection vers la création de votre mot de passe."
        title="Lien vérifié. Redirection…"
      />
    );
  }

  if (view === "error") {
    return (
      <AuthStateCard
        action={<AuthBackToSignInLink />}
        description="Ce lien a peut-être expiré ou déjà été utilisé. Demandez à l'administrateur Open Spot de renvoyer l'invitation depuis la page d'aperçu de la compagnie."
        title="Lien expiré ou invalide"
      />
    );
  }

  return (
    <AuthStateCard
      action={<AuthBackToSignInLink />}
      description="Le lien ouvert ne contient pas les informations nécessaires. Demandez à l'administrateur Open Spot de renvoyer l'invitation depuis la page d'aperçu de la compagnie."
      title="Lien incomplet"
    />
  );
}
