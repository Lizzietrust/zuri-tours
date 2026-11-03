"use client";

import PhoneInput, {
  isValidPhoneNumber,
  type Country,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { useMemo } from "react";

export type PhoneFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: Country;
  hint?: string;
  error?: string | null;
  disabled?: boolean;
  className?: string;
};

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-gray-700";

export function PhoneField({
  id = "phoneNumber",
  label = "Phone",
  value,
  onChange,
  defaultCountry = "NG",
  hint,
  error,
  disabled,
  className,
}: PhoneFieldProps) {
  const invalid = useMemo(() => !!value && !isValidPhoneNumber(value), [value]);
  const showError = error ?? (invalid ? "Enter a valid phone number." : null);

  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      <PhoneInput
        id={id}
        international
        defaultCountry={defaultCountry}
        countryCallingCodeEditable={false}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        disabled={disabled}
        flags={flags}
        placeholder="Enter phone number"
        numberInputProps={{
          className: `${INPUT_CLASS} ${
            showError
              ? "border-amber-400 focus:border-amber-400 focus:ring-amber-100"
              : ""
          }`,
          autoComplete: "tel",
          "aria-invalid": showError ? true : undefined,
        }}
        className="PhoneInput"
      />

      {showError ? (
        <p className="mt-1 text-xs text-amber-700" role="alert">
          {showError}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}
