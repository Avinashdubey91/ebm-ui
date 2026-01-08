export type MeterReadingEntryRowDTO = {
  meterId: number;
  flatId?: number | null;
  flatNumber?: string | null;
  ownerRenterDisplay?: string | null;
  readingTypeIdDefault?: number | null;
  ownerName?: string | null;
  renterName?: string | null;
  isApartmentCommonMeter?: boolean | null;
};

export type MeterReadingBulkEntryDTO = {
  meterId: number;
  currentReading: number;
  readingTypeId?: number | null;
};

export type MeterReadingEntryBulkRequestDTO = {
  apartmentId: number;
  readingDate: string;
  entries: MeterReadingBulkEntryDTO[];
};
