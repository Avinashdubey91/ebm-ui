// src/utils/formFieldGuards.ts
import React from "react";

/** ---------- Visual validity helpers (no green/tick styles) ---------- */
export const applyInvalidClassOnly = (input: HTMLInputElement) => {
  const invalid = !input.checkValidity();
  input.classList.toggle("is-invalid", invalid);
  input.classList.remove("is-valid");
};

/** Compose multiple handlers into one (preserves order, typed) */
export const compose =
  <T extends React.SyntheticEvent<Element, Event>>(
    ...fns: Array<((e: T) => void) | undefined>
  ) =>
  (e: T) => {
    fns.forEach((fn) => fn?.(e));
  };

/** ---------- Core sanitizers ---------- */
export const sanitizeDigits = (s: string, max: number) =>
  s.replace(/\D/g, "").slice(0, max);

export const formatAadhaar = (digits: string) => {
  const d = digits.replace(/\D/g, "");
  if (d.length !== 12) return d;
  return d.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
};

export const normalizeEmail = (s: string) => s.trim().toLowerCase();

/** ---------- Generic numeric onInput ---------- */
export const onInputDigits =
  (max: number) =>
  (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    input.value = sanitizeDigits(input.value, max);
    input.setCustomValidity("");
    applyInvalidClassOnly(input);
  };

/** ---------- Numeric props builder (phone, pin, etc.) ---------- */
export const buildNumericInputProps = (opts: {
  maxDigits: number;
  pattern?: string;
  title?: string;
  required?: boolean;
  validateOnBlur?: boolean;
}) => {
  const { maxDigits, pattern, title, required, validateOnBlur = true } = opts;
  return {
    inputMode: "numeric" as const,
    maxLength: maxDigits,
    ...(pattern ? { pattern } : {}),
    ...(title ? { title } : {}),
    ...(required ? { required: true } : {}),
    onInput: onInputDigits(maxDigits),
    ...(validateOnBlur
      ? {
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            applyInvalidClassOnly(e.currentTarget);
          },
        }
      : {}),
  };
};

/** ---------- Aadhaar helpers ---------- */
// src/utils/formFieldGuards.ts

// Add this helper near the top with the other helpers
export const applyAadhaarInvalidClass = (
  input: HTMLInputElement,
  required: boolean
) => {
  const digits = sanitizeDigits(input.value, 12);
  const invalid = required
    ? digits.length !== 12
    : digits.length > 0 && digits.length !== 12; // show red if user typed something but not 12
  input.classList.toggle("is-invalid", invalid);
  input.classList.remove("is-valid");
};

// Replace your existing buildAadhaarProps with this version
export const buildAadhaarProps = (opts?: {
  title?: string;
  required?: boolean;
  validateOnBlur?: boolean;
  /** When true, we add a hard browser pattern that blocks submit */
  enforce?: boolean;
}) => {
  const {
    title,
    required = false,
    validateOnBlur = true,
    enforce = false, // default: no hard block
  } = opts ?? {};

  return {
    inputMode: "numeric" as const,
    maxLength: 14, // 1234-1234-1234
    ...(enforce ? { pattern: "^(?:\\d{12}|\\d{4}-\\d{4}-\\d{4})$" } : {}),
    title: title ?? "Aadhaar must be exactly 12 digits",
    ...(required ? { required: true } : {}),
    onInput: onInputDigits(12),
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      // show raw while editing
      e.currentTarget.value = sanitizeDigits(e.currentTarget.value, 12);
    },
    ...(validateOnBlur
      ? {
          onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
            applyAadhaarInvalidClass(
              e.currentTarget as HTMLInputElement,
              required
            ),
        }
      : {}),
  };
};

export const formatAadhaarForDisplay = (value: string, isFocused: boolean) =>
  isFocused ? sanitizeDigits(value ?? "", 12) : formatAadhaar(value ?? "");

/** ---------- Email helpers ---------- */
/** Require at least one dot label in domain, e.g. example@domain.com */
export const emailRegex =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

/** Red-outline logic for email that relies on our regex (not browser quirks) */
export const applyInvalidEmailClass = (input: HTMLInputElement) => {
  // Treat empty as potentially required—let browser handle required attr.
  const value = input.value;
  const required = input.hasAttribute("required");
  const isEmpty = value.length === 0;

  // If empty and required -> invalid; if empty and not required -> not invalid
  const invalid =
    (required && isEmpty) || (!isEmpty && !emailRegex.test(value));

  input.classList.toggle("is-invalid", invalid);
  input.classList.remove("is-valid");
  // Also set a friendly message for the invalid state
  input.setCustomValidity(
    invalid && !isEmpty
      ? "Enter a valid email like name@example.com"
      : ""
  );
};

export const onInputEmailNoSpaces = (e: React.FormEvent<HTMLInputElement>) => {
  const input = e.currentTarget;
  if (/\s/.test(input.value)) input.value = input.value.replace(/\s+/g, "");
  input.setCustomValidity("");
  applyInvalidEmailClass(input);
};

export const onBlurNormalizeEmail =
  (setValue?: (normalized: string) => void) =>
  (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const normalized = normalizeEmail(input.value);
    input.value = normalized;
    if (setValue) setValue(normalized);

    // Do not block blur; just reflect red state if invalid
    applyInvalidEmailClass(input);
  };

export const onInvalidEmail = (e: React.FormEvent<HTMLInputElement>) => {
  const input = e.currentTarget;
  // Browser fired invalid; make sure our class reflects it
  applyInvalidEmailClass(input);
};

/** Email props builder (uses our regex for red outline) */
export const buildEmailProps = (opts?: {
  required?: boolean;
  maxLength?: number;
  title?: string;
}) => {
  const {
    required = true,
    maxLength = 254,
    title = "Enter a valid email like name@example.com",
  } = opts ?? {};
  return {
    type: "email" as const, // keep native keyboard on mobile
    inputMode: "email" as const,
    autoComplete: "email",
    required,
    maxLength,
    // NOTE: we intentionally skip pattern here and rely on emailRegex
    title,
    onInput: onInputEmailNoSpaces,
    onInvalid: onInvalidEmail,
    // Attach onBlur in the component with onBlurNormalizeEmail(setter)
  };
};
