import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { ImportExportPanel } from "@/components/import/import-export-panel";
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
    description:
      "24h reminders, YES/OUI confirmation, NO/NON cancellation, STOP/ARRET handling, and message history.",
    settings: [
      "appointment_reminders_enabled",
      "appointment_confirmation_requests_enabled",
      "client_sms_cancellation_enabled"
    ]
  },
  {
    title: "Anti No-Show",
    description:
      "24h reminder tracking, non-response lists, no-show reporting, and conservative delay controls. Optional 2h reminders stay future until backend support is safe.",
    settings: [
      "default_reminder_delay_hours",
      "appointment_confirmation_requests_enabled"
    ]
  },
  {
    title: "Recovery Pro",
    description:
      "SMS cancellations can create recoverable openings, alert opted-in waitlist clients, rank respondents by timestamp, and keep merchant validation mandatory.",
    settings: [
      "auto_create_opening_on_sms_cancellation",
      "auto_send_recovery_sms_on_cancellation",
      "unavailable_sms_to_non_selected_enabled"
    ]
  },
  {
    title: "Client Reactivation",
    description:
      "Future/optional winback messages for inactive clients. This requires stronger marketing consent review before any SMS is sent.",
    settings: ["future/optional"]
  },
  {
    title: "Post-Service Follow-Up",
    description:
      "Future/optional thank-you, review, and rebooking prompts. This remains off until consent and review-platform policies are reviewed.",
    settings: ["future/optional"]
  }
];

const settingLabels: Record<keyof AutomationSettings, string> = {
  appointment_reminders_enabled: "Enable appointment reminders",
  default_reminder_delay_hours: "Reminder delay hours",
  appointment_confirmation_requests_enabled: "Request confirmation in reminder",
  client_sms_cancellation_enabled: "Enable client cancellation by SMS",
  auto_create_opening_on_sms_cancellation: "Auto-create opening on SMS cancellation",
  auto_send_recovery_sms_on_cancellation: "Auto-send recovery SMS after cancellation",
  unavailable_sms_to_non_selected_enabled:
    "Unavailable SMS to non-selected respondents",
  sms_daily_limit: "Daily SMS limit",
  sms_monthly_limit: "Monthly SMS limit"
};

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

function formatSettingValue(
  settings: AutomationSettings,
  key: keyof AutomationSettings
) {
  const value = settings[key];

  if (typeof value === "boolean") {
    return value ? "Enabled" : "Disabled";
  }

  return String(value);
}

export default async function SettingsPage() {
  const workspace = await getActiveOrganizationWorkspace();
  const organization =
    workspace.status === "ready" ? workspace.organization : null;
  const automationSettings = await loadAutomationSettings(organization?.id ?? null);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Parametres reels de l'organisation et controles de securite SMS."
        title="Parametres"
      />
      <Panel title="Commerce actuel">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-black">Business name</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.name ?? "Supabase non configure"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Phone</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.phone ?? "Non renseigne"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Timezone</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.timezone ?? "America/Toronto"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Main language</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {(organization?.defaultLanguage ?? "fr").toUpperCase()}
            </dd>
          </div>
        </dl>
      </Panel>
      <Panel
        description="Only owners/admins should change these settings. This page is read-only until the settings edit flow is audited and setting changes can be logged safely."
        title="Automation bundles"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {automationBundles.map((bundle) => (
            <div
              className="rounded-[1.5rem] border border-[var(--line)] bg-slate-50 p-4"
              key={bundle.title}
            >
              <p className="font-black text-[var(--foreground)]">{bundle.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {bundle.description}
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
                        : setting}
                    </span>
                    <span className="shrink-0 font-black text-[var(--foreground)]">
                      {setting in settingLabels
                        ? formatSettingValue(
                            automationSettings,
                            setting as keyof AutomationSettings
                          )
                        : "Future"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        description="These controls show current database settings. They are disabled here until owner/admin updates are audited."
        title="Current automation settings"
      >
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(settingLabels) as Array<keyof AutomationSettings>).map(
            (key) => (
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
                    {formatSettingValue(automationSettings, key)}
                  </span>
                )}
              </label>
            )
          )}
        </div>
      </Panel>
      <Panel title="Import / export">
        <ImportExportPanel />
      </Panel>
      <Panel title="Compliance basics">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Les clients doivent avoir accepte de recevoir des SMS avant tout envoi.
          Les mots-cles STOP, ARRET et UNSUBSCRIBE doivent exclure automatiquement
          les clients desinscrits des prochaines alertes. Les recuperations de
          rendez-vous restent sous validation manuelle du commercant.
        </p>
      </Panel>
    </div>
  );
}
