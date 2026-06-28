import { updateOrganizationBillingTermsAction } from "@/lib/admin/actions";
import type { BillingTerms } from "@/lib/admin/billing-terms";
import {
  companyDetailInputClassName,
  companyDetailPrimaryButtonClassName,
  companyDetailSelectClassName,
  CompanyDetailCard,
  CompanyDetailSectionTitle
} from "@/components/admin/company-detail/company-detail-ui";

export function CompanyBillingTermsForm({
  organizationId,
  terms,
  notes,
  canEdit
}: {
  organizationId: string;
  terms: BillingTerms;
  notes: string | null;
  canEdit: boolean;
}) {
  return (
    <CompanyDetailCard>
      <CompanyDetailSectionTitle>Conditions de facturation</CompanyDetailSectionTitle>
      <form
        action={updateOrganizationBillingTermsAction}
        className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:overflow-x-auto"
      >
        <input name="organizationId" type="hidden" value={organizationId} />
        <input
          name="returnTo"
          type="hidden"
          value={`/admin/organizations/${organizationId}/billing`}
        />

        <label className="grid min-w-[140px] shrink-0 gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Abonnement mensuel</span>
          <div className="relative">
            <input
              className={companyDetailInputClassName}
              defaultValue={(terms.monthlySubscriptionCents / 100).toFixed(2)}
              disabled={!canEdit}
              min="0"
              name="monthlySubscription"
              step="0.01"
              type="number"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#64748b]">
              $
            </span>
          </div>
        </label>

        <label className="grid min-w-[140px] shrink-0 gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Devise</span>
          <select
            className={companyDetailSelectClassName}
            defaultValue={terms.currency}
            disabled={!canEdit}
            name="currency"
          >
            <option value="CAD">CAD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>

        <label className="grid min-w-[140px] shrink-0 gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Modèle frais par spot rempli</span>
          <select
            className={companyDetailSelectClassName}
            defaultValue={terms.filledSpotFeeMode}
            disabled={!canEdit}
            name="filledSpotFeeMode"
          >
            <option value="none">Aucun</option>
            <option value="fixed">frais fixe</option>
            <option value="percentage">Pourcentage</option>
            <option value="fixed_plus_percentage">Fixe + pourcentage</option>
          </select>
        </label>

        <label className="grid min-w-[140px] shrink-0 gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Frais fixe par spot rempli</span>
          <div className="relative">
            <input
              className={companyDetailInputClassName}
              defaultValue={(terms.filledSpotFixedFeeCents / 100).toFixed(2)}
              disabled={!canEdit}
              min="0"
              name="fixedFee"
              step="0.01"
              type="number"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#64748b]">
              $
            </span>
          </div>
        </label>

        <label className="grid min-w-[140px] shrink-0 gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Frais en pourcentage</span>
          <div className="relative">
            <input
              className={companyDetailInputClassName}
              defaultValue={(terms.filledSpotPercentageBps / 100).toString()}
              disabled={!canEdit}
              max="100"
              min="0"
              name="percentage"
              step="0.01"
              type="number"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-[#64748b]">
              %
            </span>
          </div>
        </label>

        <label className="grid min-w-[140px] shrink-0 gap-2">
          <span className="text-sm font-semibold text-[#64748b]">Notes</span>
          <input
            className={companyDetailInputClassName}
            defaultValue={notes ?? ""}
            disabled={!canEdit}
            name="notes"
            placeholder="Notes internes"
          />
        </label>

        <div className="flex shrink-0 items-end pb-0.5">
          <button
            className={companyDetailPrimaryButtonClassName}
            disabled={!canEdit}
            type="submit"
          >
            Enregistrer les conditions
          </button>
        </div>
      </form>
    </CompanyDetailCard>
  );
}
