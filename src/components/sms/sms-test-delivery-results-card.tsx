"use client";

import type { SmsTestDeliveryStep } from "@/lib/sms/configuration-data";
import { SmsCheckCircleIcon, SmsShieldIcon } from "@/components/admin/sms-configuration-icons";
import {
  formatSmsDate,
  testStepStatusLabel
} from "@/components/sms/sms-shared";
import { SmsBadge, SmsCard, SmsCardHeader, SmsEmptyState, SmsFooterLink } from "@/components/sms/sms-ui";

export function SmsTestDeliveryResultsCard({
  steps,
  onNavigateTests
}: {
  steps: SmsTestDeliveryStep[];
  onNavigateTests?: () => void;
}) {
  const hasAnyStep = steps.some((step) => step.status !== "missing");

  return (
    <SmsCard>
      <SmsCardHeader
        icon={<SmsShieldIcon className="h-5 w-5" />}
        title="Résultat du test de livraison"
      />

      {!hasAnyStep ? (
        <div className="mt-5">
          <SmsEmptyState
            description="Lancez un test complet pour vérifier la livraison et les callbacks."
            title="Aucun test récent"
          />
        </div>
      ) : (
        <ul className="mt-5 grid gap-3">
          {steps.map((step) => (
            <li
              className="flex items-start justify-between gap-3 rounded-2xl border border-[#e1e9f5] px-4 py-3"
              key={step.key}
            >
              <div className="flex items-start gap-3">
                <SmsCheckCircleIcon
                  className={
                    step.status === "success"
                      ? "mt-0.5 text-[#16a34a]"
                      : "mt-0.5 text-[#64748b]"
                  }
                />
                <div>
                  <p className="text-sm font-black text-[#0b1328]">{step.label}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{step.description}</p>
                  {step.at ? (
                    <p className="mt-1 text-xs text-[#64748b]">{formatSmsDate(step.at)}</p>
                  ) : null}
                </div>
              </div>
              <SmsBadge label={testStepStatusLabel(step.status)} />
            </li>
          ))}
        </ul>
      )}

      {onNavigateTests ? (
        <SmsFooterLink onClick={onNavigateTests}>
          Voir les détails du test →
        </SmsFooterLink>
      ) : null}
    </SmsCard>
  );
}
