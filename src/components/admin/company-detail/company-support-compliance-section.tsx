import {
  disableOrganizationAction,
  pauseOrganizationSmsAction,
  reactivateOrganizationAction,
  resumeOrganizationSmsAction,
  runOrganizationHealthCheckAction,
  toggleOrganizationInternalTestAction,
  updateOrganizationAdminNoteAction,
  updateOrganizationSupportStatusAction
} from "@/lib/admin/actions";
import type { OrganizationAdminControls } from "@/lib/admin/organization-controls";

type AdminControlsSnapshot = Pick<
  OrganizationAdminControls,
  | "support_status"
  | "admin_note"
  | "is_internal_test"
  | "sms_sending_paused"
  | "disabled_at"
  | "sms_pause_reason"
  | "disabled_reason"
>;
import {
  companyDetailInputClassName,
  companyDetailPrimaryButtonClassName,
  companyDetailSecondaryButtonClassName,
  companyDetailSelectClassName,
  CompanyDetailCard,
  CompanyDetailIconBadge,
  CompanyDetailSectionTitle
} from "@/components/admin/company-detail/company-detail-ui";
import { formatEstimatedSmsCost } from "@/lib/admin/sms-cost";

const numberFormatter = new Intl.NumberFormat("fr-CA");

function HeadsetIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M12 3 20 7v6c0 5-3.5 8-8 8s-8-3-8-8V7z" />
    </svg>
  );
}

const supportStatusLabels: Record<string, string> = {
  healthy: "Healthy",
  needs_setup: "Needs setup",
  watchlist: "Watchlist",
  blocked: "Blocked",
  disabled: "Disabled"
};

