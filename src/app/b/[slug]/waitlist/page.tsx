import { notFound } from "next/navigation";

import { WaitlistPreview } from "@/components/forms/waitlist-preview";
import { getPublicWaitlistProfile } from "@/lib/waitlist/public-profile";
import { normalizeWaitlistSignupSource } from "@/lib/waitlist/sources";

export const dynamic = "force-dynamic";

type WaitlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    source?: string;
  }>;
};

export default async function WaitlistPage({
  params,
  searchParams
}: WaitlistPageProps) {
  const { slug } = await params;
  const { source } = await searchParams;
  const profile = await getPublicWaitlistProfile(slug);
  const signupSource = normalizeWaitlistSignupSource(source);

  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl content-center gap-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
          Open Spot
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          Join the SMS waitlist for {profile.name}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Add your name and phone number to hear about last-minute openings.
          SMS consent is explicit and you can unsubscribe anytime.
        </p>
      </div>
      <WaitlistPreview
        merchantName={profile.name}
        services={profile.services}
        signupSource={signupSource}
        slug={profile.slug}
      />
    </main>
  );
}
