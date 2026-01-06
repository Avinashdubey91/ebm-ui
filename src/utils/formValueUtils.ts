export const sanitizeDecimal = (value: string, maxDecimals: number): string => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;

  const decimals = rest.join("").slice(0, maxDecimals);
  return decimals.length ? `${whole}.${decimals}` : whole;
};

export const toNullableNumber = (value: string): number | null => {
  const t = value.trim();
  if (!t) return null;

  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export const timeToHHmm = (value?: string | null): string => {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
};

export const hhmmToTimeSpan = (hhmm: string): string | null => {
  const t = hhmm.trim();
  if (!t) return null;
  return t.length === 5 ? `${t}:00` : t;
};

export const buildIdLabelMap = <T extends Record<string, unknown>>(
  items: T[],
  idKey: keyof T,
  labelBuilder: (item: T) => string
): Map<number, string> => {
  const map = new Map<number, string>();

  items.forEach((it) => {
    const idVal = it[idKey];
    if (typeof idVal === "number") {
      map.set(idVal, labelBuilder(it));
    }
  });

  return map;
};

export const labelOrId = (label: string | undefined, id: number, prefix: string) => {
  if (label && label.trim()) return label;
  return id ? `${prefix} #${id}` : "-";
};