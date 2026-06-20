import Image from "next/image";
import Link from "next/link";

import { RequestCallForm } from "@/components/marketing/request-call-form";

export const metadata = {
  title: "Request a call | Open Spot",
  description:
    "Request a quick Open Spot setup call and get a personalized recommendation for your appointment business."
};

const trustBullets = [
  "Quick 15-minute conversation",
  "Personalized setup recommendation",
  "SMS volume matched to your needs",
  "Manual confirmation stays in your control"
] as const;

export default function BookCallPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(52,120,255,0.12),transparent_30rem),linear-gradient(180deg,#f7fbff_0%,#ffffff_42%)] px-4 py-5 text-[var(--foreground)] sm:px-6">
      <header className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between">
        <Link
          className="flex items-center gap-2 rounded-full font-black text-[#05070d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
          href="/"
        >
          <Image
            alt=""
            className="h-10 w-10 rounded-2xl"
            height={96}
            src="/brand/open-spot-icon.svg"
            width={96}
          />
          <span>Open Spot</span>
        </Link>
        <Link
          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
          href="/"
        >
          Back home
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:py-24">
        <div className="motion-safe:animate-[open-spot-call-enter_650ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <span className="inline-flex rounded-full border border-blue-200 bg-white/86 px-4 py-2 text-sm font-black text-[var(--primary)] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            Personalized setup
          </span>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Request a 15-minute call
          </p>
          <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-[#05070d] sm:text-6xl">
            {"Let's find the right setup for your business."}
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#53657f]">
            Leave your details and we&apos;ll contact you to schedule a quick call.
            No generic plan, no pressure - just a setup recommendation based on
            your workflow, volume, and goals.
          </p>

          <div className="mt-9 grid gap-3">
            {trustBullets.map((bullet) => (
              <div
                className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/82 px-4 py-3 text-sm font-black text-[#24324a] shadow-sm"
                key={bullet}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-white text-[var(--primary)]">
                  ✓
                </span>
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div className="motion-safe:animate-[open-spot-call-enter_750ms_cubic-bezier(0.22,1,0.36,1)_120ms_both]">
          <RequestCallForm />
        </div>
      </section>
    </main>
  );
}
