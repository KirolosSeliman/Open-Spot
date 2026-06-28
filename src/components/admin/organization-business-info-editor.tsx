import { PhoneInput } from "@/components/forms/phone-input";
import {
  CompanyIconInput,
  CompanyIconSelect,
  CompanyIconTextarea
} from "@/components/admin/company-detail/company-icon-field";
import { companyDetailPrimaryButtonClassName } from "@/components/admin/company-detail/company-detail-ui";
import { updateOrganizationBusinessInfoAction } from "@/lib/admin/actions";
import type { AdminOrganizationBusinessInfo } from "@/lib/admin/organization-business-info-data";

const icons = {
  store: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  user: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  phone: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  calendar: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  ),
  clock: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  link: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  mail: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect height="16" rx="2" width="20" x="2" y="4" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  tag: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z" />
      <circle cx="7.5" cy="7.5" r=".5" />
    </svg>
  ),
  chart: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M3 3v18h18M7 16l4-4 4 4 5-6" />
    </svg>
  ),
  globe: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  pin: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  notes: (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect height="4" rx="1" width="8" x="8" y="2" />
    </svg>
  )
};

type OrganizationBusinessInfoEditorProps = {
  businessInfo: AdminOrganizationBusinessInfo;
  canEdit: boolean;
  errorMessage?: string;
  success?: boolean;
  returnTo?: string;
  showHeading?: boolean;
};

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

        <CompanyIconInput
          defaultValue={businessInfo.name}
          disabled={!canEdit}
          icon={icons.store}
          label="Nom du commerce"
          name="name"
          required
        />

        <CompanyIconInput
          defaultValue={businessInfo.slug}
          disabled={!canEdit}
          icon={icons.link}
          label="Slug public"
          name="slug"
        />

        <CompanyIconInput
          defaultValue={businessInfo.contactName}
          disabled={!canEdit}
          icon={icons.user}
          label="Nom du contact principal"
          name="contactName"
        />

        <CompanyIconInput
          defaultValue={businessInfo.email}
          disabled={!canEdit}
          icon={icons.mail}
          label="Email"
          name="email"
          type="email"
        />

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Téléphone</span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94a3b8]">
              {icons.phone}
            </span>
            <PhoneInput
              className="min-h-11 w-full rounded-[13px] border border-[#e2eaf5] bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0b1328] outline-none focus:border-[#2563ff] focus:ring-4 focus:ring-[#eef5ff] disabled:opacity-60"
              defaultValue={businessInfo.phone}
              disabled={!canEdit}
              id="businessPhone"
              name="phone"
            />
          </div>
        </label>

        <CompanyIconInput
          defaultValue={businessInfo.businessType}
          disabled={!canEdit}
          icon={icons.tag}
          label="Type de commerce"
          name="businessType"
        />

        <CompanyIconInput
          defaultValue={businessInfo.bookingSystem}
          disabled={!canEdit}
          icon={icons.calendar}
          label="Système de rendez-vous actuel"
          name="bookingSystem"
        />

        <CompanyIconInput
          defaultValue={businessInfo.cancellationVolume}
          disabled={!canEdit}
          icon={icons.chart}
          label="Volume d'annulations"
          name="cancellationVolume"
        />

        <CompanyIconSelect
          defaultValue={businessInfo.timezone}
          disabled={!canEdit}
          icon={icons.clock}
          label="Fuseau horaire"
          name="timezone"
        >
          <option value="America/Toronto">America/Toronto</option>
          <option value="America/Montreal">America/Montreal</option>
        </CompanyIconSelect>

        <CompanyIconSelect
          defaultValue={businessInfo.defaultLanguage}
          disabled={!canEdit}
          icon={icons.globe}
          label="Langue par défaut"
          name="defaultLanguage"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </CompanyIconSelect>

        <div className="lg:col-span-2">
          <CompanyIconInput
            defaultValue={businessInfo.businessAddress}
            disabled={!canEdit}
            icon={icons.pin}
            label="Adresse"
            name="businessAddress"
            placeholder="Entrez l'adresse du commerce"
          />
        </div>

        <div className="lg:col-span-2">
          <CompanyIconTextarea
            defaultValue={businessInfo.internalNotes}
            disabled={!canEdit}
            icon={icons.notes}
            label="Notes internes"
            name="internalNotes"
            placeholder="Ajoutez des notes internes visibles uniquement par votre équipe..."
          />
        </div>

        <div className="lg:col-span-2">
          <button
            className={`${companyDetailPrimaryButtonClassName} gap-2`}
            disabled={!canEdit}
            type="submit"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </section>
  );
}
