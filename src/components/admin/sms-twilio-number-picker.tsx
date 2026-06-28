"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  assignTwilioPhoneNumberAction,
  listTwilioPhoneNumbersAction
} from "@/lib/admin/sms-sender-actions";

type ListedNumber = {
  sid: string;
  phoneE164: string;
  friendlyName: string;
};

export function SmsTwilioNumberPicker({
  organizationId
}: {
  organizationId: string;
}) {
  const [numbers, setNumbers] = useState<ListedNumber[]>([]);
  const [selectedSid, setSelectedSid] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLoading, startLoadTransition] = useTransition();
  const [isAssigning, startAssignTransition] = useTransition();

  useEffect(() => {
    startLoadTransition(async () => {
      const result = await listTwilioPhoneNumbersAction(organizationId);

      if (!result.ok) {
        setLoadError(result.message);
        return;
      }

      setNumbers(result.numbers);
      setLoadError(null);
    });
  }, [organizationId]);

  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">Sélectionner un numéro Twilio</p>
        <Button
          disabled={isLoading}
          isLoading={isLoading}
          onClick={() => {
            startLoadTransition(async () => {
              const result = await listTwilioPhoneNumbersAction(organizationId);

              if (!result.ok) {
                setLoadError(result.message);
                return;
              }

              setNumbers(result.numbers);
              setLoadError(null);
            });
          }}
          type="button"
          variant="outline"
        >
          Actualiser
        </Button>
      </div>

      {loadError ? (
        <p className="text-sm font-bold text-red-700 break-words">{loadError}</p>
      ) : null}

      {numbers.length === 0 && !isLoading && !loadError ? (
        <p className="text-sm text-[var(--muted)]">
          Aucun numéro SMS disponible dans ce compte Twilio.
        </p>
      ) : (
        <ul className="grid gap-2">
          {numbers.map((number) => (
            <li
              className={`rounded-xl border px-3 py-2 text-sm ${
                selectedSid === number.sid
                  ? "border-[var(--primary)] bg-blue-50"
                  : "border-[var(--line)]"
              }`}
              key={number.sid}
            >
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span>
                  <span className="font-black">{number.phoneE164}</span>
                  {number.friendlyName ? (
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      {number.friendlyName}
                    </span>
                  ) : null}
                </span>
                <input
                  checked={selectedSid === number.sid}
                  name="twilioNumber"
                  onChange={() => setSelectedSid(number.sid)}
                  type="radio"
                  value={number.sid}
                />
              </label>
            </li>
          ))}
        </ul>
      )}

      <Button
        disabled={!selectedSid || isAssigning}
        isLoading={isAssigning}
        onClick={() => {
          startAssignTransition(async () => {
            const formData = new FormData();
            formData.set("organizationId", organizationId);
            formData.set("phoneNumberSid", selectedSid);
            const result = await assignTwilioPhoneNumberAction(formData);
            setActionMessage(result.message);
          });
        }}
        type="button"
      >
        Assigner ce numéro
      </Button>

      {actionMessage ? (
        <p className="text-sm font-bold text-[var(--muted)] break-words">{actionMessage}</p>
      ) : null}
    </div>
  );
}
