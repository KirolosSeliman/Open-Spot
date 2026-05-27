"use client";

import { useState } from "react";

import { formatNorthAmericanPhoneForDisplay } from "@/lib/customers/phone-format";

type PhoneInputProps = {
  className?: string;
  defaultValue?: string;
  id: string;
  name: string;
};

export function PhoneInput({
  className,
  defaultValue = "",
  id,
  name
}: PhoneInputProps) {
  const [value, setValue] = useState(() =>
    formatNorthAmericanPhoneForDisplay(defaultValue)
  );

  return (
    <input
      autoComplete="tel"
      className={className}
      id={id}
      inputMode="tel"
      name={name}
      onChange={(event) => {
        setValue(formatNorthAmericanPhoneForDisplay(event.target.value));
      }}
      placeholder="514-249-4425"
      type="tel"
      value={value}
    />
  );
}
