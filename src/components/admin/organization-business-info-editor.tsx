import { PhoneInput } from "@/components/forms/phone-input";
import {
  companyDetailInputClassName,
  companyDetailPrimaryButtonClassName,
  companyDetailSelectClassName
} from "@/components/admin/company-detail/company-detail-ui";
import { updateOrganizationBusinessInfoAction } from "@/lib/admin/actions";
import type { AdminOrganizationBusinessInfo } from "@/lib/admin/organization-business-info-data";

type OrganizationBusinessInfoEditorProps = {
  businessInfo: AdminOrganizationBusinessInfo;
  canEdit: boolean;
  errorMessage?: string;
  success?: boolean;
  returnTo?: string;
  showHeading?: boolean;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-semibold text-[#64748b]">{children}</span>;
}

export function OrganizationBusinessInfoEditor({
  businessInfo,
  canEdit,
  errorMessage,
  success,
  returnTo = `/admin/organizations/${businessInfo.organizationId}/business-info`,
  showHeading = true
}: OrganizationBusinessInfoEditorProps) {
  return (
    <section className="grid gap-5">
      {showHeading ? (
        <div>
          <h2 className="text-lg font-bold text-[#0b1328]">Informations du commerce</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
            Ces informations proviennent de la demande d&apos;appel et de la fiche
            compagnie. Seuls les administrateurs Open Spot peuvent les modifier.
          </p>
        </div>
      ) : null}

      {success ? (
        <p className="rounded-[13px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Les informations du commerce ont été mises à jour.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-[13px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <form action={updateOrganizationBusinessInfoAction} className="grid gap-4 lg:grid-cols-2">
        <input name="organizationId" type="hidden" value={businessInfo.organizationId} />
        <input name="returnTo" type="hidden" value={returnTo} />

        <label className="grid gap-2">
          <FieldLabel>Nom du commerce</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.name}
            disabled={!canEdit}
            name="name"
            required
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Slug public</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.slug}
            disabled={!canEdit}
            name="slug"
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Nom du contact principal</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.contactName}
            disabled={!canEdit}
            name="contactName"
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Email</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.email}
            disabled={!canEdit}
            name="email"
            type="email"
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Téléphone</FieldLabel>
          <PhoneInput
            className={`${companyDetailInputClassName} py-2.5`}
            defaultValue={businessInfo.phone}
            disabled={!canEdit}
            id="businessPhone"
            name="phone"
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Type de commerce</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.businessType}
            disabled={!canEdit}
            name="businessType"
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Système de rendez-vous actuel</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.bookingSystem}
            disabled={!canEdit}
            name="bookingSystem"
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Volume d&apos;annulations</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.cancellationVolume}
            disabled={!canEdit}
            name="cancellationVolume"
          />
        </label>

        <label className="grid gap-2">
          <FieldLabel>Fuseau horaire</FieldLabel>
          <select
            className={companyDetailSelectClassName}
            defaultValue={businessInfo.timezone}
            disabled={!canEdit}
            name="timezone"
          >
            <option value="America/Toronto">America/Toronto</option>
            <option value="America/Montreal">America/Montreal</option>
          </select>
        </label>

        <label className="grid gap-2">
          <FieldLabel>Langue par défaut</FieldLabel>
          <select
            className={companyDetailSelectClassName}
            defaultValue={businessInfo.defaultLanguage}
            disabled={!canEdit}
            name="defaultLanguage"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="grid gap-2 lg:col-span-2">
          <FieldLabel>Adresse</FieldLabel>
          <input
            className={companyDetailInputClassName}
            defaultValue={businessInfo.businessAddress}
            disabled={!canEdit}
            name="businessAddress"
            placeholder="Entrez l'adresse du commerce"
          />
        </label>

        <label className="grid gap-2 lg:col-span-2">
          <FieldLabel>Notes internes</FieldLabel>
          <textarea
            className={`${companyDetailInputClassName} min-h-28 py-3`}
            defaultValue={businessInfo.internalNotes}
            disabled={!canEdit}
            name="internalNotes"
            placeholder="Ajoutez des notes internes visibles uniquement par votre équipe..."
          />
        </label>

        <div className="lg:col-span-2">
          <button
            className={`${companyDetailPrimaryButtonClassName} gap-2`}
            disabled={!canEdit}
            type="submit"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </section>
  );
}
