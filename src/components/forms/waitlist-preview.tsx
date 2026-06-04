"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PhoneNumberField } from "@/components/forms/phone-number-field";
import { cn } from "@/lib/utils/cn";
import type { PublicWaitlistService } from "@/lib/waitlist/public-profile";
import type { WaitlistSignupSource } from "@/lib/waitlist/sources";

type WaitlistPreviewProps = {
  slug: string;
  merchantName?: string;
  services?: PublicWaitlistService[];
  signupSource?: WaitlistSignupSource;
  variant?: "standard" | "kiosk";
};

export function WaitlistPreview({
  slug,
  merchantName = slug,
  services = [],
  signupSource = "public_link",
  variant = "standard"
}: WaitlistPreviewProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isKiosk = variant === "kiosk";

  useEffect(() => {
    if (!isKiosk || status !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus("idle");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [isKiosk, status]);

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const response = await fetch("/api/waitlist", {
      method: "POST",
      body: new FormData(event.currentTarget)
    });
    const result = (await response.json()) as {
      errors?: string[];
      status?: string;
    };

    if (!response.ok) {
      setError(result.errors?.join(" ") ?? "Unable to join the waitlist.");
      setStatus("idle");
      return;
    }

    formRef.current?.reset();
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm",
          isKiosk && "min-h-[420px] content-center p-8 text-center"
        )}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Open Spot
          </p>
          <h2
            className={cn(
              "mt-3 text-2xl font-bold",
              isKiosk && "text-4xl"
            )}
          >
            You are on the waitlist.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {merchantName} can now contact you by SMS for last-minute openings.
            If this phone number was already registered, your waitlist
            preferences were updated.
          </p>
        </div>
        <Button
          className={cn(isKiosk && "mx-auto min-h-14 px-7 text-base")}
          onClick={() => setStatus("idle")}
          type="button"
          variant="secondary"
        >
          Start next signup
        </Button>
      </div>
    );
  }

  return (
    <form
      className={cn(
        "grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm",
        isKiosk && "gap-5 p-6 sm:p-8"
      )}
      onSubmit={submitWaitlist}
      ref={formRef}
    >
      <input name="organizationSlug" type="hidden" value={slug} />
      <input name="signupSource" type="hidden" value={signupSource} />
      <div>
        <label className="text-sm font-semibold" htmlFor="fullName">
          Name
        </label>
        <input
          className={cn(
            "mt-2 min-h-11 w-full rounded-md border border-[var(--line)] px-3",
            isKiosk && "min-h-14 text-lg"
          )}
          id="fullName"
          name="fullName"
          placeholder="Customer name"
          required
          type="text"
        />
      </div>
      <PhoneNumberField
        className="font-semibold"
        id="waitlist-phone"
        inputClassName="rounded-md"
        isLarge={isKiosk}
        label="Mobile phone"
        required
        selectClassName="rounded-md"
      />
      <div>
        <label className="text-sm font-semibold" htmlFor="preferredLanguage">
          Preferred language
        </label>
        <select
          className={cn(
            "mt-2 min-h-11 w-full rounded-md border border-[var(--line)] px-3",
            isKiosk && "min-h-14 text-lg"
          )}
          id="preferredLanguage"
          name="preferredLanguage"
        >
          <option value="en">English</option>
          <option value="fr">Francais</option>
        </select>
      </div>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">
          Which services are you interested in? Select all that apply.
        </legend>
        {services.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((service) => (
              <label
                className="group grid cursor-pointer gap-1 rounded-md border border-[var(--line)] bg-white p-3 text-sm transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--primary)] has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[#edf8f3]"
                key={service.id}
              >
                <span className="flex items-start gap-3">
                  <input
                    className="mt-1 h-4 w-4"
                    name="serviceIds"
                    type="checkbox"
                    value={service.id}
                  />
                  <span>
                    <span className="block font-black">{service.name}</span>
                    {service.description ? (
                      <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                        {service.description}
                      </span>
                    ) : null}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-[var(--line)] bg-[#fbfaf7] p-3 text-sm leading-6 text-[var(--muted)]">
            This business has not configured service options yet. You can still
            join the general waitlist.
          </p>
        )}
      </fieldset>
      <label className="flex gap-3 text-sm leading-6 text-[var(--muted)]">
        <input
          className="mt-1 h-4 w-4"
          name="consentAccepted"
          required
          type="checkbox"
        />
        I agree to receive SMS alerts about last-minute openings from{" "}
        {merchantName}. I understand replying does not automatically confirm an
        appointment, the merchant must validate manually, message/data rates may
        apply, and I can reply STOP or ARRET to unsubscribe.
      </label>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <Button
        className={cn(isKiosk && "min-h-14 text-base")}
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Joining..." : "Join waitlist"}
      </Button>
    </form>
  );
}
