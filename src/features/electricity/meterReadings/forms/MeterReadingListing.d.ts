import React from "react";
export declare const DEFAULT_METER_READING_APARTMENT_ID: number | undefined;
type MeterReadingListingProps = {
    selectedApartmentId?: number;
    entryMonth?: string;
    autoDefaultEnabled?: boolean;
    onAutoDefaultResolved?: () => void;
    onAutoFallbackToPreviousMonth?: () => void;
};
declare const MeterReadingListing: React.FC<MeterReadingListingProps>;
export default MeterReadingListing;
