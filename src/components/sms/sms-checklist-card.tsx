"use client";

import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import { checklistStatusLabel } from "@/components/sms/sms-shared";
import { SmsBadge, SmsCard } from "@/components/sms/sms-ui";

export function SmsChecklistCard({ readiness }: { readiness: SmsSenderReadinessResult }) {
  const blockingChecks = readiness.checks.filter((check) => check.blocking);
  const pending = readiness.blockingReasons;

  return (
    <SmsCard className="p-4">
      <p className="text-sm font-black text-[#0b1328]">Prêt pour l&apos;envoi</p>

      {pending.length > 0 ? (
        <ul className="mt-3 grid gap-1 text-sm text-[#64748b]">
          {pending.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-emerald-700">Tous les prérequis sont satisfaits.</p>
      )}

      <ul className="mt-4 grid gap-2">
        {blockingChecks.map((check) => (
          <li
            className="flex items-center justify-between gap-3 rounded-lg border border-[#e1e9f5] px-3 py-2"
            key={check.key}
          >
            <span className="text-sm text-[#0b1328]">{check.label}</span>
            <SmsBadge label={checklistStatusLabel(check)} />
          </li>
        ))}
      </ul>
    </SmsCard>
  );
}
