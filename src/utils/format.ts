/**
 * Converts a string to Title Case (e.g., "EAST SINGHBHUM" -> "East Singhbhum").
 * Handles extra spaces and trims input.
 * 
 * @param text - The string to convert.
 * @returns The title-cased version of the input.
 */
export const toTitleCase = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Safely returns a value for display in the UI.
 * Handles strings, numbers, null, and undefined.
 * 
 * @param value - The input value (string, number, null, or undefined).
 * @param fallback - Optional fallback string (default is "-").
 * @returns The original value (as string) if valid, otherwise the fallback.
 */
export const safeValue = (
  value: string | number | null | undefined,
  fallback: string = "-"
): string => {
  if (typeof value === "string") {
    return value.trim() !== "" ? value : fallback;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return fallback;
};

/**
 * Formats a date into "DD-MMM-YYYY" (e.g., 25-Dec-1991).
 * Uses locale-based formatting consistent with UI expectations.
 * 
 * @param date - The input date (ISO string or Date object).
 * @param fallback - The fallback string if date is invalid or missing.
 * @returns Formatted date string or fallback.
 */
export const formatDate = (
  date?: string | Date,
  fallback: string = "-"
): string => {
  if (!date) return fallback;

  try {
    const d = typeof date === "string" ? new Date(date) : date;

    if (isNaN(d.getTime())) return fallback;

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).replace(/ /g, "-");
  } catch {
    return fallback;
  }
};


/**
 * Truncates a long string to a given max length and appends ellipsis.
 * 
 * @param text - The input string to truncate.
 * @param maxLength - Maximum length before truncation (default is 50).
 * @returns Truncated string with ellipsis if needed.
 */
export const truncate = (text: string, maxLength: number = 50): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
