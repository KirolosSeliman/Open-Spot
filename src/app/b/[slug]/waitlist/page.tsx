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
    <main className="grid min-h-screen w-full min-w-0 max-w-full place-items-center overflow-x-clip bg-[radial-gradient(circle_at_18%_8%,rgba(79,125,243,0.14),transparent_28rem),#f7f9fd] px-[clamp(12px,4vw,20px)] py-10 sm:px-6">
      <div className="w-full min-w-0 max-w-3xl rounded-[2rem] border border-[var(--line)] bg-white/90 p-5 shadow-[var(--card-shadow)] sm:p-8">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
          Open Spot
        </p>
        <h1 className="mt-3 break-words text-[clamp(1.5rem,6vw,1.875rem)] font-bold leading-tight">
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
      </div>
    </main>
  );
}
