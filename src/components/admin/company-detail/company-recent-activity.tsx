import {
  CompanyDetailCard,
  CompanyDetailSectionTitle
} from "@/components/admin/company-detail/company-detail-ui";
import type { AdminOrganizationOverview } from "@/lib/admin/organizations";

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

export function CompanyRecentActivitySection({
  recent,
  warnings
}: {
  recent: AdminOrganizationOverview["recent"];
  warnings: string[];
}) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <CompanyDetailCard>
          <CompanyDetailSectionTitle>Ouvertures récentes</CompanyDetailSectionTitle>
          <div className="mt-4 grid gap-3">
            {recent.openings.length === 0 ? (
              <p className="text-sm text-[#64748b]">Aucune ouverture dans cette période.</p>
            ) : (
              recent.openings.map((opening) => (
                <div
                  className="rounded-[16px] border border-[#e2eaf5] bg-[#f8fbff] p-4"
                  key={opening.id}
                >
                  <p className="font-bold text-[#0b1328]">{opening.title}</p>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {opening.serviceName ?? "Aucun service"} · {opening.status}
                  </p>
                  <p className="mt-2 text-xs text-[#64748b]">
                    {opening.positiveReplies} positives · {opening.pendingValidations} en attente ·{" "}
                    {opening.filledSpots} remplis
                  </p>
                </div>
              ))
            )}
          </div>
        </CompanyDetailCard>

        <CompanyDetailCard>
          <CompanyDetailSectionTitle>SMS échoués</CompanyDetailSectionTitle>
          <div className="mt-4 grid gap-3">
            {recent.failedSms.length === 0 ? (
              <p className="text-sm text-[#64748b]">Aucun SMS échoué dans cette période.</p>
            ) : (
              recent.failedSms.map((message) => (
                <div
                  className="rounded-[16px] border border-[#e2eaf5] bg-[#f8fbff] p-4"
                  key={message.id}
                >
                  <p className="font-bold text-[#0b1328]">{message.toNumberMasked}</p>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {message.provider} · {message.status} · {message.errorCode ?? "Aucun code"}
                  </p>
                  <p className="mt-2 text-xs text-[#64748b]">
                    {message.errorMessage ?? message.providerMessageId ?? "Aucun message"}
                  </p>
                </div>
              ))
            )}
          </div>
        </CompanyDetailCard>

        <CompanyDetailCard>
          <CompanyDetailSectionTitle>Validations en attente</CompanyDetailSectionTitle>
          <div className="mt-4 grid gap-3">
            {recent.pendingValidations.length === 0 ? (
              <p className="text-sm text-[#64748b]">
                Aucune validation en attente dans cette période.
              </p>
            ) : (
              recent.pendingValidations.map((item) => (
                <div
                  className="rounded-[16px] border border-[#e2eaf5] bg-[#f8fbff] p-4"
                  key={`${item.openingId}-${item.customerPhoneMasked}`}
                >
                  <p className="font-bold text-[#0b1328]">{item.openingTitle}</p>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {item.customerName} · {item.customerPhoneMasked}
                  </p>
                  <p className="mt-2 text-xs text-[#64748b]">
                    Rang {item.responseRank ?? "—"} · {formatDate(item.respondedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CompanyDetailCard>
      </div>

      {warnings.length > 0 ? (
        <CompanyDetailCard>
          <CompanyDetailSectionTitle>Avertissements</CompanyDetailSectionTitle>
          <div className="mt-4 grid gap-2">
            {warnings.map((warning) => (
              <p className="text-sm leading-6 text-[#64748b]" key={warning}>
                {warning}
              </p>
            ))}
          </div>
        </CompanyDetailCard>
      ) : null}
    </>
  );
}
