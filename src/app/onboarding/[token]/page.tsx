import Link from "next/link";

export const metadata = {
  title: "Open Spot",
  robots: {
    index: false,
    follow: false
  }
};

export default function DeprecatedClientOnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
        Open Spot
      </p>
      <h1 className="mt-3 text-3xl font-black">This setup link is no longer used.</h1>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        Company setup links are no longer used. Your company access is managed
        by the Open Spot platform team. If you need help, sign in or contact
        support.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-11 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
          href="/sign-in"
        >
          Sign in
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
          href="/dashboard"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
