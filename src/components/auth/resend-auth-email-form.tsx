"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import {
  resendAuthEmailAction,
  type ResendAuthEmailMode
} from "@/lib/auth/resend-actions";

type ResendAuthEmailFormProps = {
  defaultEmail?: string;
  defaultMode?: ResendAuthEmailMode;
  description?: string;
  showModeSwitch?: boolean;
  title?: string;
};

export function ResendAuthEmailForm({
  defaultEmail = "",
  defaultMode = "signup",
  description = "Entrez votre adresse courriel pour recevoir un nouveau lien.",
  showModeSwitch = false,
  title = "Lien expiré ou invalide"
}: ResendAuthEmailFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [mode, setMode] = useState<ResendAuthEmailMode>(defaultMode);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">(
    "error"
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const formData = new FormData(event.currentTarget);
    formData.set("email", email);
    formData.set("mode", mode);

    startTransition(async () => {
      const result = await resendAuthEmailAction(formData);

      if (result.status === "sent") {
        setFeedbackTone("success");
        setFeedback(
          "Courriel envoyé. Vérifiez votre boîte de réception et vos courriers indésirables."
        );
        return;
      }

      setFeedbackTone("error");
      setFeedback(result.message);
    });
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="os-kicker">Accès sécurisé</p>
        <h1 className="os-page-title mt-4">{title}</h1>
        <p className="os-body-large mt-4">{description}</p>
      </div>

      {feedback ? (
        <p
          className={
            feedbackTone === "success"
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700"
              : "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"
          }
        >
          {feedback}
        </p>
      ) : null}

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <FormField htmlFor="resend-email" label="Adresse courriel" required>
          <Input
            id="resend-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </FormField>

        {showModeSwitch ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="w-full"
              onClick={() => setMode("signup")}
              type="button"
              variant={mode === "signup" ? "primary" : "outline"}
            >
              Courriel de création de compte
            </Button>
            <Button
              className="w-full"
              onClick={() => setMode("recovery")}
              type="button"
              variant={mode === "recovery" ? "primary" : "outline"}
            >
              Lien de réinitialisation
            </Button>
          </div>
        ) : null}

        <Button
          className="w-full"
          isLoading={isPending}
          loadingText="Envoi en cours..."
          type="submit"
          variant={showModeSwitch ? "secondary" : "primary"}
        >
          Renvoyer le courriel
        </Button>
      </form>
    </div>
  );
}
