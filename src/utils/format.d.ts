/**
 * Converts a string to Title Case (e.g., "EAST SINGHBHUM" -> "East Singhbhum").
 * Handles extra spaces and trims input.
 */
export declare const toTitleCase: (text: string) => string;
/**
 * Safely returns a value for display in the UI.
 * Handles strings, numbers, null, and undefined.
 */
export declare const safeValue: (value: string | number | null | undefined, fallback?: string) => string;
/**
 * Normalizes any DateInput value into "yyyy-MM-dd" (local, timezone-safe).
 * Use this before saving to API.
 */
export declare const normalizeToYmd: (value?: string | Date | null) => string;
/**
 * Formats into "dd-MM-yyyy" (e.g., 29-12-2024).
 * Use this in listing/read-only labels.
 */
export declare const formatDateDmy: (value?: string | Date | null, fallback?: string) => string;
/**
 * Formats into "DD-MMM-YYYY" (e.g., 25-Dec-1991) using local date parts.
 * Keeps your old behavior but without the unsafe parsing.
 */
export declare const formatDate: (value?: string | Date | null, fallback?: string) => string;
/**
 * Truncates a long string to a given max length and appends ellipsis.
 */
export declare const truncate: (text: string, maxLength?: number) => string;
/**
 * Formats numeric id with prefix (e.g. 1 -> MG-1).
 */
export declare const formatPrefixedId: (prefix: string, value: number | string | null | undefined, fallback?: string) => string;
/**
 * Abbreviates multi-word names by converting all words except the last one to initials.
 * Example: "Mittal Parkview Residency" -> "M P Residency"
 */
export declare const abbreviateWithLastWord: (text: string | null | undefined, fallback?: string) => string;
/**
 * Converts full name to acronym.
 * Example:
 * "Mittal Parkview Residency" -> "MPR"
 */
export declare const toAcronym: (text: string | null | undefined, fallback?: string) => string;
