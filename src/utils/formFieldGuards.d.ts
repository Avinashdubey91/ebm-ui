import React from "react";
/** ---------- Visual validity helpers (no green/tick styles) ---------- */
export declare const applyInvalidClassOnly: (input: HTMLInputElement) => void;
/** Compose multiple handlers into one (preserves order, typed) */
export declare const compose: <T extends React.SyntheticEvent<Element, Event>>(...fns: Array<((e: T) => void) | undefined>) => (e: T) => void;
/** ---------- Core sanitizers ---------- */
export declare const sanitizeDigits: (s: string, max: number) => string;
export declare const formatAadhaar: (digits: string) => string;
export declare const normalizeEmail: (s: string) => string;
/** ---------- Generic numeric onInput ---------- */
export declare const onInputDigits: (max: number) => (e: React.FormEvent<HTMLInputElement>) => void;
/** ---------- Numeric props builder (phone, pin, etc.) ---------- */
export declare const buildNumericInputProps: (opts: {
    maxDigits: number;
    pattern?: string;
    title?: string;
    required?: boolean;
    validateOnBlur?: boolean;
}) => {
    onBlur?: ((e: React.FocusEvent<HTMLInputElement>) => void) | undefined;
    onInput: (e: React.FormEvent<HTMLInputElement>) => void;
    required?: boolean | undefined;
    title?: string | undefined;
    pattern?: string | undefined;
    inputMode: "numeric";
    maxLength: number;
};
/** ---------- Aadhaar helpers ---------- */
export declare const applyAadhaarInvalidClass: (input: HTMLInputElement, required: boolean) => void;
export declare const buildAadhaarProps: (opts?: {
    title?: string;
    required?: boolean;
    validateOnBlur?: boolean;
    /** When true, we add a hard browser pattern that blocks submit */
    enforce?: boolean;
}) => {
    onBlur?: ((e: React.FocusEvent<HTMLInputElement>) => void) | undefined;
    onInput: (e: React.FormEvent<HTMLInputElement>) => void;
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
    required?: boolean | undefined;
    title: string;
    pattern?: string | undefined;
    inputMode: "numeric";
    maxLength: number;
};
export declare const formatAadhaarForDisplay: (value: string, isFocused: boolean) => string;
/** ---------- Email helpers ---------- */
/** Require at least one dot label in domain, e.g. example@domain.com */
export declare const emailRegex: RegExp;
/** Red-outline logic for email that relies on our regex (not browser quirks) */
export declare const applyInvalidEmailClass: (input: HTMLInputElement) => void;
export declare const onInputEmailNoSpaces: (e: React.FormEvent<HTMLInputElement>) => void;
export declare const onBlurNormalizeEmail: (setValue?: (normalized: string) => void) => (e: React.FocusEvent<HTMLInputElement>) => void;
export declare const onInvalidEmail: (e: React.FormEvent<HTMLInputElement>) => void;
/** Email props builder (uses our regex for red outline) */
export declare const buildEmailProps: (opts?: {
    required?: boolean;
    maxLength?: number;
    title?: string;
}) => {
    type: "email";
    inputMode: "email";
    autoComplete: string;
    required: boolean;
    maxLength: number;
    title: string;
    onInput: (e: React.FormEvent<HTMLInputElement>) => void;
    onInvalid: (e: React.FormEvent<HTMLInputElement>) => void;
};
