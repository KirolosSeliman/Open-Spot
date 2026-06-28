"use client";

import { useState } from "react";

import { SmsSendIcon } from "@/components/admin/sms-configuration-icons";
import {
  runFullSmsSetupTestAction,
  sendSmsSetupTestAction
} from "@/lib/admin/sms-sender-actions";
import { DEFAULT_ORGANIZATION_TEST_SMS_BODY } from "@/lib/sms/organization-sms-copy";
import { SmsInlineForm } from "@/components/sms/sms-action-forms";
import { smsPageStyles } from "@/components/sms/sms-shared";
import { SmsCard, SmsCardHeader } from "@/components/sms/sms-ui";

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
    <SmsCard>
      <SmsCardHeader
        icon={<SmsSendIcon className="h-5 w-5" />}
        title="Message de test"
      />

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className={smsPageStyles.label}>Numéro de téléphone</span>
          <input
            className={smsPageStyles.input}
            disabled={disabled}
            onChange={(event) => setTestPhone(event.target.value)}
            placeholder="Ex. +1 (438) 123-4567"
            value={testPhone}
          />
        </label>

        <label className="grid gap-2">
          <span className={smsPageStyles.label}>Aperçu du message</span>
          <textarea
            className={smsPageStyles.textarea}
            disabled={disabled}
            onChange={(event) => setTestMessage(event.target.value)}
            value={testMessage}
          />
          <span className="text-xs text-[#64748b]">
            {testMessage.length} / 160 caractères
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <SmsInlineForm
            action={async (formData) => {
              formData.set("testPhoneE164", testPhone);
              formData.set("testMessageBody", testMessage);
              return sendSmsSetupTestAction(formData);
            }}
            disabled={disabled}
            organizationId={organizationId}
            submitLabel="Envoyer un SMS test"
          />
          <SmsInlineForm
            action={async (formData) => {
              formData.set("testPhoneE164", testPhone);
              formData.set("testMessageBody", testMessage);
              return runFullSmsSetupTestAction(formData);
            }}
            buttonVariant="secondary"
            disabled={disabled}
            organizationId={organizationId}
            submitLabel="Lancer le test complet"
          />
        </div>

        {disabled && disabledReason ? (
          <p className="text-xs text-[#64748b]">{disabledReason}</p>
        ) : null}
      </div>
    </SmsCard>
  );
}
