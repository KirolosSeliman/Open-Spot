"use client";

import { useState } from "react";

import { sendSmsSetupTestAction } from "@/lib/admin/sms-sender-actions";
import { DEFAULT_ORGANIZATION_TEST_SMS_BODY } from "@/lib/sms/organization-sms-copy";
import { SmsInlineForm } from "@/components/sms/sms-action-forms";
import { smsPageStyles } from "@/components/sms/sms-shared";
import { SmsCard } from "@/components/sms/sms-ui";

type Props = {
  organizationId: string;
  defaultPhone?: string | null;
  disabled: boolean;
  disabledReason?: string;
};

export function SmsTestMessageCard({
  organizationId,
  defaultPhone,
  disabled,
  disabledReason
}: Props) {
  const [testPhone, setTestPhone] = useState(defaultPhone ?? "");
  const [testMessage, setTestMessage] = useState(DEFAULT_ORGANIZATION_TEST_SMS_BODY);

  return (
    <SmsCard className="grid gap-4 p-4">
      <p className="text-sm font-black text-[#0b1328]">SMS de test</p>

      <label className="grid gap-1">
        <span className={smsPageStyles.label}>Numéro (E.164)</span>
        <input
          className={smsPageStyles.input}
          disabled={disabled}
          onChange={(event) => setTestPhone(event.target.value)}
          placeholder="+14385551234"
          value={testPhone}
        />
      </label>

      <label className="grid gap-1">
        <span className={smsPageStyles.label}>Message</span>
        <textarea
          className={smsPageStyles.textarea}
          disabled={disabled}
          onChange={(event) => setTestMessage(event.target.value)}
          rows={3}
          value={testMessage}
        />
      </label>

      <SmsInlineForm
        action={async (formData) => {
          formData.set("testPhoneE164", testPhone);
          formData.set("testMessageBody", testMessage);
          return sendSmsSetupTestAction(formData);
        }}
        disabled={disabled}
        organizationId={organizationId}
        submitLabel="Envoyer le SMS de test"
      />

      {disabled && disabledReason ? (
        <p className="text-xs text-[#64748b]">{disabledReason}</p>
      ) : (
        <p className="text-xs text-[#64748b]">
          Vérifiez la réception, le callback de statut, puis STOP/AIDE manuellement.
        </p>
      )}
    </SmsCard>
  );
}
