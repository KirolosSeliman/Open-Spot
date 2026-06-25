"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ResendAuthEmailForm } from "@/components/auth/resend-auth-email-form";
import { Card } from "@/components/ui/card";
import { getSafeInternalRedirectPath } from "@/lib/auth/safe-redirect";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CallbackState = "loading" | "error";

function readHashParams() {
  if (typeof window === "undefined" || !window.location.hash) {
    return null;
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash);
}

function getHashRedirectPath(type: string | null, nextParam: string | null) {
  const safeNext = getSafeInternalRedirectPath(nextParam);

  if (safeNext) {
    return safeNext;
  }

  if (type === "recovery" || type === "invite" || type === "signup") {
    return "/auth/set-password";
  }

  return "/dashboard";
}

export default function AuthCallbackHashPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CallbackState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function completeAuthFromHash() {
      const hashParams = readHashParams();
      const accessToken = hashParams?.get("access_token");
      const refreshToken = hashParams?.get("refresh_token");
      const type = hashParams?.get("type") ?? searchParams.get("type");
      const nextParam = searchParams.get("next");

      if (!accessToken || !refreshToken) {
        if (!cancelled) {
          setState("error");
        }
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (cancelled) {
        return;
      }

      if (error) {
        setState("error");
        return;
      }

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );

      router.replace(getHashRedirectPath(type, nextParam));
    }

    void completeAuthFromHash();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <section className="os-container-wide py-12 sm:py-16 lg:py-24">
          <Card className="mx-auto max-w-lg p-5 sm:p-7">
            <p className="os-kicker">Acces securise</p>
            <h1 className="os-page-title mt-4">Verification du lien</h1>
            <p className="os-body-large mt-4">
              Nous finalisons votre acces. Cela ne prend qu&apos;un instant.
            </p>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="os-container-wide py-12 sm:py-16 lg:py-24">
        <Card className="mx-auto max-w-lg p-5 sm:p-7">
          <ResendAuthEmailForm
            defaultEmail={searchParams.get("email") ?? ""}
            defaultMode="signup"
            description="Ce lien a peut-etre expire ou deja ete utilise. Entrez votre email pour recevoir un nouveau lien."
            showModeSwitch
            title="Lien expire ou invalide"
          />
        </Card>
      </section>
    </main>
  );
}
