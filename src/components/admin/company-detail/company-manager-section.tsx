import { endOrganizationManagerSessionsAction } from "@/lib/admin/actions";
import { startManagerModeAction } from "@/lib/admin/manager-mode-actions";
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

function UsersGroupIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

type ManagerSession = {
  id: string;
  admin_email: string;
  started_at: string;
  expires_at: string;
  reason: string;
};

export function CompanyManagerSessionsSection({
  organizationId,
  sessions,
  canEndSessions
}: {
  organizationId: string;
  sessions: ManagerSession[];
  canEndSessions: boolean;
}) {
  return (
    <CompanyDetailCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <CompanyDetailIconBadge>
              <UsersGroupIcon />
            </CompanyDetailIconBadge>
            <CompanyDetailSectionTitle>Sessions gestionnaire actives</CompanyDetailSectionTitle>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#64748b]">
            Terminer une session la marque comme terminée ; l&apos;historique d&apos;audit
            n&apos;est pas supprimé.
          </p>
        </div>
        <form action={endOrganizationManagerSessionsAction}>
          <input name="organizationId" type="hidden" value={organizationId} />
          <button
            className={companyDetailSecondaryButtonClassName}
            disabled={!canEndSessions || sessions.length === 0}
            type="submit"
          >
            Terminer les sessions
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-3">
        {sessions.length === 0 ? (
          <div className="rounded-[16px] border border-[#dbeafe] bg-[#eef5ff] px-4 py-4 text-sm text-[#2563ff]">
            Aucune session gestionnaire active.
          </div>
        ) : (
          sessions.map((session) => (
            <div
              className="rounded-[16px] border border-[#e2eaf5] bg-[#f8fbff] p-4"
              key={session.id}
            >
              <p className="font-bold text-[#0b1328]">{session.admin_email}</p>
              <p className="mt-1 text-sm text-[#64748b]">
                Début {formatDate(session.started_at)} · Expire {formatDate(session.expires_at)}
              </p>
              <p className="mt-2 text-sm text-[#64748b]">{session.reason}</p>
            </div>
          ))
        )}
      </div>
    </CompanyDetailCard>
  );
}

export function CompanyManagerModeSection({
  organizationId,
  canOpenManagerMode,
  managerModeError
}: {
  organizationId: string;
  canOpenManagerMode: boolean;
  managerModeError?: string;
}) {
  return (
    <CompanyDetailCard id="manager-mode">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <CompanyDetailIconBadge>
              <UserIcon />
            </CompanyDetailIconBadge>
            <CompanyDetailSectionTitle>Mode gestionnaire</CompanyDetailSectionTitle>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#64748b]">
            Ouvrez une session en tant que gestionnaire pour accéder au tableau de bord
            marchand et effectuer des actions de support au nom de cette compagnie.
          </p>
          {managerModeError ? (
            <p className="mt-4 rounded-[13px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {managerModeError}
            </p>
          ) : null}
          {canOpenManagerMode ? (
            <form action={startManagerModeAction} className="mt-6 grid gap-4">
              <input name="organizationId" type="hidden" value={organizationId} />
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#64748b]">Raison</span>
                <textarea
                  className={`${companyDetailInputClassName} min-h-28 py-3`}
                  name="reason"
                  placeholder="Raison courte du support"
                  required
                />
              </label>
              <button className={`${companyDetailPrimaryButtonClassName} w-fit gap-2`} type="submit">
                <UserIcon />
                Ouvrir en tant que gestionnaire
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm font-semibold text-[#64748b]">
              L&apos;accès au mode gestionnaire n&apos;est pas accordé pour cette compagnie.
            </p>
          )}
        </div>
        <div className="rounded-[16px] border border-[#dbeafe] bg-[#eef5ff] p-5">
          <p className="font-bold text-[#0b1328]">À propos du mode gestionnaire</p>
          <p className="mt-3 text-sm leading-7 text-[#64748b]">
            Les actions effectuées pendant une session gestionnaire sont enregistrées et
            auditées. Les sessions expirent automatiquement après la durée configurée.
          </p>
        </div>
      </div>
    </CompanyDetailCard>
  );
}
