import { notFound } from "next/navigation";

import { SmsBookIcon } from "@/components/admin/sms-configuration-icons";
import { SmsConfigurationDashboard } from "@/components/admin/sms-configuration-dashboard";
import { loadAdminSmsDiagnostics } from "@/lib/admin/sms-diagnostics";
import { loadSafeOrganizationSmsSenderView } from "@/lib/admin/sms-sender-actions";
import { loadOrganizationSmsReadiness } from "@/lib/sms/organization-gate";
import {
  getOrCreateOrganizationSmsSender,
  loadOrganizationSmsSender,
  toSafeOrganizationSmsSenderView
} from "@/lib/sms/organization-sender";
import { computeSmsSenderReadiness } from "@/lib/sms/sms-setup-readiness";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export default async function AdminOrganizationSmsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    notFound();
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const [{ data: organization }, diagnostics] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", id).maybeSingle(),
    loadAdminSmsDiagnostics({
      admin: access.admin,
      organizationId: id,
      auditAction: "admin.organization.sms_viewed"
    })
  ]);

  if (!organization) {
    notFound();
  }

  let sender = await loadOrganizationSmsSender(id);

  if (!sender && access.admin.role === "super_admin") {
    sender = await getOrCreateOrganizationSmsSender({
      organizationId: id,
      createdByPlatformAdminId: access.admin.id
    });
  }

  const organizationReadiness = await loadOrganizationSmsReadiness(supabase, id);
  const readiness = computeSmsSenderReadiness({
    sender,
    organizationReadiness
  });
  const safeSender =
    (await loadSafeOrganizationSmsSenderView(id)) ??
    toSafeOrganizationSmsSenderView(sender);

  return (
    <section className="mx-auto grid max-w-6xl gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">
            Open Spot
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)]">
            Configuration SMS
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Gérez l&apos;envoi de SMS, les modèles, les tests et la conformité.
          </p>
        </div>

        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[var(--line)] bg-white px-5 text-sm font-bold text-[var(--foreground)] shadow-sm transition hover:bg-slate-50"
          href="https://github.com/KirolosSeliman/Open-Spot/blob/main/docs/sms-compliance-notes.md"
        >
          <SmsBookIcon className="h-4 w-4" />
          Documentation
        </a>
      </div>

      <SmsConfigurationDashboard
        isSuperAdmin={access.admin.role === "super_admin"}
        organizationId={id}
        organizationName={organization.name}
        readiness={readiness}
        realSmsEnabled={process.env.ALLOW_REAL_SMS_SENDS === "true"}
        recentActivity={diagnostics.rows.slice(0, 5)}
        sender={safeSender}
      />
    </section>
  );
}
