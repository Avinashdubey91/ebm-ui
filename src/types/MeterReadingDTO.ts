export interface MeterReadingDTO {
  meterReadingId?: number;
  meterId: number;
  readingDate: string;
  readingValue: number;
  isEstimated: boolean;
  readingTypeId?: number | null;
  billingFromDate: string;
  billingToDate: string;
  notes?: string | null;
  isModifiedOnce?: boolean;
  isActive?: boolean;
}
