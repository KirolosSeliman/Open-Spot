"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form-field";
import { registerApprovedClientAction } from "@/lib/auth/register-actions";

export function CreateAccountForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("error");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const formData = new FormData(event.currentTarget);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    startTransition(async () => {
      const result = await registerApprovedClientAction(formData);

      if (result.status === "success") {
        setFeedbackTone("success");
        setFeedback(
          "Compte créé avec succès. Vous pouvez maintenant vous connecter."
        );
        return;
      }

      setFeedbackTone("error");
      setFeedback(result.message);
    });
  }

  return (
    <div className="grid gap-5">
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
        <FormField htmlFor="register-email" label="Adresse courriel" required>
          <Input
            id="register-email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </FormField>
        <FormField htmlFor="register-password" label="Mot de passe" required>
          <Input
            id="register-password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </FormField>
        <FormField htmlFor="register-confirm-password" label="Confirmer le mot de passe" required>
          <Input
            id="register-confirm-password"
            minLength={8}
            name="confirmPassword"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </FormField>
        <Button
          className="w-full"
          isLoading={isPending}
          loadingText="Création en cours..."
          type="submit"
        >
          Créer mon compte
        </Button>
      </form>

      <p className="text-sm leading-6 text-[var(--muted)]">
        Vous avez déjà un compte ?{" "}
        <Link
          className="font-black text-[var(--primary)] underline-offset-4 hover:underline"
          href="/sign-in"
        >
          Connexion
        </Link>
      </p>
    </div>
  );
}
