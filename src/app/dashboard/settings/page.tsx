import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { ImportExportPanel } from "@/components/import/import-export-panel";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OrganizationSettingsRow =
  Database["public"]["Tables"]["organization_settings"]["Row"];

type AutomationSettings = Pick<
  OrganizationSettingsRow,
  | "appointment_reminders_enabled"
  | "default_reminder_delay_hours"
  | "appointment_confirmation_requests_enabled"
  | "client_sms_cancellation_enabled"
  | "auto_create_opening_on_sms_cancellation"
  | "auto_send_recovery_sms_on_cancellation"
  | "unavailable_sms_to_non_selected_enabled"
  | "sms_daily_limit"
  | "sms_monthly_limit"
>;

const conservativeAutomationSettings: AutomationSettings = {
  appointment_reminders_enabled: false,
  default_reminder_delay_hours: 24,
  appointment_confirmation_requests_enabled: false,
  client_sms_cancellation_enabled: false,
  auto_create_opening_on_sms_cancellation: false,
  auto_send_recovery_sms_on_cancellation: false,
  unavailable_sms_to_non_selected_enabled: false,
  sms_daily_limit: 50,
  sms_monthly_limit: 1000
};

const automationBundles = [
  {
    title: "Essential SMS",
    descriptionKey: "essential",
    settings: [
      "appointment_reminders_enabled",
      "appointment_confirmation_requests_enabled",
      "client_sms_cancellation_enabled"
    ]
  },
  {
    title: "Anti No-Show",
    descriptionKey: "noShow",
    settings: [
      "default_reminder_delay_hours",
      "appointment_confirmation_requests_enabled"
    ]
  },
  {
    title: "Recovery Pro",
    descriptionKey: "recovery",
    settings: [
      "auto_create_opening_on_sms_cancellation",
      "auto_send_recovery_sms_on_cancellation",
      "unavailable_sms_to_non_selected_enabled"
    ]
  },
  {
    title: "Client Reactivation",
    descriptionKey: "reactivation",
    settings: ["future/optional"]
  },
  {
    title: "Post-Service Follow-Up",
    descriptionKey: "followUp",
    settings: ["future/optional"]
  }
] as const;

async function loadAutomationSettings(
  organizationId: string | null
): Promise<AutomationSettings> {
  if (!organizationId) {
    return conservativeAutomationSettings;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organization_settings")
    .select(
      "appointment_reminders_enabled, default_reminder_delay_hours, appointment_confirmation_requests_enabled, client_sms_cancellation_enabled, auto_create_opening_on_sms_cancellation, auto_send_recovery_sms_on_cancellation, unavailable_sms_to_non_selected_enabled, sms_daily_limit, sms_monthly_limit"
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? conservativeAutomationSettings;
}

function formatSettingValue({
  disabledLabel,
  enabledLabel,
  key,
  settings
}: {
  disabledLabel: string;
  enabledLabel: string;
  key: keyof AutomationSettings;
  settings: AutomationSettings;
}) {
  const value = settings[key];

  if (typeof value === "boolean") {
    return value ? enabledLabel : disabledLabel;
  }

  return String(value);
}

export default async function SettingsPage() {
  const [workspace, locale] = await Promise.all([
    getActiveOrganizationWorkspace(),
    getRequestLocale()
  ]);
  const copy = getDashboardCopy(locale);
  const organization =
    workspace.status === "ready" ? workspace.organization : null;
  const automationSettings = await loadAutomationSettings(organization?.id ?? null);
  const settingLabels = copy.settings.settingLabels;
  const settingKeys = Object.keys(settingLabels) as Array<keyof AutomationSettings>;

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description={copy.settings.description}
        title={copy.settings.title}
      />
      <Panel title={copy.settings.currentBusiness}>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-black">{copy.settings.businessName}</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.name ?? copy.settings.notConfigured}
            </dd>
          </div>
          <div>
            <dt className="font-black">{copy.settings.phone}</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.phone ?? copy.settings.notProvided}
            </dd>
          </div>
          <div>
            <dt className="font-black">{copy.settings.timezone}</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.timezone ?? "America/Toronto"}
            </dd>
          </div>
          <div>
            <dt className="font-black">{copy.settings.mainLanguage}</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {(organization?.defaultLanguage ?? "fr").toUpperCase()}
            </dd>
          </div>
        </dl>
      </Panel>
      <Panel
        description={copy.settings.automationDescription}
        title={copy.settings.automationBundles}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {automationBundles.map((bundle) => (
            <div
              className="rounded-[1.5rem] border border-[var(--line)] bg-slate-50 p-4"
              key={bundle.title}
            >
              <p className="font-black text-[var(--foreground)]">{bundle.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {copy.settings.bundleDescriptions[bundle.descriptionKey]}
              </p>
              <ul className="mt-4 grid gap-2 text-sm">
                {bundle.settings.map((setting) => (
                  <li
                    className="flex items-start justify-between gap-3 rounded-2xl bg-white px-3 py-2"
                    key={setting}
                  >
                    <span className="text-[var(--muted)]">
                      {setting in settingLabels
                        ? settingLabels[setting as keyof AutomationSettings]
                        : copy.settings.future}
                    </span>
                    <span className="shrink-0 font-black text-[var(--foreground)]">
                      {setting in settingLabels
                        ? formatSettingValue({
                            disabledLabel: copy.settings.disabled,
                            enabledLabel: copy.settings.enabled,
                            key: setting as keyof AutomationSettings,
                            settings: automationSettings
                          })
                        : copy.settings.future}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        description={copy.settings.currentAutomationDescription}
        title={copy.settings.currentAutomationSettings}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {settingKeys.map((key) => (
            <label
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm"
              key={key}
            >
              <span className="font-bold text-[var(--foreground)]">
                {settingLabels[key]}
              </span>
              {typeof automationSettings[key] === "boolean" ? (
                <input
                  checked={Boolean(automationSettings[key])}
                  className="h-5 w-5"
                  disabled
                  readOnly
                  type="checkbox"
                />
              ) : (
                <span className="font-black text-[var(--foreground)]">
                  {formatSettingValue({
                    disabledLabel: copy.settings.disabled,
                    enabledLabel: copy.settings.enabled,
                    key,
                    settings: automationSettings
                  })}
                </span>
              )}
            </label>
          ))}
        </div>
      </Panel>
      <Panel title={copy.settings.importExport}>
        <ImportExportPanel />
      </Panel>
      <Panel title={copy.settings.complianceBasics}>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {copy.settings.complianceText}
        </p>
      </Panel>
    </div>
  );
}
