import {
  archiveOrganizationAction,
  unarchiveOrganizationAction
} from "@/lib/admin/actions";
import type { OrganizationAdminControls } from "@/lib/admin/organization-controls";

type AdminControlsSnapshot = Pick<
  OrganizationAdminControls,
  | "archived_at"
  | "archived_reason"
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
  CompanyDetailCard,
  CompanyDetailIconBadge,
  CompanyDetailSectionTitle
} from "@/components/admin/company-detail/company-detail-ui";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(value: string | null) {
  if (!value) {
    return "Non disponible";
  }

  return dateFormatter.format(new Date(value));
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CompanyAdminVisibilitySection({
  organizationId,
  controls,
  canArchive,
  canUnarchive,
  returnTo
}: {
  organizationId: string;
  controls: AdminControlsSnapshot;
  canArchive: boolean;
  canUnarchive: boolean;
  returnTo: string;
}) {
  const isArchived = Boolean(controls.archived_at);

  return (
    <CompanyDetailCard>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <CompanyDetailIconBadge>
              <EyeIcon />
            </CompanyDetailIconBadge>
            <CompanyDetailSectionTitle>Visibilité admin</CompanyDetailSectionTitle>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#64748b]">
            En archivant cette compagnie, elle sera masquée de la liste active côté
            admin. Aucune donnée commerçante ne sera supprimée.
          </p>
          <div className="mt-6">
            <p className="text-sm font-semibold text-[#64748b]">Statut</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#0b1328]">
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${isArchived ? "bg-[#94a3b8]" : "bg-[#16a34a]"}`}
              />
              {isArchived ? "Archivée" : "Active"}
            </p>
            {isArchived ? (
              <div className="mt-4 grid gap-2 text-sm text-[#64748b]">
                <p>Archivée le : {formatDate(controls.archived_at)}</p>
                <p>Motif : {controls.archived_reason ?? "Non renseigné"}</p>
              </div>
            ) : null}
          </div>
        </div>

        {isArchived ? (
          <form action={unarchiveOrganizationAction}>
            <input name="organizationId" type="hidden" value={organizationId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button
              className={companyDetailPrimaryButtonClassName}
              disabled={!canUnarchive}
              type="submit"
            >
              Désarchiver la compagnie
            </button>
          </form>
        ) : (
          <form action={archiveOrganizationAction} className="grid w-full max-w-md gap-3">
            <input name="organizationId" type="hidden" value={organizationId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#64748b]">Motif d&apos;archivage</span>
              <input
                className={companyDetailInputClassName}
                name="reason"
                placeholder="Motif d'archivage (optionnel)"
                required
              />
            </label>
            <button
              className={companyDetailSecondaryButtonClassName}
              disabled={!canArchive}
              type="submit"
            >
              Archiver la compagnie
            </button>
          </form>
        )}
      </div>
    </CompanyDetailCard>
  );
}