export function CompanyComplianceOverviewCard({
  optedOutCustomers,
  unknownReplies,
  recoveredValueCents,
  currency = "CAD"
}: {
  optedOutCustomers: number;
  unknownReplies: number;
  recoveredValueCents: number | null;
  currency?: string;
}) {
  const recoveredLabel =
    recoveredValueCents === null
      ? "Non disponible"
      : formatEstimatedSmsCost(recoveredValueCents, currency);

  const metrics = [
    {
      label: "Désinscriptions",
      value: numberFormatter.format(optedOutCustomers),
      icon: (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 11h-6" />
        </svg>
      )
    },
    {
      label: "Réponses inconnues",
      value: numberFormatter.format(unknownReplies),
      icon: (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      )
    },
    {
      label: "Valeur récupérée",
      value: recoveredLabel,
      icon: (
        <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    }
  ];

  return (
    <CompanyDetailCard>
      <CompanyDetailSectionTitle>Aperçu conformité</CompanyDetailSectionTitle>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div className="flex items-center gap-4" key={metric.label}>
            <CompanyDetailIconBadge className="h-10 w-10 rounded-full">
              {metric.icon}
            </CompanyDetailIconBadge>
            <div>
              <p className="text-sm font-semibold text-[#64748b]">{metric.label}</p>
              <p className="mt-1 text-[1.75rem] font-bold text-[#0b1328]">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>
    </CompanyDetailCard>
  );
}

export function CompanyInternalSupportSection({
  organizationId,
  controls,
  permissions
}: {
  organizationId: string;
  controls: AdminControlsSnapshot;
  permissions: {
    canUpdateSupportStatus: boolean;
    canUpdateAdminNote: boolean;
    canMarkInternalTest: boolean;
  };
}) {
  return (
    <CompanyDetailCard>
      <div className="flex items-center gap-3">
        <CompanyDetailIconBadge>
          <HeadsetIcon />
        </CompanyDetailIconBadge>
        <CompanyDetailSectionTitle>Support interne</CompanyDetailSectionTitle>
      </div>

      <div className="mt-6 grid gap-5">
        <form action={updateOrganizationSupportStatusAction} className="grid gap-3">
          <input name="organizationId" type="hidden" value={organizationId} />
          <input
            name="returnTo"
            type="hidden"
            value={`/admin/organizations/${organizationId}/compliance`}
          />
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#64748b]">Statut</span>
            <select
              className={companyDetailSelectClassName}
              defaultValue={controls.support_status}
              disabled={!permissions.canUpdateSupportStatus}
              name="supportStatus"
            >
              {Object.entries(supportStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`${companyDetailPrimaryButtonClassName} w-fit`}
            disabled={!permissions.canUpdateSupportStatus}
            type="submit"
          >
            Enregistrer le statut
          </button>
        </form>

        <form action={updateOrganizationAdminNoteAction} className="grid gap-3">
          <input name="organizationId" type="hidden" value={organizationId} />
          <input
            name="returnTo"
            type="hidden"
            value={`/admin/organizations/${organizationId}/compliance`}
          />
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#64748b]">Note interne</span>
            <textarea
              className={`${companyDetailInputClassName} min-h-32 py-3`}
              defaultValue={controls.admin_note ?? ""}
              disabled={!permissions.canUpdateAdminNote}
              name="adminNote"
              placeholder="Ajoutez une note interne..."
            />
          </label>
          <button
            className={`${companyDetailSecondaryButtonClassName} w-fit`}
            disabled={!permissions.canUpdateAdminNote}
            type="submit"
          >
            Enregistrer la note
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[#64748b]">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            Interne/test : {controls.is_internal_test ? "Oui" : "Non"}
          </span>
          <form action={toggleOrganizationInternalTestAction}>
            <input name="organizationId" type="hidden" value={organizationId} />
            <input
              name="isInternalTest"
              type="hidden"
              value={controls.is_internal_test ? "false" : "true"}
            />
            <button
              className="text-sm font-semibold text-[#2563ff] underline-offset-2 hover:underline disabled:opacity-50"
              disabled={!permissions.canMarkInternalTest}
              type="submit"
            >
              {controls.is_internal_test ? "Retirer le marquage" : "Marquer interne/test"}
            </button>
          </form>
        </div>
      </div>
    </CompanyDetailCard>
  );
}

export function CompanySmsControlsSection({
  organizationId,
  controls,
  permissions
}: {
  organizationId: string;
  controls: AdminControlsSnapshot;
  permissions: {
    canPauseSms: boolean;
    canResumeSms: boolean;
    canDisable: boolean;
    canReactivate: boolean;
    canRunHealthCheck: boolean;
  };
}) {
  const smsPaused = controls.sms_sending_paused;
  const orgDisabled = Boolean(controls.disabled_at);

  return (
    <CompanyDetailCard>
      <div className="flex items-center gap-3">
        <CompanyDetailIconBadge>
          <ShieldIcon />
        </CompanyDetailIconBadge>
        <CompanyDetailSectionTitle>Contrôles SMS et organisation</CompanyDetailSectionTitle>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#64748b]">SMS en pause</span>
            <select className={companyDetailSelectClassName} defaultValue={smsPaused ? "yes" : "no"} disabled>
              <option value="no">Non</option>
              <option value="yes">Oui</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#64748b]">Organisation désactivée</span>
            <select className={companyDetailSelectClassName} defaultValue={orgDisabled ? "yes" : "no"} disabled>
              <option value="no">Non</option>
              <option value="yes">Oui</option>
            </select>
          </label>
        </div>

        <form action={smsPaused ? resumeOrganizationSmsAction : pauseOrganizationSmsAction} className="grid gap-2" id={`pause-form-${organizationId}`}>
          <input name="organizationId" type="hidden" value={organizationId} />
          {!smsPaused ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#64748b]">Raison de pause</span>
              <input
                className={companyDetailInputClassName}
                defaultValue={controls.sms_pause_reason ?? ""}
                name="reason"
                placeholder="Sélectionnez ou saisissez la raison..."
                required={!smsPaused}
              />
            </label>
          ) : null}
        </form>

        <form action={orgDisabled ? reactivateOrganizationAction : disableOrganizationAction} className="grid gap-2" id={`disable-form-${organizationId}`}>
          <input name="organizationId" type="hidden" value={organizationId} />
          {!orgDisabled ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#64748b]">Raison de désactivation</span>
              <input
                className={companyDetailInputClassName}
                defaultValue={controls.disabled_reason ?? ""}
                name="reason"
                placeholder="Sélectionnez ou saisissez la raison..."
                required={!orgDisabled}
              />
            </label>
          ) : null}
        </form>

        <div className="flex flex-wrap gap-3 pt-2">
          {smsPaused ? (
            <form action={resumeOrganizationSmsAction}>
              <input name="organizationId" type="hidden" value={organizationId} />
              <button
                className={companyDetailPrimaryButtonClassName}
                disabled={!permissions.canResumeSms}
                type="submit"
              >
                Reprendre SMS
              </button>
            </form>
          ) : (
            <button
              className={companyDetailPrimaryButtonClassName}
              disabled={!permissions.canPauseSms}
              form={`pause-form-${organizationId}`}
              type="submit"
            >
              Pause SMS
            </button>
          )}

          {orgDisabled ? (
            <form action={reactivateOrganizationAction}>
              <input name="organizationId" type="hidden" value={organizationId} />
              <button
                className={companyDetailSecondaryButtonClassName}
                disabled={!permissions.canReactivate}
                type="submit"
              >
                Réactiver l&apos;organisation
              </button>
            </form>
          ) : (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-[13px] border border-red-200 bg-white px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              disabled={!permissions.canDisable}
              form={`disable-form-${organizationId}`}
              type="submit"
            >
              Désactiver l&apos;organisation
            </button>
          )}

          <form action={runOrganizationHealthCheckAction}>
            <input name="organizationId" type="hidden" value={organizationId} />
            <button
              className={companyDetailSecondaryButtonClassName}
              disabled={!permissions.canRunHealthCheck}
              type="submit"
            >
              Lancer un diagnostic
            </button>
          </form>
        </div>
      </div>
    </CompanyDetailCard>
  );
}
