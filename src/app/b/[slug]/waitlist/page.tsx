import { WaitlistPreview } from "@/components/forms/waitlist-preview";

type WaitlistPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WaitlistPage({ params }: WaitlistPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl content-center gap-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
          2e Chance RDV
        </p>
        <h1 className="mt-3 text-3xl font-bold">Join the SMS waitlist</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          This public placeholder is scoped to one business slug and will later
          store explicit consent before any SMS eligibility is granted.
        </p>
      </div>
      <WaitlistPreview slug={slug} />
    </main>
  );
}
