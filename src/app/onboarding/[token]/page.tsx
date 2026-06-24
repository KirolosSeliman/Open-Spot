import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientOnboardingFlow } from "@/components/onboarding/client-onboarding-flow";
import { Card } from "@/components/ui/card";
import { saveClientOnboardingAction } from "@/lib/organization/onboarding-actions";
import { loadOnboardingByToken } from "@/lib/organization/onboarding-records";

type ClientOnboardingPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    saved?: string;
    submitted?: string;
  }>;
};

export const metadata = {
  title: "Open Spot onboarding",
  robots: {
    index: false,
    follow: false
  }
};

export default async function ClientOnboardingPage({
  params,
  searchParams
}: ClientOnboardingPageProps) {
  const { token } = await params;
  const query = searchParams ? await searchParams : {};
  const record = await loadOnboardingByToken(token).catch(() => null);

  if (!record) {
    notFound();
  }

  if (record.status === "completed") {
    return (
      <div className="min-h-screen bg-[#f7f9fd] px-4 py-10">
        <Card className="mx-auto max-w-2xl p-7">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--primary)]">
            Open Spot onboarding
          </p>
          <h1 className="mt-3 text-3xl font-black">Onboarding completed.</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            The setup team has completed review for {record.organization.name}.
            SMS activation still depends on billing and SMS status checks.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
            href="/"
          >
            Back to Open Spot
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <ClientOnboardingFlow
      action={saveClientOnboardingAction}
      error={query.error}
      record={record}
      saved={query.saved === "1"}
      submitted={query.submitted === "1"}
      token={token}
    />
  );
}
