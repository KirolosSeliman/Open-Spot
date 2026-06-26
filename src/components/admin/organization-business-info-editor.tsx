import { PhoneInput } from "@/components/forms/phone-input";
import { updateOrganizationBusinessInfoAction } from "@/lib/admin/actions";
import type { AdminOrganizationBusinessInfo } from "@/lib/admin/organization-business-info-data";

type OrganizationBusinessInfoEditorProps = {
  businessInfo: AdminOrganizationBusinessInfo;
  canEdit: boolean;
  errorMessage?: string;
  success?: boolean;
};

export function OrganizationBusinessInfoEditor({
  businessInfo,
  canEdit,
  errorMessage,
  success
}: OrganizationBusinessInfoEditorProps) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-lg font-black">Informations du commerce</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Ces informations proviennent de la demande d&apos;appel et de la fiche
          compagnie. Seuls les administrateurs Open Spot peuvent les modifier.
        </p>
      </div>

      {success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          Les informations du commerce ont été mises à jour.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <form
        action={updateOrganizationBusinessInfoAction}
        className="grid gap-4 lg:grid-cols-2"
      >
        <input name="organizationId" type="hidden" value={businessInfo.organizationId} />
        <input
          name="returnTo"
          type="hidden"
          value={`/admin/organizations/${businessInfo.organizationId}`}
        />

        <label className="grid gap-2 text-sm font-bold">
          Nom du commerce
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.name}
            disabled={!canEdit}
            name="name"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Slug public
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.slug}
            disabled={!canEdit}
            name="slug"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Nom du contact principal
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.contactName}
            disabled={!canEdit}
            name="contactName"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Email
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.email}
            disabled={!canEdit}
            name="email"
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Téléphone
          <PhoneInput
            className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            defaultValue={businessInfo.phone}
            disabled={!canEdit}
            id="businessPhone"
            name="phone"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Type de commerce
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.businessType}
            disabled={!canEdit}
            name="businessType"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Système de rendez-vous actuel
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.bookingSystem}
            disabled={!canEdit}
            name="bookingSystem"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Volume d&apos;annulations
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.cancellationVolume}
            disabled={!canEdit}
            name="cancellationVolume"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Fuseau horaire
          <select
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
            defaultValue={businessInfo.timezone}
            disabled={!canEdit}
            name="timezone"
          >
            <option value="America/Toronto">America/Toronto</option>
            <option value="America/Montreal">America/Montreal</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold">
          Langue par défaut
          <select
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold"
            defaultValue={businessInfo.defaultLanguage}
            disabled={!canEdit}
            name="defaultLanguage"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold lg:col-span-2">
          Adresse
          <input
            className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm"
            defaultValue={businessInfo.businessAddress}
            disabled={!canEdit}
            name="businessAddress"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold lg:col-span-2">
          Notes internes
          <textarea
            className="min-h-24 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm"
            defaultValue={businessInfo.internalNotes}
            disabled={!canEdit}
            name="internalNotes"
            placeholder="Notes internes pour l'équipe Open Spot"
          />
        </label>

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <button
            className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white disabled:opacity-50"
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
