"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import {
  formatInternationalPhoneForDisplay,
  formatNorthAmericanPhoneForDisplay
} from "@/lib/customers/phone-format";
import { cn } from "@/lib/utils/cn";

const phoneCountries = [
  { code: "CA", name: "Canada", callingCode: "+1" },
  { code: "US", name: "United States", callingCode: "+1" },
  { code: "FR", name: "France", callingCode: "+33" },
  { code: "GB", name: "United Kingdom", callingCode: "+44" },
  { code: "MX", name: "Mexico", callingCode: "+52" },
  { code: "MA", name: "Morocco", callingCode: "+212" },
  { code: "EG", name: "Egypt", callingCode: "+20" },
  { code: "LB", name: "Lebanon", callingCode: "+961" },
  { code: "SY", name: "Syria", callingCode: "+963" },
  { code: "QA", name: "Qatar", callingCode: "+974" },
  { code: "AE", name: "UAE", callingCode: "+971" },
  { code: "SA", name: "Saudi Arabia", callingCode: "+966" },
  { code: "TR", name: "Turkey", callingCode: "+90" }
] as const;

export type PhoneCountryCode = (typeof phoneCountries)[number]["code"];

type PhoneNumberFieldProps = {
  id: string;
  label: string;
  name?: string;
  countryName?: string;
  nationalName?: string;
  defaultCountryCode?: PhoneCountryCode;
  defaultNationalNumber?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  selectClassName?: string;
  isLarge?: boolean;
};

function formatForCountry(callingCode: string, value: string) {
  return callingCode === "+1"
    ? formatNorthAmericanPhoneForDisplay(value)
    : formatInternationalPhoneForDisplay(value);
}

export function PhoneNumberField({
  id,
  label,
  name = "phone",
  countryName = "phoneCountry",
  nationalName = "phoneNational",
  defaultCountryCode = "CA",
  defaultNationalNumber = "",
  required = false,
  className,
  inputClassName,
  selectClassName,
  isLarge = false
}: PhoneNumberFieldProps) {
  const [countryIso, setCountryIso] = useState(defaultCountryCode);
  const selectedCountry =
    phoneCountries.find((country) => country.code === countryIso) ??
    phoneCountries[0];
  const [nationalNumber, setNationalNumber] = useState(() =>
    formatForCountry(selectedCountry.callingCode, defaultNationalNumber)
  );
  const canonicalPhone = useMemo(() => {
    const digits = nationalNumber.replace(/\D/g, "");
    return digits ? `${selectedCountry.callingCode}${digits}` : "";
  }, [selectedCountry.callingCode, nationalNumber]);

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCountryIso = event.target.value;
    const nextCountry =
      phoneCountries.find((country) => country.code === nextCountryIso) ??
      phoneCountries[0];
    setCountryIso(nextCountry.code);
    setNationalNumber((current) =>
      formatForCountry(nextCountry.callingCode, current)
    );
  };

  const handleNationalChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNationalNumber(
      formatForCountry(selectedCountry.callingCode, event.target.value)
    );
  };

  return (
    <div className={cn("grid gap-2 text-sm font-bold", className)}>
      <label htmlFor={`${id}-national`}>{label}</label>
      <div className="grid gap-2 sm:grid-cols-[minmax(9rem,0.9fr)_1.4fr]">
        <select
          className={cn(
            "min-h-11 rounded-xl border border-[var(--line)] bg-white px-3",
            isLarge && "min-h-14 text-lg",
            selectClassName
          )}
          name={`${countryName}Iso`}
          onChange={handleCountryChange}
          value={countryIso}
        >
          {phoneCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} {country.callingCode}
            </option>
          ))}
        </select>
        <input
          autoComplete="tel"
          className={cn(
            "min-h-11 rounded-xl border border-[var(--line)] bg-white px-3",
            isLarge && "min-h-14 text-lg",
            inputClassName
          )}
          id={`${id}-national`}
          inputMode="tel"
          name={nationalName}
          onChange={handleNationalChange}
          placeholder={
            selectedCountry.callingCode === "+1"
              ? "514-249-4425"
              : "Phone number"
          }
          required={required}
          type="tel"
          value={nationalNumber}
        />
      </div>
      <input name={countryName} type="hidden" value={selectedCountry.callingCode} />
      <input name={name} type="hidden" value={canonicalPhone} />
    </div>
  );
}
