import { notFound } from "next/navigation";

import { WaitlistPreview } from "@/components/forms/waitlist-preview";
import { getPublicWaitlistProfile } from "@/lib/waitlist/public-profile";

export const dynamic = "force-dynamic";

type KioskWaitlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function KioskWaitlistPage({
  params
}: KioskWaitlistPageProps) {
  const { slug } = await params;
  const profile = await getPublicWaitlistProfile(slug);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-4xl content-center gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Open Spot
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Join the SMS waitlist for {profile.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Leave your mobile number to receive last-minute appointment
            openings from this business. The form resets after each signup.
          </p>
        </div>
        <WaitlistPreview
          merchantName={profile.name}
          services={profile.services}
          signupSource="kiosk"
          slug={profile.slug}
          variant="kiosk"
        />
      </div>
    </main>
  );
}
