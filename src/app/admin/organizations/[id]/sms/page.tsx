import { notFound } from "next/navigation";

import { SmsConfigurationShell } from "@/components/sms/sms-configuration-shell";
import { SmsPageHeader } from "@/components/sms/sms-page-header";
import { parseSmsTab } from "@/components/sms/sms-shared";
import { loadAdminSmsDiagnostics } from "@/lib/admin/sms-diagnostics";
import { loadSafeOrganizationSmsSenderView } from "@/lib/admin/sms-sender-actions";
import {
  deriveSmsActivationPrerequisites,
  deriveSmsTestDeliveryResults,
  loadSmsActivityMetrics,
  loadSmsRecentEvents
} from "@/lib/sms/configuration-data";
import { loadOrganizationSmsReadiness } from "@/lib/sms/organization-gate";
import {
  getOrCreateOrganizationSmsSender,
  loadOrganizationSmsSender,
  toSafeOrganizationSmsSenderView
} from "@/lib/sms/organization-sender";
import { computeSmsSenderReadiness } from "@/lib/sms/sms-setup-readiness";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOrganizationSmsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    notFound();
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const activeTab = parseSmsTab(one(resolvedSearchParams.tab));
  const baseHref = `/admin/organizations/${id}/sms`;

  const [{ data: organization }, diagnostics] = await Promise.all([
    supabase.from("organizations").select("id, name").eq("id", id).maybeSingle(),
    loadAdminSmsDiagnostics({
      admin: access.admin,
      organizationId: id,
      searchParams: resolvedSearchParams,
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

  const [metrics, events] = await Promise.all([
    loadSmsActivityMetrics(id, safeSender),
    loadSmsRecentEvents(id)
  ]);

  const testSteps = deriveSmsTestDeliveryResults(safeSender);
  const prerequisites = deriveSmsActivationPrerequisites({
    sender: safeSender,
    readiness,
    organizationReadiness
  });

  return (
    <section className="mx-auto grid max-w-[1280px] gap-6 bg-[#f7fbff] pb-10">
      <SmsPageHeader />

      <SmsConfigurationShell
        activeTab={activeTab}
        activityFilters={{
          q: diagnostics.filters.q,
          status: diagnostics.filters.status,
          direction: diagnostics.filters.direction,
          from: diagnostics.filters.range.fromIso,
          to: diagnostics.filters.range.toIso,
          page: diagnostics.filters.page
        }}
        baseHref={baseHref}
        events={events}
        isSuperAdmin={access.admin.role === "super_admin"}
        journalRows={diagnostics.rows}
        metrics={metrics}
        organizationId={id}
        organizationName={organization.name}
        prerequisites={prerequisites}
        readiness={readiness}
        realSmsEnabled={process.env.ALLOW_REAL_SMS_SENDS === "true"}
        recentActivity={diagnostics.rows.slice(0, 5)}
        sender={safeSender}
        testSteps={testSteps}
      />
    </section>
  );
}
