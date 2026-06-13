import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  loadAdminOrganizationDetail,
  normalizeAdminTimeRange
} from "@/lib/admin/organizations";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";

const numberFormatter = new Intl.NumberFormat("en-CA");
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(value: string | null) {
  if (!value) {
    return "No activity";
  }

  return dateFormatter.format(new Date(value));
}

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function Metric({
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
      <p className="mt-3 text-2xl font-black">{value}</p>
      {note ? <p className="mt-2 text-xs text-[var(--muted)]">{note}</p> : null}
    </Card>
  );
}

export default async function AdminOrganizationDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const range = normalizeAdminTimeRange(getSingleSearchParam(resolvedSearchParams.range));
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black">Company detail</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {access.message}
          </p>
        </div>
      </section>
    );
  }

  const detail = await loadAdminOrganizationDetail({
    admin: access.admin,
    organizationId: id,
    timeRange: range
  });

  if (!detail) {
    notFound();
  }

  const organization = detail.organization;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Company overview
          </p>
          <h1 className="mt-2 text-3xl font-black">{organization.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Read-only platform admin view. No manager mode or impersonation is
            enabled in this phase.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black transition hover:bg-[#f2f7f4]"
          href={`/admin/organizations?range=${detail.timeRange}`}
        >
          Back to companies
        </Link>
      </div>

      <Card className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Identity
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="font-bold text-[var(--muted)]">Organization ID</dt>
              <dd className="break-all font-mono text-xs">{organization.id}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Slug</dt>
              <dd>{organization.slug ?? "No slug"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Created</dt>
              <dd>{formatDate(organization.createdAt)}</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            Owner / access
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="font-bold text-[var(--muted)]">Owner email</dt>
              <dd>{organization.ownerEmail ?? "Unknown"}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Access level</dt>
              <dd>{organization.accessLevel}</dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--muted)]">Last activity</dt>
              <dd>{formatDate(organization.lastActivityAt)}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Customers"
          value={numberFormatter.format(organization.customersCount)}
        />
        <Metric
          label="Opted-in customers"
          value={numberFormatter.format(organization.optedInCustomersCount)}
        />
        <Metric
          label="Openings"
          note={`${detail.timeRange} days`}
          value={numberFormatter.format(organization.openingsCount)}
        />
        <Metric
          label="Filled spots"
          note="Validated openings only"
          value={numberFormatter.format(organization.filledSpotsCount)}
        />
        <Metric
          label="Outbound SMS"
          note={`${detail.timeRange} days`}
          value={numberFormatter.format(organization.outboundSmsCount)}
        />
        <Metric
          label="Inbound SMS"
          note={`${detail.timeRange} days`}
          value={numberFormatter.format(organization.inboundSmsCount)}
        />
        <Metric
          label="Failed SMS"
          note="failed, undelivered, or error"
          value={numberFormatter.format(organization.failedSmsCount)}
        />
        <Metric
          label="Estimated SMS cost"
          note="Estimated, not an invoice"
          value={formatEstimatedSmsCost(organization.estimatedSmsCostCents)}
        />
      </div>

      <Card>
        <h2 className="text-lg font-black">Manager mode not enabled yet</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          This phase stores access levels for future manager mode, but there is
          no impersonation, no merchant override, and no functional Open as
          manager action here.
        </p>
      </Card>
    </section>
  );
}
