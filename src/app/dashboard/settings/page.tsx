import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { ImportExportPanel } from "@/components/import/import-export-panel";
import { updateSmartSmsSettingsAction } from "@/lib/dashboard/actions";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { defaultSmartSmsSettings } from "@/lib/sms/smart-recipient-engine";
import { checkSmartSmsPersistenceReadiness } from "@/lib/sms/smart-sms-persistence-readiness";
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

type SmartSmsDisplaySettings = Pick<
  OrganizationSettingsRow,
  | "smart_sending_enabled"
  | "cooldown_after_completed_appointment_days"
  | "cooldown_after_filled_spot_days"
  | "max_sms_per_day"
  | "max_sms_per_7_days"
  | "max_sms_per_30_days"
  | "block_if_future_appointment_exists"
  | "future_appointment_window_days"
  | "allowed_send_start_time"
  | "allowed_send_end_time"
  | "always_review_recipients_before_send"
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

const conservativeSmartSmsSettings: SmartSmsDisplaySettings = {
  smart_sending_enabled: defaultSmartSmsSettings.smartSendingEnabled,
  cooldown_after_completed_appointment_days:
    defaultSmartSmsSettings.cooldownAfterCompletedAppointmentDays,
  cooldown_after_filled_spot_days:
    defaultSmartSmsSettings.cooldownAfterFilledSpotDays,
  max_sms_per_day: defaultSmartSmsSettings.maxSmsPerDay,
  max_sms_per_7_days: defaultSmartSmsSettings.maxSmsPer7Days,
  max_sms_per_30_days: defaultSmartSmsSettings.maxSmsPer30Days,
  block_if_future_appointment_exists:
    defaultSmartSmsSettings.blockIfFutureAppointmentExists,
  future_appointment_window_days:
    defaultSmartSmsSettings.futureAppointmentWindowDays,
  allowed_send_start_time: defaultSmartSmsSettings.allowedSendStartTime,
  allowed_send_end_time: defaultSmartSmsSettings.allowedSendEndTime,
  always_review_recipients_before_send:
    defaultSmartSmsSettings.alwaysReviewRecipientsBeforeSend
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

async function loadSmartSmsSettings(
  organizationId: string | null
): Promise<SmartSmsDisplaySettings> {
  if (!organizationId) {
    return conservativeSmartSmsSettings;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organization_settings")
    .select(
      "smart_sending_enabled, cooldown_after_completed_appointment_days, cooldown_after_filled_spot_days, max_sms_per_day, max_sms_per_7_days, max_sms_per_30_days, block_if_future_appointment_exists, future_appointment_window_days, allowed_send_start_time, allowed_send_end_time, always_review_recipients_before_send"
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? conservativeSmartSmsSettings;
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
  const [automationSettings, smartSmsReadiness] = await Promise.all([
    loadAutomationSettings(organization?.id ?? null),
    checkSmartSmsPersistenceReadiness()
  ]);
  const smartSmsSettings = smartSmsReadiness.ready
    ? await loadSmartSmsSettings(organization?.id ?? null)
    : conservativeSmartSmsSettings;
  const settingLabels = copy.settings.settingLabels;
  const settingKeys = Object.keys(settingLabels) as Array<keyof AutomationSettings>;
  const smartSmsCopy = copy.settings.smartSms;

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
                    className="os-mobile-kv-row flex flex-col gap-2 rounded-2xl bg-white px-3 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                    key={setting}
                  >
                    <span className="min-w-0 text-[var(--muted)]">
                      {setting in settingLabels
                        ? settingLabels[setting as keyof AutomationSettings]
                        : copy.settings.future}
                    </span>
                    <span className="max-w-full shrink-0 font-black text-[var(--foreground)] sm:shrink-0">
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
              className="flex min-h-14 flex-col gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              key={key}
            >
              <span className="min-w-0 font-bold text-[var(--foreground)]">
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
      <Panel
        description={smartSmsCopy.description}
        title={smartSmsCopy.title}
      >
        {!smartSmsReadiness.ready ? (
          <p className="mb-4 rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
            {smartSmsReadiness.blockingReasons[0] ??
              "Mode intelligent SMS indisponible : migration non appliquée."}
          </p>
        ) : null}
        <form action={updateSmartSmsSettingsAction} className="grid gap-3">
          <fieldset
            className="grid gap-3 md:grid-cols-2"
            disabled={!smartSmsReadiness.ready || !organization}
          >
            <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.smartMode}
              </span>
              <input
                className="h-5 w-5"
                defaultChecked={smartSmsSettings.smart_sending_enabled}
                name="smart_sending_enabled"
                type="checkbox"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.completedCooldown}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.cooldown_after_completed_appointment_days}
                max={90}
                min={0}
                name="cooldown_after_completed_appointment_days"
                type="number"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.filledSpotCooldown}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.cooldown_after_filled_spot_days}
                max={120}
                min={0}
                name="cooldown_after_filled_spot_days"
                type="number"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.maxPerDay}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.max_sms_per_day}
                max={20}
                min={1}
                name="max_sms_per_day"
                type="number"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.maxPer7Days}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.max_sms_per_7_days}
                max={50}
                min={1}
                name="max_sms_per_7_days"
                type="number"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.maxPer30Days}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.max_sms_per_30_days}
                max={200}
                min={1}
                name="max_sms_per_30_days"
                type="number"
              />
            </label>
            <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.futureAppointment}
              </span>
              <input
                className="h-5 w-5"
                defaultChecked={smartSmsSettings.block_if_future_appointment_exists}
                name="block_if_future_appointment_exists"
                type="checkbox"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.futureAppointment}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.future_appointment_window_days}
                max={365}
                min={0}
                name="future_appointment_window_days"
                type="number"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.allowedHours}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.allowed_send_start_time}
                name="allowed_send_start_time"
                type="time"
              />
            </label>
            <label className="grid gap-2 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.allowedHours}
              </span>
              <input
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-bold"
                defaultValue={smartSmsSettings.allowed_send_end_time}
                name="allowed_send_end_time"
                type="time"
              />
            </label>
            <label className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm md:col-span-2">
              <span className="font-bold text-[var(--foreground)]">
                {smartSmsCopy.alwaysReview}
              </span>
              <input
                className="h-5 w-5"
                defaultChecked={smartSmsSettings.always_review_recipients_before_send}
                name="always_review_recipients_before_send"
                type="checkbox"
              />
            </label>
          </fieldset>
          <button
            className="w-fit rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!smartSmsReadiness.ready || !organization}
            type="submit"
          >
            {copy.common.save}
          </button>
        </form>
        <p className="mt-4 rounded-xl border border-[#f6d99d] bg-[#fff9eb] p-3 text-sm font-bold text-[#74510f]">
          {smartSmsCopy.complianceNote}
        </p>
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
