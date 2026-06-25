import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import {
  completeOnboardingAction,
  generateOnboardingLinkAction,
  markOnboardingReadyForSmsAction,
  requestOnboardingChangesAction
} from "@/lib/organization/onboarding-actions";
import { getOnboardingStatusLabel } from "@/lib/organization/client-onboarding";
import { loadOnboardingByOrganization } from "@/lib/organization/onboarding-records";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

type AdminOrganizationOnboardingPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    generated?: string;
    reviewed?: string;
    token?: string;
  }>;
};

function formatMoney(cents: number | null, currency: string) {
  if (cents === null) {
    return "Not provided";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("en-CA") : "Not recorded";
}

export default async function AdminOrganizationOnboardingPage({
  params,
  searchParams
}: AdminOrganizationOnboardingPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status === "unconfigured") {
    return (
      <section className="grid gap-6">
        <h1 className="text-3xl font-black">Client onboarding</h1>
        <Card>{access.message}</Card>
      </section>
    );
  }

  if (access.status !== "authorized") {
    notFound();
  }

  const record = await loadOnboardingByOrganization({
    organizationId: id,
    admin: access.admin
  });
  const generatedPath = query.token
    ? `/onboarding/${encodeURIComponent(query.token)}`
    : null;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[var(--primary)]">
            Company onboarding
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {record?.organization.name ?? "Onboarding setup"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Generate a secure client link, review submitted setup details, and
            only mark onboarding complete after SMS compliance is acceptable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
            href={`/admin/organizations/${id}`}
          >
            Back to overview
          </Link>
          {record ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
              href={`/admin/organizations/${id}/onboarding`}
            >
              Refresh
            </Link>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <Card className="border-red-200 bg-red-50 text-red-800">
          <p className="font-black">Onboarding action failed</p>
          <p className="mt-1 text-sm">{query.error}</p>
        </Card>
      ) : null}

      {query.reviewed ? (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <p className="font-black">Review status updated.</p>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-black">Secure client link</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The raw token is shown once after generation. The database stores
              only its SHA-256 hash. Regenerating replaces the previous link.
            </p>
            {record ? (
              <dl className="mt-4 grid gap-2 text-sm">
                <div>
                  <dt className="font-bold text-[var(--muted)]">Status</dt>
                  <dd className="font-black">
                    {getOnboardingStatusLabel(record.status, "en")}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--muted)]">Link expires</dt>
                  <dd>{formatDate(record.tokenExpiresAt)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm font-bold text-[var(--muted)]">
                No onboarding link has been generated yet.
              </p>
            )}
          </div>
          <form action={generateOnboardingLinkAction}>
            <input name="organizationId" type="hidden" value={id} />
            <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
              {record ? "Regenerate link" : "Generate link"}
            </button>
          </form>
        </div>
        {generatedPath ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-900">
              New link generated. Copy it now; it will not be shown again.
            </p>
            <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-xs text-amber-900">
              {generatedPath}
            </p>
          </div>
        ) : null}
      </Card>

      {!record ? (
        <Card>
          <h2 className="text-lg font-black">Waiting for link generation</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Generate a link before the client can submit onboarding details.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <p className="text-sm font-bold text-[var(--muted)]">Submitted</p>
              <p className="mt-2 text-lg font-black">{formatDate(record.submittedAt)}</p>
            </Card>
            <Card>
              <p className="text-sm font-bold text-[var(--muted)]">Reviewed</p>
              <p className="mt-2 text-lg font-black">{formatDate(record.reviewedAt)}</p>
            </Card>
            <Card>
              <p className="text-sm font-bold text-[var(--muted)]">Completed</p>
              <p className="mt-2 text-lg font-black">{formatDate(record.completedAt)}</p>
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-black">Submitted details</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="font-bold text-[var(--muted)]">Business</dt>
                  <dd>{record.businessName}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--muted)]">Business type</dt>
                  <dd>{record.businessType || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--muted)]">Booking system</dt>
                  <dd>{record.bookingSystem || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--muted)]">Contact</dt>
                  <dd>
                    {record.publicContactEmail || "No email"} ·{" "}
                    {record.publicContactPhone || "No phone"}
                  </dd>
                </div>
              </dl>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="font-bold text-[var(--muted)]">Responsible</dt>
                  <dd>
                    {record.responsibleName || "Not provided"} ·{" "}
                    {record.responsibleRole || "No role"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--muted)]">Responsible email</dt>
                  <dd>{record.responsibleEmail || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--muted)]">Average value</dt>
                  <dd>
                    {formatMoney(
                      record.averageAppointmentValueCents,
                      record.currency
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[var(--muted)]">SMS preferences</dt>
                  <dd>
                    {record.smsLanguage.toUpperCase()} · {record.smsTone} · quiet{" "}
                    {record.smsQuietHoursStart}-{record.smsQuietHoursEnd}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Services</h2>
            {record.services.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">No services provided.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                    <tr>
                      <th className="py-2">Service</th>
                      <th className="py-2">Duration</th>
                      <th className="py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.services.map((service) => (
                      <tr className="border-t border-[var(--line)]" key={service.name}>
                        <td className="py-3 font-bold">{service.name}</td>
                        <td className="py-3">{service.durationMinutes ?? "—"} min</td>
                        <td className="py-3">
                          {formatMoney(service.valueCents, record.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-black">Compliance review</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <p>
                Consent accepted:{" "}
                <strong>{record.consentStatementAccepted ? "Yes" : "No"}</strong>
              </p>
              <p>
                Responsible:{" "}
                <strong>{record.consentResponsibleName || "Not provided"}</strong>
              </p>
              <p>
                Accepted at: <strong>{formatDate(record.consentAcceptedAt)}</strong>
              </p>
              <p className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4 font-bold">
                Manual confirmation rule: SMS replies identify interested clients.
                The merchant must manually choose and confirm the appointment.
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Admin review actions</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <form action={requestOnboardingChangesAction} className="grid gap-3">
                <input name="organizationId" type="hidden" value={id} />
                <textarea
                  className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                  defaultValue={record.requestedChanges ?? ""}
                  name="requestedChanges"
                  placeholder="Changes required before SMS setup"
                  required
                />
                <textarea
                  className="min-h-20 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                  defaultValue={record.adminNotes ?? ""}
                  name="adminNotes"
                  placeholder="Internal notes"
                />
                <button className="min-h-11 rounded-full border border-amber-200 bg-amber-50 px-5 text-sm font-black text-amber-800" type="submit">
                  Request changes
                </button>
              </form>
              <form action={markOnboardingReadyForSmsAction} className="grid gap-3">
                <input name="organizationId" type="hidden" value={id} />
                <textarea
                  className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                  defaultValue={record.adminNotes ?? ""}
                  name="adminNotes"
                  placeholder="Internal notes"
                />
                <button className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white" type="submit">
                  Mark ready for SMS setup
                </button>
              </form>
              <form action={completeOnboardingAction} className="grid gap-3">
                <input name="organizationId" type="hidden" value={id} />
                <textarea
                  className="min-h-28 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
                  defaultValue={record.adminNotes ?? ""}
                  name="adminNotes"
                  placeholder="Completion note"
                />
                <button className="min-h-11 rounded-full border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-800" type="submit">
                  Complete onboarding
                </button>
              </form>
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
