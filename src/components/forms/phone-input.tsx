"use client";

import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";

import { formatNorthAmericanPhoneForDisplay } from "@/lib/customers/phone-format";

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "value" | "defaultValue"
> & {
  id: string;
  name: string;
  className?: string;
  defaultValue?: string;
  placeholder?: string;
};

export function PhoneInput({
  defaultValue = "",
  placeholder = "514-249-4425",
  ...props
}: PhoneInputProps) {
  const [value, setValue] = useState(() =>
    formatNorthAmericanPhoneForDisplay(defaultValue)
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(formatNorthAmericanPhoneForDisplay(event.target.value));
  };

  return (
    <input
      {...props}
      autoComplete="tel"
      inputMode="tel"
      onChange={handleChange}
      placeholder={placeholder}
      type="tel"
      value={value}
    />
  );
}
