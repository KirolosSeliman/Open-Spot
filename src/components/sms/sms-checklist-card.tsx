"use client";

import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import { SmsShieldIcon } from "@/components/admin/sms-configuration-icons";
import {
  checklistStatusLabel
} from "@/components/sms/sms-shared";
import { SmsBadge, SmsCard, SmsCardHeader, SmsFooterLink } from "@/components/sms/sms-ui";
import type { SmsConfigurationTab } from "@/components/sms/sms-shared";

type Props = {
  readiness: SmsSenderReadinessResult;
  onNavigateTab?: (tab: SmsConfigurationTab) => void;
  showProgress?: boolean;
  linkLabel?: string;
  linkTab?: SmsConfigurationTab;
};

export function SmsChecklistCard({
  readiness,
  onNavigateTab,
  showProgress = false,
  linkLabel = "Voir tous les détails",
  linkTab = "compliance"
}: Props) {
  const validatedCount = readiness.checks.filter((check) => check.status === "active").length;
  const progressPercent = Math.round((validatedCount / readiness.checks.length) * 100);

  return (
    <SmsCard className="h-full">
      <SmsCardHeader
        action={
          onNavigateTab ? (
            <SmsFooterLink onClick={() => onNavigateTab(linkTab)}>
              {linkLabel} →
            </SmsFooterLink>
          ) : null
        }
        icon={<SmsShieldIcon className="h-5 w-5" />}
        title="Checklist SMS"
      />

      {showProgress ? (
        <div className="mt-4 grid gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-[#64748b]">
              {validatedCount}/{readiness.checks.length} éléments validés
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eef5ff]">
            <div
              className="h-full rounded-full bg-[#2563ff] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      <ul className="mt-5 grid gap-3">
        {readiness.checks.map((check) => {
          const label = checklistStatusLabel(check);

          return (
            <li
              className="flex items-start justify-between gap-3 rounded-2xl border border-[#e1e9f5] px-4 py-3"
              key={check.key}
            >
              <div>
                <p className="text-sm font-black text-[#0b1328]">{check.label}</p>
                <p className="mt-1 text-xs text-[#64748b]">{check.description}</p>
              </div>
              <SmsBadge label={label} />
            </li>
          );
        })}
      </ul>

      {!showProgress && onNavigateTab ? (
        <SmsFooterLink onClick={() => onNavigateTab(linkTab)}>
          {linkLabel} →
        </SmsFooterLink>
      ) : null}

      {showProgress && onNavigateTab ? (
        <SmsFooterLink onClick={() => onNavigateTab("compliance")}>
          Voir la conformité →
        </SmsFooterLink>
      ) : null}
    </SmsCard>
  );
}
