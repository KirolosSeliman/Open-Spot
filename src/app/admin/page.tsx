import Link from "next/link";

import { Card } from "@/components/ui/card";
import { signOutAction } from "@/lib/auth/actions";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { loadAdminOverview } from "@/lib/admin/organizations";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";

const numberFormatter = new Intl.NumberFormat("en-CA");

function StatCard({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card>
      <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--foreground)]">{value}</p>
      {note ? <p className="mt-2 text-xs text-[var(--muted)]">{note}</p> : null}
    </Card>
  );
}

export default async function AdminPage() {
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Admin Open Spot
          </p>
          <h1 className="mt-2 text-3xl font-black">Admin access is not configured.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {access.message}
          </p>
        </div>
      </section>
    );
  }

  const overview = await loadAdminOverview({ admin: access.admin });

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Admin Open Spot
          </p>
          <h1 className="mt-2 text-3xl font-black">Vue interne plateforme</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Read-only operational overview for companies visible to your admin
            account.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white transition hover:bg-[var(--primary-strong)]"
          href="/admin/organizations"
        >
          View companies
        </Link>
      </div>

      <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black">{overview.admin.email}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Role: {overview.admin.role}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--muted)]">
            Lecture seule
          </span>
          <form action={signOutAction}>
            <button
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--foreground)] transition hover:bg-[#f2f7f4]"
              type="submit"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Companies visible"
          value={numberFormatter.format(overview.visibleCompaniesCount)}
        />
        <StatCard
          label="SMS sent"
          note="Last 30 days"
          value={numberFormatter.format(overview.outboundSmsCount)}
        />
        <StatCard
          label="Estimated SMS cost"
          note="Estimated, not an invoice"
          value={formatEstimatedSmsCost(overview.estimatedSmsCostCents)}
        />
        <StatCard
          label="Filled spots"
          note="Validated openings only"
          value={numberFormatter.format(overview.filledSpotsCount)}
        />
      </div>
    </section>
  );
}
