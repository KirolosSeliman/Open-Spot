import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AuthStateCardProps = {
  action?: React.ReactNode;
  children?: React.ReactNode;
  description: string;
  kicker?: string;
  title: string;
};

export function AuthStateCard({
  action,
  children,
  description,
  kicker = "Accès sécurisé",
  title
}: AuthStateCardProps) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="os-container-wide py-12 sm:py-16 lg:py-24">
        <Card className="mx-auto max-w-lg p-5 sm:p-7">
          <p className="os-kicker">{kicker}</p>
          <h1 className="os-page-title mt-4">{title}</h1>
          <p className="os-body-large mt-4">{description}</p>
          {children}
          {action === undefined ? (
            <ButtonLink className="mt-6 w-full sm:w-auto" href="/sign-in" variant="primary">
              Retour à la connexion
            </ButtonLink>
          ) : (
            action
          )}
        </Card>
      </section>
    </main>
  );
}

export function AuthBackToSignInLink() {
  return (
    <Link
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--primary)] px-5 py-2.5 text-center text-sm font-black text-white shadow-[0_16px_36px_rgba(79,125,243,0.22)] transition hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] sm:w-auto"
      href="/sign-in"
    >
      Retour à la connexion
    </Link>
  );
}
