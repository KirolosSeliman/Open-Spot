"use client";

import type { SmsTestDeliveryStep } from "@/lib/sms/configuration-data";
import { formatSmsDate, testStepStatusLabel } from "@/components/sms/sms-shared";
import { SmsBadge, SmsCard } from "@/components/sms/sms-ui";

export function SmsTestDeliveryResultsCard({ steps }: { steps: SmsTestDeliveryStep[] }) {
  return (
    <SmsCard className="p-4">
      <p className="text-sm font-black text-[#0b1328]">Résultat du test</p>
      <ul className="mt-3 grid gap-2">
        {steps.map((step) => (
          <li
            className="flex items-center justify-between gap-3 rounded-lg border border-[#e1e9f5] px-3 py-2"
            key={step.key}
          >
            <div>
              <p className="text-sm font-semibold text-[#0b1328]">{step.label}</p>
              {step.at ? (
                <p className="text-xs text-[#64748b]">{formatSmsDate(step.at)}</p>
              ) : null}
            </div>
            <SmsBadge label={testStepStatusLabel(step.status)} />
          </li>
        ))}
      </ul>
    </SmsCard>
  );
}
