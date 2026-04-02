export declare const sanitizeDecimal: (value: string, maxDecimals: number) => string;
export declare const toNullableNumber: (value: string) => number | null;
export declare const timeToHHmm: (value?: string | null) => string;
export declare const hhmmToTimeSpan: (hhmm: string) => string | null;
export declare const buildIdLabelMap: <T extends Record<string, unknown>>(items: T[], idKey: keyof T, labelBuilder: (item: T) => string) => Map<number, string>;
export declare const labelOrId: (label: string | undefined, id: number, prefix: string) => string;
