/**
 * Converts a string to Title Case (e.g., "EAST SINGHBHUM" -> "East Singhbhum").
 * Handles extra spaces and trims input.
 */
export const toTitleCase = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Safely returns a value for display in the UI.
 * Handles strings, numbers, null, and undefined.
 */
export const safeValue = (
  value: string | number | null | undefined,
  fallback: string = "-"
): string => {
  if (typeof value === "string") return value.trim() !== "" ? value : fallback;
  if (typeof value === "number") return value.toString();
  return fallback;
};

// Patch Start: timezone-safe date parsing + formatting helpers
const parseToLocalDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // Handle "yyyy-MM-dd" or "yyyy-MM-ddTHH:mm:ss..." by taking first 10 chars
  const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const yyyy = Number(ymdMatch[1]);
    const mm = Number(ymdMatch[2]);
    const dd = Number(ymdMatch[3]);
    if (!yyyy || !mm || !dd) return null;
    // IMPORTANT: create local date (prevents UTC shift)
    return new Date(yyyy, mm - 1, dd);
  }

  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Normalizes any DateInput value into "yyyy-MM-dd" (local, timezone-safe).
 * Use this before saving to API.
 */
export const normalizeToYmd = (value?: string | Date | null): string => {
  const d = parseToLocalDate(value);
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Formats into "dd-MM-yyyy" (e.g., 29-12-2024).
 * Use this in listing/read-only labels.
 */
export const formatDateDmy = (
  value?: string | Date | null,
  fallback: string = "-"
): string => {
  const d = parseToLocalDate(value);
  if (!d) return fallback;
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/**
 * Formats into "DD-MMM-YYYY" (e.g., 25-Dec-1991) using local date parts.
 * Keeps your old behavior but without the unsafe parsing.
 */
export const formatDate = (
  value?: string | Date | null,
  fallback: string = "-"
): string => {
  const d = parseToLocalDate(value);
  if (!d) return fallback;

  const dd = pad2(d.getDate());
  const yyyy = d.getFullYear();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mmm = months[d.getMonth()] ?? "Jan";
  return `${dd}-${mmm}-${yyyy}`;
};
// Patch End

/**
 * Truncates a long string to a given max length and appends ellipsis.
 */
export const truncate = (text: string, maxLength: number = 50): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
